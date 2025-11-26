import { Module } from '@nestjs/common';
import { DisqualificationService } from './disqualifications.service';
import { ProgressModule } from 'src/progress/progress.module';
import { RewardsModule } from 'src/rewards/rewards.module';

@Module({
  providers: [DisqualificationService],
  imports: [ProgressModule, RewardsModule],
  exports: [DisqualificationService]
})
export class DisqualificationsModule { }
