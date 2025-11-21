import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { RewardService } from '../rewards/rewards.service';

const ALLOWED_DUMMY_SURVEY_VALUES = [0.15, 0.25, 0.35, 0.55, 0.65, 0.75, 0.90, 1.10];
const MAX_DUMMY_SURVEY_VALUE = 1.10;

@Injectable()
export class SurveysService {
	private readonly logger = new Logger(SurveysService.name);

	constructor(
		private readonly firebaseService: FirebaseService,
		private readonly rewardService: RewardService,
	) { }

	async completeDummySurvey(userId: string, submittedAmount: number): Promise<{ rewardedAmount: number }> {
		const userRef = this.firebaseService.firestore.collection('users').doc(userId);
		const userDoc = await userRef.get();

		if (!userDoc.exists) {
			throw new BadRequestException('User not found.');
		}

		const userData = userDoc.data();

		if (userData?.hasCompletedDummySurvey === true) {
			this.logger.warn(`User ${userId} attempted to complete dummy survey again.`);
			throw new ForbiddenException('This survey can only be completed once.');
		}

		let finalAmountToReward = MAX_DUMMY_SURVEY_VALUE;
		if (ALLOWED_DUMMY_SURVEY_VALUES.includes(submittedAmount)) {
			finalAmountToReward = submittedAmount;
		} else {
			this.logger.warn(`User ${userId} submitted an invalid amount: ${submittedAmount}. Defaulting to max value.`);
		}

		await this.rewardService.grantReward({
			userId,
			amount: finalAmountToReward,
			type: 'Survey Reward',
			meta: { reason: 'Post-Account Creation Dummy Survey' }
		});

		await userRef.update({
			hasCompletedDummySurvey: true,
		});

		this.logger.log(`User ${userId} completed dummy survey and was rewarded ${finalAmountToReward}`);

		return { rewardedAmount: finalAmountToReward };
	}
}