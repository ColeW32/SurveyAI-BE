import { Module } from '@nestjs/common';
import { SurveySessionsService } from './survey-sessions.service';
import { RewardsModule } from '../rewards/rewards.module';
import { FirebaseService } from 'src/firebase/firebase.service';

@Module({
  imports: [RewardsModule],
  providers: [SurveySessionsService, FirebaseService],
  exports: [SurveySessionsService]
})
export class SurveySessionsModule { }