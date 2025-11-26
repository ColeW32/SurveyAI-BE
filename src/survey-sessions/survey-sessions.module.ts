import { Module } from '@nestjs/common';
import { SurveySessionsService } from './survey-sessions.service';
import { RewardsModule } from '../rewards/rewards.module';
import { FirebaseService } from 'src/firebase/firebase.service';
import { SurveySessionsController } from './survey-sessions.controller';
import { DisqualificationsModule } from 'src/disqualifications/disqualifications.module';
import { ProgressModule } from 'src/progress/progress.module';

@Module({
  imports: [RewardsModule, DisqualificationsModule, ProgressModule],
  providers: [SurveySessionsService, FirebaseService],
  exports: [SurveySessionsService],
  controllers: [SurveySessionsController]
})
export class SurveySessionsModule { }