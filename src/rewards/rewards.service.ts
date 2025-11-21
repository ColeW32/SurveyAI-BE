import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export interface GrantRewardPayload {
	userId: string;
	amount: number;
	type: string;
	meta?: Record<string, any>;
}

@Injectable()
export class RewardService {
	private readonly logger = new Logger(RewardService.name);

	constructor(private readonly firebaseService: FirebaseService) { }

	async grantReward(payload: GrantRewardPayload): Promise<void> {
		const { userId, amount, type, meta = {} } = payload;

		if (amount <= 0) {
			this.logger.warn(`Attempted to grant non-positive reward for user ${userId}. Amount: ${amount}`);
			return;
		}

		const userRef = this.firebaseService.firestore.collection('users').doc(userId);
		const transactionsRef = userRef.collection('transactions');

		try {
			await this.firebaseService.firestore.runTransaction(async (transaction) => {
				const newTransactionRef = transactionsRef.doc();
				transaction.set(newTransactionRef, {
					amount,
					type,
					occurredAt: Timestamp.now(),
					...meta,
				});

				transaction.update(userRef, {
					balance: FieldValue.increment(amount),
				});
			});

			this.logger.log(`Successfully granted reward of ${amount} to user ${userId}. Type: ${type}`);
		} catch (error) {
			this.logger.error(`Failed to grant reward for user ${userId}. Error: ${error.message}`, error.stack);
			throw new InternalServerErrorException('Could not process the reward.');
		}
	}
}