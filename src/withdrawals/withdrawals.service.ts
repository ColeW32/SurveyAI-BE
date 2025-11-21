import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { StorageService } from 'src/storage/storage.service';

export interface VerificationImages {
	idImage?: Express.Multer.File;
	selfieImage?: Express.Multer.File;
}

@Injectable()
export class WithdrawalsService {
	constructor(
		private readonly firebaseService: FirebaseService,
		private readonly storageService: StorageService,
	) { }

	async create(
		userId: string,
		createDto: CreateWithdrawalDto,
		verificationImages?: VerificationImages,
	) {
		const firestore = this.firebaseService.firestore;
		const userRef = firestore.collection('users').doc(userId);
		const withdrawalRef = firestore.collection('withdrawals').doc();
		const duplicateCheck = await this.checkDuplicateWithdrawalEmail(createDto.recipientEmail, userId);

		await firestore.runTransaction(async (transaction) => {
			const userDoc = await transaction.get(userRef);
			if (!userDoc.exists) { throw new NotFoundException('User not found.'); }

			const userData = userDoc.data();
			const currentBalance = userData?.balance || 0;
			const minWithdrawal = 5;

			if (currentBalance < minWithdrawal) {
				throw new BadRequestException(`Insufficient balance. Minimum withdrawal is $${minWithdrawal}.`);
			}
			if (currentBalance < createDto.amount) {
				throw new BadRequestException('Insufficient funds for the requested amount.');
			}

			let idImageUrl: string | null = null;
			let selfieImageUrl: string | null = null;
			let verificationStatus = 'not_required';

			const isUserVerified = userData?.idVerificationStatus === 'verified';

			if (isUserVerified) {
				verificationStatus = 'approved';
			} else if (verificationImages?.idImage && verificationImages?.selfieImage) {
				idImageUrl = await this.storageService.uploadFile(verificationImages.idImage, `id-verification/${userId}/`);
				selfieImageUrl = await this.storageService.uploadFile(verificationImages.selfieImage, `id-verification/${userId}/`);
				verificationStatus = 'pending';
				transaction.update(userRef, { idVerificationStatus: 'pending' });
			}

			transaction.update(userRef, {
				balance: FieldValue.increment(-createDto.amount),
			});
			const newBalance = userData?.balance - createDto.amount
			const withdrawalRef = firestore.collection('withdrawals').doc();

			const newWithdrawal = {
				id: withdrawalRef.id,
				uid: userId,
				email: createDto.recipientEmail,
				amount: createDto.amount,
				balance: newBalance,
				method: createDto.method,
				createdAt: Timestamp.now(),
				status: 'pending',
				premium: false,
				country: 'US',
				isFlagged: duplicateCheck.isDuplicate,
				flagReason: duplicateCheck.isDuplicate ? `Email used by ${duplicateCheck.userCount} other account(s).` : null,
				verification_status: verificationStatus,
				id_image_url: idImageUrl,
				selfie_image_url: selfieImageUrl,
				images_uploaded_at: verificationStatus === 'pending' ? Timestamp.now() : null,
			};
			transaction.set(withdrawalRef, newWithdrawal);
		});

		return { success: true, message: 'Withdrawal request created successfully.' };
	}

	private async checkDuplicateWithdrawalEmail(
		email: string,
		currentUserId: string,
	): Promise<{ isDuplicate: boolean; userCount: number }> {
		const firestore = this.firebaseService.firestore;
		const query = firestore
			.collection('withdrawals')
			.where('email', '==', email);

		const snapshot = await query.get();

		if (snapshot.empty) {
			return { isDuplicate: false, userCount: 0 };
		}

		const userIds = new Set<string>();
		snapshot.forEach((doc) => {
			userIds.add(doc.data().uid);
		});

		const isDuplicate = ![...userIds].every(uid => uid === currentUserId);

		const otherUserIds = new Set(userIds);
		otherUserIds.delete(currentUserId);
		const userCount = otherUserIds.size;

		return {
			isDuplicate,
			userCount,
		};
	}
}