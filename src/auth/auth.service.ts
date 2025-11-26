import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { JwtService } from '@nestjs/jwt';
import { Timestamp } from 'firebase-admin/firestore';
import { SignInAppleDto } from './dto/signin-apple.dto';
import { v4 as uuidv4 } from 'uuid';
import { BlacklistService } from './blacklist/blacklist.service';

@Injectable()
export class AuthService {
	constructor(
		private readonly firebaseService: FirebaseService,
		private readonly jwtService: JwtService,
		private readonly blacklistService: BlacklistService
	) { }

	async signInWithApple(signInDto: SignInAppleDto) {
		const { idToken, gender, dob, zip } = signInDto;

		try {
			const decodedToken = await this.firebaseService.auth.verifyIdToken(idToken);
			const appleUid = decodedToken.uid;

			const usersRef = this.firebaseService.firestore.collection('users');
			let userDoc = await usersRef.doc(appleUid).get();
			let internalUserId = appleUid;

			if (!userDoc.exists) {
				console.log(`Creating new user for Apple UID: ${appleUid}`);
				const newUserProfile = {
					appleUid: appleUid,
					email: decodedToken.email || null,
					createdAt: Timestamp.now(),
					gender: gender,
					dob: dob,
					zip: zip,
					balance: 0.67
				};
				await usersRef.doc(appleUid).set(newUserProfile);

				const transactionsRef = usersRef.doc(appleUid).collection('transactions');
				await transactionsRef.add({
					type: 'Survey Reward',
					amount: 0.57,
					occurredAt: Timestamp.now(),
				});
				await transactionsRef.add({
					type: 'Disqualification Reward',
					amount: 0.10,
					occurredAt: Timestamp.now(),
				});

				userDoc = await usersRef.doc(appleUid).get();
			} else {
				console.log(`User already exists for Apple UID: ${appleUid}`);
			}

			internalUserId = userDoc.id;

			const payload = {
				sub: internalUserId,
				jti: uuidv4(),
			};

			const accessToken = await this.jwtService.signAsync(payload);

			return {
				accessToken,
				user: userDoc.data(),
			};
		} catch (error) {
			console.error('Apple Sign-In Error:', error);
			throw new UnauthorizedException('Invalid Apple token');
		}
	}

	async logout(jti: string, exp: number): Promise<{ ok: boolean }> {
		await this.blacklistService.addToBlacklist(jti, exp);
		return { ok: true };
	}

}