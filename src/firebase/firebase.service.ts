import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
	private readonly logger = new Logger(FirebaseService.name);
	private firestoreInstance: admin.firestore.Firestore;
	private authInstance: admin.auth.Auth;
	public storageInstance: admin.storage.Storage | null;

	onModuleInit() {
		const apps = admin.apps;

		if (!apps.length) {
			const serviceAccountPath = path.join(process.cwd(), 'service-account.json');

			admin.initializeApp({
				credential: admin.credential.cert(serviceAccountPath),
				storageBucket: 'surveyai-6ab7d.appspot.com',
			});

			console.log('Firebase Admin SDK initialized.');
		} else {
			console.log('Firebase Admin SDK reused existing instance.');
		}

		this.firestoreInstance = admin.firestore();
		this.authInstance = admin.auth();

		try {
			this.storageInstance = admin.storage();
		} catch (e) {
			this.logger.warn(`Firebase Storage could not be initialized. Error: ${e.message}`);
			this.storageInstance = null;
		}
	}


	get firestore(): admin.firestore.Firestore {
		return this.firestoreInstance;
	}
	get auth(): admin.auth.Auth {
		return this.authInstance;
	}

	get storage(): admin.storage.Storage | null {
		return this.storageInstance;
	}
}