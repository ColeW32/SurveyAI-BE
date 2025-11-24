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
import { ConfigModule } from '@nestjs/config';
import { PurespectrumModule } from './purespectrum/purespectrum.module';
import { SurveyWallService } from './survey-wall/survey-wall.service';
import { SurveyWallModule } from './survey-wall/survey-wall.module';
import { SurveySessionsModule } from './survey-sessions/survey-sessions.module';
import { WebhooksController } from './webhooks/webhooks.controller';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    FirebaseModule,
    TransactionsModule,
    AuthModule,
    WithdrawalsModule,
    StorageModule,
    RewardsModule,
    SurveysModule,
    PurespectrumModule,
    SurveyWallModule,
    SurveySessionsModule,
    WebhooksModule
  ],
  controllers: [AppController, WebhooksController],
  providers: [
    AppService,
    SurveyWallService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
