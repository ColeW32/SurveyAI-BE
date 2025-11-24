import { Module } from '@nestjs/common';
import { SurveyWallService } from './survey-wall.service';
import { PurespectrumModule } from '../purespectrum/purespectrum.module';
import { FirebaseService } from 'src/firebase/firebase.service';
import { SurveyWallController } from './survey-wall.controller';
import { SurveySessionsModule } from 'src/survey-sessions/survey-sessions.module';

@Module({
	imports: [
		PurespectrumModule,
		SurveySessionsModule,
	],
	providers: [SurveyWallService, FirebaseService],
	exports: [SurveyWallService], controllers: [SurveyWallController]
})
export class SurveyWallModule { }