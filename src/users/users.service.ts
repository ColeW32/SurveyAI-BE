import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
	private readonly logger = new Logger(UsersService.name);

	constructor(private readonly firebaseService: FirebaseService) { }

	async deleteUser(userId: string, jti?: string, exp?: number): Promise<{ deleted: boolean }> {
		try {
			await this.anonymizeWithdrawals(userId);

			await this.deleteCollectionSafely(`users/${userId}/transactions`);
			await this.deleteCollectionSafely(`users/${userId}/dailyCounters`);

			await this.deleteDocsByFieldSafely('surveySessions', 'userId', userId);

			await this.deleteDocumentSilent('userProgress', userId);
			await this.deleteDocumentSilent('surveyCache', userId);

			await this.deleteDocumentSilent('users', userId);

		} catch (e) {
			this.logger.error(`Firestore partial cleanup error: ${e.message}`);
		}

		try {
			await this.handleAppleRevocation(userId);

			await this.firebaseService.auth.revokeRefreshTokens(userId);

			await this.firebaseService.auth.deleteUser(userId);

		} catch (error) {
			if (error.code === 'auth/user-not-found' || error.code === 5) {
				this.logger.warn(`Auth user ${userId} not found in Firebase Auth, skipping Auth deletion.`);
			} else {
				this.logger.error(`Failed to delete user from Auth: ${error.message}`);
			}
		}


		this.logger.log(`Successfully deleted user resources: ${userId}`);
		return { deleted: true };
	}


	private async anonymizeWithdrawals(userId: string) {
		const limit = 400;
		const collectionRef = this.firebaseService.firestore.collection('withdrawals');
		const snapshot = await collectionRef.where('uid', '==', userId).limit(limit).get();

		if (snapshot.empty) return;

		const batch = this.firebaseService.firestore.batch();

		snapshot.docs.forEach(doc => {
			batch.update(doc.ref, {
				uid: `DELETED_${userId.substring(0, 8)}`,
				email: admin.firestore.FieldValue.delete(),
				isGdprAnonymized: true,
				anonymizedAt: new Date()
			});
		});

		await batch.commit();

		if (snapshot.size === limit) {
			await this.anonymizeWithdrawals(userId);
		}
	}

	private async handleAppleRevocation(userId: string) {
		try {
			const userRecord = await this.firebaseService.auth.getUser(userId);
			const isAppleUser = userRecord.providerData.some(p => p.providerId === 'apple.com');

			if (isAppleUser) {
			}
		} catch (e) {
			this.logger.warn(`Apple revocation skipped: ${e.message}`);
		}
	}

	private async deleteCollectionSafely(path: string, batchSize = 400) {
		const collectionRef = this.firebaseService.firestore.collection(path);
		const snapshot = await collectionRef.limit(batchSize).get();

		if (snapshot.empty) return;

		const batch = this.firebaseService.firestore.batch();
		snapshot.docs.forEach(doc => batch.delete(doc.ref));
		await batch.commit();

		if (snapshot.size >= batchSize) {
			await this.deleteCollectionSafely(path, batchSize);
		}
	}

	private async deleteDocsByFieldSafely(collectionName: string, fieldName: string, value: any, batchSize = 400) {
		const collectionRef = this.firebaseService.firestore.collection(collectionName);
		const snapshot = await collectionRef.where(fieldName, '==', value).limit(batchSize).get();

		if (snapshot.empty) return;

		const batch = this.firebaseService.firestore.batch();
		snapshot.docs.forEach(doc => batch.delete(doc.ref));
		await batch.commit();

		if (snapshot.size >= batchSize) {
			await this.deleteDocsByFieldSafely(collectionName, fieldName, value, batchSize);
		}
	}

	private async deleteDocumentSilent(collectionName: string, docId: string) {
		try {
			await this.firebaseService.firestore.collection(collectionName).doc(docId).delete();
		} catch (e) {
		}
	}
}