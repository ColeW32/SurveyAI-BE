import { Module } from '@nestjs/common';
import { RewardService } from './rewards.service';

@Module({
  providers: [RewardService]
})
export class RewardsModule { }
