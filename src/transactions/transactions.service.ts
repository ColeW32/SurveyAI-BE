import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { TransactionDto } from './dto/transaction.dto';
import { DocumentSnapshot } from 'firebase-admin/firestore';

@Injectable()
export class TransactionsService {
	constructor(private readonly firebaseService: FirebaseService) { }

	async findAllForUser(
		userId: string,
		limit: number,
		startAfter?: string,
		types?: string,
	): Promise<{ transactions: TransactionDto[]; nextPageToken: string | null }> {
		let query = this.firebaseService.firestore
			.collection('users')
			.doc(userId)
			.collection('transactions')
			.orderBy('occurredAt', 'desc')

		if (types) {
			const typesArray = types.split(',');
			if (typesArray.length > 0) {
				query = query.where('type', 'in', typesArray);
			}
		}

		query = query.limit(limit);

		if (startAfter) {
			const startAfterDoc = await this.firebaseService.firestore
				.collection('users')
				.doc(userId)
				.collection('transactions')
				.doc(startAfter)
				.get();

			if (startAfterDoc.exists) {
				query = query.startAfter(startAfterDoc);
			}
		}

		const snapshot = await query.get();

		if (snapshot.empty) {
			return { transactions: [], nextPageToken: null };
		}

		const transactions: TransactionDto[] = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				type: data.type,
				amount: data.amount,
				occurredAt: data.occurredAt.toDate().toISOString(),
				provider: data.provider,
				surveyId: data.surveyId,
				meta: data.meta,
			};
		});

		let nextPageToken: string | null = null;
		if (transactions.length === limit) {
			const lastDoc = snapshot.docs[snapshot.docs.length - 1];
			nextPageToken = lastDoc.id;
		}

		return { transactions, nextPageToken };
	}
}