import { Module } from '@nestjs/common';
import { SurveysController } from './surveys.controller';
import { SurveysService } from './surveys.service';
import { RewardService } from '../rewards/rewards.service';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  controllers: [SurveysController],
  providers: [SurveysService, RewardService, FirebaseService],
})
export class SurveysModule { }