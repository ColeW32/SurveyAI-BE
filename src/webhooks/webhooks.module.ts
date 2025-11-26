import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { SurveySessionsModule } from '../survey-sessions/survey-sessions.module';
import { DisqualificationsModule } from 'src/disqualifications/disqualifications.module';

@Module({
	imports: [SurveySessionsModule, DisqualificationsModule],
	controllers: [WebhooksController],
})
export class WebhooksModule { }