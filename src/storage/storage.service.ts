import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { v4 as uuidv4 } from 'uuid';
import { Bucket } from '@google-cloud/storage';

@Injectable()
export class StorageService implements OnModuleInit {
	private bucket: Bucket | null = null;

	constructor(private readonly firebaseService: FirebaseService) { }

	onModuleInit() {
		if (this.firebaseService.storageInstance) {
			this.bucket = this.firebaseService.storageInstance.bucket();
		}
	}

	async uploadFile(file: Express.Multer.File, path: string): Promise<string> {
		if (!this.bucket) {
			throw new InternalServerErrorException('Firebase Storage is not configured on the backend.');
		}

		if (!file) { throw new Error('File is required for upload.'); }

		const fileName = `${path}${uuidv4()}-${file.originalname}`;
		const fileUpload = this.bucket.file(fileName);

		const stream = fileUpload.createWriteStream({
			metadata: { contentType: file.mimetype },
		});

		return new Promise((resolve, reject) => {
			stream.on('error', (error) => reject(`Failed to upload file: ${error.message}`));
			stream.on('finish', async () => {
				await fileUpload.makePublic();
				resolve(fileUpload.publicUrl());
			});
			stream.end(file.buffer);
		});
	}
}