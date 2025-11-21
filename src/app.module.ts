import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AuthModule } from './auth/auth.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { StorageModule } from './storage/storage.module';
import { RewardsModule } from './rewards/rewards.module';
import { SurveysModule } from './surveys/surveys.module';

@Module({
  imports: [FirebaseModule, TransactionsModule, AuthModule, WithdrawalsModule, StorageModule, RewardsModule, SurveysModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
