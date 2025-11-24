import { Body, Controller, HttpCode, HttpStatus, Logger, Post, Query, Version } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SurveySessionsService } from '../survey-sessions/survey-sessions.service';

export class PureSpectrumWebhookDto {
	transactionId: string;
	memberId: string;
	cpi: number;
	survey_LOI: number;
	surveyID: number;
}

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
	private readonly logger = new Logger(WebhooksController.name);

	constructor(private readonly surveySessionsService: SurveySessionsService) { }

	@Version('1')
	@Post('purespectrum/complete')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Handles survey completion callbacks from PureSpectrum' })
	@ApiQuery({ name: 'transactionId', type: String, required: true })
	@ApiQuery({ name: 'memberId', type: String, required: true })
	@ApiQuery({ name: 'cpi', type: Number, required: true })
	@ApiQuery({ name: 'surveyID', type: Number, required: true })
	async handlePureSpectrumComplete(@Query() query: PureSpectrumWebhookDto) {
		this.logger.log(`Received PureSpectrum webhook: ${JSON.stringify(query)}`);
		try {
			const payload = {
				...query,
				cpi: Number(query.cpi),
				surveyID: Number(query.surveyID)
			};
			await this.surveySessionsService.completeSurveyByWebhook(payload);
			return { status: 'success' };
		} catch (error) {
			this.logger.error(`Webhook processing failed: ${error.message}`, error.stack);
			return { status: 'error', message: error.message };
		}
	}
}