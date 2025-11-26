import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { FieldValue } from 'firebase-admin/firestore';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProgressService {
	private readonly logger = new Logger(ProgressService.name);
	private readonly goalPoints: number;
	private readonly dqPoints: number;
	private readonly completionPoints: number;

	constructor(
		private readonly firebaseService: FirebaseService,
		private readonly configService: ConfigService,
	) {
		this.goalPoints = parseInt(this.configService.get<string>('PROGRESS_GOAL_POINTS', '50'), 10);
		this.dqPoints = parseInt(this.configService.get<string>('PROGRESS_POINTS_DQ', '2'), 10);
		this.completionPoints = parseInt(this.configService.get<string>('PROGRESS_POINTS_COMPLETION', '7'), 10);
	}

	async addPoints(userId: string, type: 'disqualification' | 'completion', surveySessionId: string): Promise<any> {
		const progressRef = this.firebaseService.firestore.collection('userProgress').doc(userId);

		const eventPayload = await this.firebaseService.firestore.runTransaction(async (transaction) => {
			const progressDoc = await transaction.get(progressRef);
			const progressData = progressDoc.exists ? progressDoc.data() : { earnedPoints: 0, phase: 'LEARNING', processedSessions: [] };

			if (progressData?.processedSessions.includes(surveySessionId)) {
				this.logger.warn(`Points for session ${surveySessionId} already awarded. Skipping.`);
				return null;
			}

			const phaseBefore = progressData?.phase;
			const deltaPoints = type === 'disqualification' ? this.dqPoints : this.completionPoints;
			const earnedPointsAfter = progressData?.earnedPoints + deltaPoints;

			const updates: any = {
				earnedPoints: earnedPointsAfter,
				processedSessions: FieldValue.arrayUnion(surveySessionId),
			};

			let reached100ThisEvent = false;
			if (earnedPointsAfter >= this.goalPoints && phaseBefore === 'LEARNING') {
				updates.phase = 'PLACING';
				updates.reached100At = FieldValue.serverTimestamp();
				updates.showSurveysForcedCtaPending = true;
				reached100ThisEvent = true;
			}

			if (!progressDoc.exists) {
				transaction.set(progressRef, { ...progressData, ...updates });
			} else {
				transaction.update(progressRef, updates);
			}
			const finalCtaPending = updates.showSurveysForcedCtaPending !== undefined
				? updates.showSurveysForcedCtaPending
				: progressData?.showSurveysForcedCtaPending || false;

			return {
				userId, deltaPoints, earnedPointsAfter, goalPoints: this.goalPoints, phaseBefore,
				phaseAfter: updates.phase || phaseBefore, reached100ThisEvent,
				showSurveysForcedCtaPending: finalCtaPending,
			};
		});

		if (eventPayload) {
			this.logger.log(`Awarded ${eventPayload.deltaPoints} points to user ${userId} for ${type}.`);
		}
		return eventPayload;
	}

	async getUserProgress(userId: string) {
		const progressRef = this.firebaseService.firestore.collection('userProgress').doc(userId);
		const doc = await progressRef.get();

		if (!doc.exists) {
			return {
				earnedPoints: 0,
				goalPoints: this.goalPoints,
				phase: 'LEARNING',
				showSurveysForcedCtaPending: false,
				percent: 0,
			};
		}
		const data = doc.data();
		const earnedPoints = data?.earnedPoints || 0;

		const percent = Math.min(100, Math.floor((earnedPoints / this.goalPoints) * 100));

		return {
			earnedPoints,
			goalPoints: this.goalPoints,
			phase: data?.phase || 'LEARNING',
			showSurveysForcedCtaPending: data?.showSurveysForcedCtaPending || false,
			percent,
		};
	}

	async consumeForcedCta(userId: string) {
		const progressRef = this.firebaseService.firestore.collection('userProgress').doc(userId);

		const finalData = await this.firebaseService.firestore.runTransaction(async (transaction) => {
			const doc = await transaction.get(progressRef);
			if (!doc.exists) {
				return null;
			}

			const data = doc.data();

			if (data?.showSurveysForcedCtaPending === false) {
				return data;
			}

			transaction.update(progressRef, {
				showSurveysForcedCtaPending: false,
				showSurveysForcedCtaConsumedAt: FieldValue.serverTimestamp(),
			});

			return {
				...data,
				showSurveysForcedCtaPending: false,
			};
		});

		return finalData;
	}

}