import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';

@Injectable()
export class BlacklistService {
	private readonly collection = 'tokenBlacklist';

	constructor(private readonly firebaseService: FirebaseService) { }

	async addToBlacklist(jti: string, exp: number): Promise<void> {
		const nowSeconds = Math.floor(Date.now() / 1000);
		const ttlSeconds = exp - nowSeconds;

		if (ttlSeconds <= 0) return;

		const expiryDate = new Date(exp * 1000);
		await this.firebaseService.firestore
			.collection(this.collection)
			.doc(jti)
			.set({ expiresAt: expiryDate });
	}

	async isBlacklisted(jti: string): Promise<boolean> {
		const doc = await this.firebaseService.firestore.collection(this.collection).doc(jti).get();
		return doc.exists;
	}
}