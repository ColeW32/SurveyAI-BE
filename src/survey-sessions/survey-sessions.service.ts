import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { PureSpectrumSurvey } from '../purespectrum/purespectrum.service';
import { FieldValue } from 'firebase-admin/firestore';
import { RewardService } from '../rewards/rewards.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SurveySessionsService {
	private readonly logger = new Logger(SurveySessionsService.name);
	private readonly sessionsCollection = 'surveySessions';

	constructor(
		private readonly firebaseService: FirebaseService,
		private readonly rewardService: RewardService,
	) { }

	async startSurveySession(userId: string, surveyId: string | number): Promise<{ redirectUrl: string }> {
		const cacheRef = this.firebaseService.firestore.collection('surveyCache').doc(userId);
		const cacheDoc = await cacheRef.get();

		if (!cacheDoc.exists) {
			throw new BadRequestException('No active survey list found. Please refresh.');
		}

		const cachedSurveys = cacheDoc.data()?.surveys || [];
		const targetSurvey = cachedSurveys.find(s => s.surveyId == surveyId);

		if (!targetSurvey) {
			this.logger.warn(`User ${userId} tried to start a survey (${surveyId}) not found in their cache.`);
			throw new NotFoundException('Survey not found or has expired.');
		}

		const { cpi, entryLink } = targetSurvey;
		const providerSessionId = uuidv4();

		const sessionRef = this.firebaseService.firestore.collection(this.sessionsCollection).doc(providerSessionId);
		await sessionRef.set({
			userId,
			surveyId: surveyId,
			providerSessionId,
			status: 'started',
			lockedPayout: cpi,
			createdAt: FieldValue.serverTimestamp(),
		});

		const url = new URL(entryLink);
		url.searchParams.set('sessiontoken', providerSessionId);
		url.searchParams.set('memberid', userId);

		this.logger.log(`Started survey session ${providerSessionId} for user ${userId}`);
		return { redirectUrl: url.toString() };
	}

	async completeSurveyByWebhook(payload: { transactionId: string, memberId: string, cpi: number, surveyID: number }): Promise<{ success: boolean; rewardedAmount: number }> {
		const { transactionId, memberId, surveyID } = payload;
		const providerSessionId = transactionId;
		const userId = memberId;

		const sessionRef = this.firebaseService.firestore.collection(this.sessionsCollection).doc(providerSessionId);
		const sessionDoc = await sessionRef.get();

		if (!sessionDoc.exists) {
			this.logger.error(`Webhook error: No survey session found for providerSessionId: ${providerSessionId}`);
			throw new NotFoundException('Survey session not found.');
		}

		const sessionData = sessionDoc.data();

		if (sessionData?.userId !== userId) {
			this.logger.error(`Webhook security violation: User mismatch. Session user: ${sessionData?.userId}, Webhook user: ${userId}`);
			throw new ConflictException('User mismatch.');
		}

		if (sessionData?.status !== 'started') {
			this.logger.warn(`Webhook warning: Attempt to complete an already processed survey. SessionId: ${providerSessionId}, Status: ${sessionData?.status}`);
			return { success: true, rewardedAmount: 0 };
		}
		const payout = sessionData.lockedPayout;
		this.logger.log(`Processing completion for session ${providerSessionId}. User: ${userId}, Locked Payout: ${payout}`);

		await this.rewardService.grantReward({
			userId,
			amount: payout,
			type: 'Survey Reward',
			meta: {
				source: 'PureSpectrum',
				surveyId: sessionData.surveyId,
				surveySessionId: providerSessionId,
			}
		});

		const cleanPayload = Object.entries(payload).reduce((acc, [key, value]) => {
			if (value !== undefined) {
				acc[key] = value;
			}
			return acc;
		}, {});

		await sessionRef.update({
			status: 'completed',
			completedAt: FieldValue.serverTimestamp(),
			rewardedAmount: payout,
			webhookPayload: cleanPayload,
		});


		return { success: true, rewardedAmount: payout };
	}
}