import { Body, Controller, HttpCode, HttpStatus, Logger, Post, Query, Version } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SurveySessionsService } from '../survey-sessions/survey-sessions.service';
import { DisqualificationService } from 'src/disqualifications/disqualifications.service';

export class PureSpectrumWebhookDto {
	event?: 'disqualified' | 'complete';
	transactionId: string;
	memberId: string;
	cpi?: number;
	survey_LOI: number;
	surveyID: number;
}

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
	private readonly logger = new Logger(WebhooksController.name);

	constructor(
		private readonly surveySessionsService: SurveySessionsService,
		private readonly disqualificationService: DisqualificationService,
	) { }

	@Version('1')
	@Post('purespectrum')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Handles survey completion callbacks from PureSpectrum' })
	@ApiQuery({ name: 'transactionId', type: String, required: true })
	@ApiQuery({ name: 'memberId', type: String, required: true })
	@ApiQuery({ name: 'cpi', type: Number, required: true })
	@ApiQuery({ name: 'surveyID', type: Number, required: true })
	async handlePureSpectrumWebhook(@Query() query: PureSpectrumWebhookDto) {
		this.logger.log(`Received PureSpectrum webhook: ${JSON.stringify(query)}`);
		try {
			const payload = {
				...query,
				cpi: Number(query.cpi),
				surveyID: Number(query.surveyID)
			};

			if (query.event === 'disqualified') {
				return await this.disqualificationService.processDisqualification({
					userId: payload.memberId,
					providerSessionId: payload.transactionId,
					provider: 'PureSpectrum',
				});
			} else {
				return await this.surveySessionsService.completeSurveyByWebhook(payload);
			}
		} catch (error) {
			this.logger.error(`Webhook processing failed: ${error.message}`, error.stack);
			return { status: 'error', message: error.message };
		}
	}
}