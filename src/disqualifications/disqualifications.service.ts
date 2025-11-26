import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { RewardService } from '../rewards/rewards.service';
import { ProgressService } from '../progress/progress.service';
import { FieldValue } from 'firebase-admin/firestore';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DisqualificationService {
	private readonly logger = new Logger(DisqualificationService.name);
	private readonly rewardAmount: number;
	private readonly dailyCap: number;
	private readonly isDqRewardEnabled: boolean

	constructor(
		private readonly firebaseService: FirebaseService,
		private readonly rewardService: RewardService,
		private readonly progressService: ProgressService,
		private readonly configService: ConfigService,
	) {
		const rewardAmountStr = this.configService.get<string>('DQ_REWARD_AMOUNT', '0.02');
		this.rewardAmount = parseFloat(rewardAmountStr);

		const dailyCapStr = this.configService.get<string>('DQ_DAILY_CAP', '5');
		this.dailyCap = parseInt(dailyCapStr, 10);
		this.isDqRewardEnabled = this.configService.get<string>('REWARDS_DQ_ENABLED') === 'true';
	}

	async processDisqualification(payload: { userId: string, providerSessionId: string, provider: string }): Promise<any> {
		const { userId, providerSessionId, provider } = payload;
		const todayUTC = new Date().toISOString().split('T')[0];

		const sessionRef = this.firebaseService.firestore.collection('surveySessions').doc(providerSessionId);
		const dailyCounterRef = this.firebaseService.firestore.collection('users').doc(userId).collection('dailyCounters').doc(todayUTC);

		let amountRewarded = 0;
		let dailyPaidDQCountAfter = 0;
		let surveyId = '';

		await this.firebaseService.firestore.runTransaction(async (transaction) => {
			const sessionDoc = await transaction.get(sessionRef);

			if (!sessionDoc.exists) {
				this.logger.warn(`DQ attempt for invalid session ${providerSessionId}.`);
				throw new NotFoundException('Session is invalid.');
			}

			const sessionData = sessionDoc.data();

			if (sessionData?.status !== 'started') {
				this.logger.warn(`DQ attempt for already processed session ${providerSessionId}. Status: ${sessionData?.status}`);
				throw new NotFoundException('Session is already processed.');
			}

			surveyId = sessionData.surveyId;

			const counterDoc = await transaction.get(dailyCounterRef);
			const counterData = counterDoc.data();
			const currentCount = counterDoc.exists && counterData ? counterData.paidDqCount : 0;

			dailyPaidDQCountAfter = currentCount;

			if (currentCount < this.dailyCap && this.isDqRewardEnabled) {
				amountRewarded = this.rewardAmount;
				dailyPaidDQCountAfter++;
				const counterUpdate = { paidDqCount: FieldValue.increment(1) };
				if (!counterDoc.exists) {
					transaction.set(dailyCounterRef, counterUpdate);
				} else {
					transaction.update(dailyCounterRef, counterUpdate);
				}
			}

			transaction.update(sessionRef, { status: 'disqualified', processedAt: FieldValue.serverTimestamp() });
		});

		if (amountRewarded > 0) {
			await this.rewardService.grantReward({
				userId, amount: amountRewarded, type: 'Disqualification Reward',
				meta: { provider, surveyId, dailyPaidDQCountAfter },
			});
		} else {
			const auditLogRef = this.firebaseService.firestore.collection('auditLogs').doc();
			await auditLogRef.set({
				event: 'dq_cap_reached', userId, provider, surveyId, providerSessionId,
				timestamp: FieldValue.serverTimestamp(), meta: { dailyPaidDQCount: dailyPaidDQCountAfter },
			});
		}

		const progressPayload = await this.progressService.addPoints(userId, 'disqualification', providerSessionId);

		return {
			status: 'ok', outcome: 'disqualified', amountRewarded,
			dailyPaidDQCount: dailyPaidDQCountAfter, cap: this.dailyCap,
			progressUpdate: progressPayload,
		};
	}
}