import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { SurveySessionsModule } from '../survey-sessions/survey-sessions.module';

@Module({
	imports: [SurveySessionsModule],
	controllers: [WebhooksController],
})
export class WebhooksModule { }