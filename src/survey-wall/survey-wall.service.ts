import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { PureSpectrumService, PureSpectrumSurvey } from '../purespectrum/purespectrum.service';
import { enrichSurveysWithSyntheticData } from './survey-enrichment.util';
import { SurveySessionsService } from 'src/survey-sessions/survey-sessions.service';

const CACHE_TTL_MINUTES = 10;

@Injectable()
export class SurveyWallService {
	private readonly logger = new Logger(SurveyWallService.name);

	constructor(
		private readonly firebaseService: FirebaseService,
		private readonly pureSpectrumService: PureSpectrumService,
		private readonly surveySessionsService: SurveySessionsService,
	) { }

	private async getFormattedProfileData(userId: string): Promise<Record<string, string>> {
		const userDoc = await this.firebaseService.firestore.collection('users').doc(userId).get();
		if (!userDoc.exists) return {};

		const userData = userDoc.data();

		const profileData: Record<string, string> = {};

		if (userData?.gender) {
			profileData['211'] = userData.gender === 'male' ? '1' : '2';
		}
		if (userData?.dob) {
			const birthYear = new Date(userData.dob).getFullYear();
			const age = new Date().getFullYear() - birthYear;
			profileData['212'] = String(age);
		}
		if (userData?.zip) {
			profileData['229'] = userData.zip;
		}

		return profileData;
	}

	async getSurveyWall(userId: string, ipAddress: string, userAgent: string): Promise<any[]> {

		const cacheRef = this.firebaseService.firestore.collection('surveyCache').doc(userId);
		const cacheDoc = await cacheRef.get();
		let cachedSurveys: PureSpectrumSurvey[] = [];
		if (cacheDoc.exists) {
			const cacheData = cacheDoc.data();
			cachedSurveys = cacheData?.surveys || [];
			const cacheAgeMinutes = (Date.now() - cacheData?.timestamp.toMillis()) / 1000 / 60;
			if (cacheAgeMinutes < CACHE_TTL_MINUTES) {
				this.logger.log(`Returning cached surveys for user ${userId}.`);
				return cacheData?.surveys;
			}
		}
		const profileData = await this.getFormattedProfileData(userId);
		const respondentId = `${userId}-${Date.now()}`;

		let newSurveys: PureSpectrumSurvey[] = await this.pureSpectrumService.fetchSurveys({
			memberId: userId,
			respondentId,
			ipAddress,
			userAgent,
			profileData,
			maxNumberOfSurveysReturned: 20,
		});


		let finalSurveys = [...newSurveys];
		if (finalSurveys.length < 10 && cachedSurveys.length > 0) {
			const existingIds = new Set(finalSurveys.map(s => s.surveyId));
			const surveysFromCache = cachedSurveys.filter(s => !s.isPlaceholder && !existingIds.has(s.surveyId));
			finalSurveys.push(...surveysFromCache);
		}

		finalSurveys = finalSurveys.slice(0, 10);
		while (finalSurveys.length < 10) {
			finalSurveys.push({
				surveyId: `placeholder-${finalSurveys.length}`,
				cpi: 0,
				estimatedLoi: 0,
				entryLink: '',
				isPlaceholder: true,
			});
		}

		const enrichedSurveys = enrichSurveysWithSyntheticData(finalSurveys, userId);

		if (enrichedSurveys.some(s => !s.isPlaceholder)) {
			await cacheRef.set({
				surveys: enrichedSurveys,
				timestamp: new Date(),
			});
			this.logger.log(`Updated survey cache for user ${userId}.`);
		}

		return enrichedSurveys;
	}
}