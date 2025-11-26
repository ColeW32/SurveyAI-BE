import { Body, Controller, Param, Post, Req, UseGuards, Version } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DisqualificationService } from '../disqualifications/disqualifications.service';
import { Throttle } from '@nestjs/throttler';
import { SurveySessionsService } from './survey-sessions.service';
import { DisqualificationResponseDto, ProgressUpdatePayloadDto } from '../disqualifications/dto/disqualification-response.dto';
@ApiTags('Survey Sessions')
@Controller('survey-sessions')
export class SurveySessionsController {
	constructor(
		private readonly disqualificationService: DisqualificationService,
		private readonly surveySessionsService: SurveySessionsService
	) { }

	@Version('1')
	@Throttle({ default: { limit: 5, ttl: 60000 } })
	@Post(':sessionId/disqualify')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Process a survey disqualification from the client' })
	@ApiParam({ name: 'sessionId', description: 'The unique ID of the survey session obtained from the /start endpoint.' })
	@ApiResponse({ status: 201, description: 'Disqualification processed successfully.', type: DisqualificationResponseDto })
	@ApiResponse({ status: 404, description: 'Session not found or already processed.' })
	@ApiResponse({ status: 429, description: 'Too many requests.' })
	async handleFeDisqualification(@Req() req, @Param('sessionId') sessionId: string) {
		const userId = req.user.userId;
		return this.disqualificationService.processDisqualification({
			userId,
			providerSessionId: sessionId,
			provider: 'PureSpectrum',
		});
	}

	@Version('1')
	@Post(':sessionId/award-progress')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Awards progress points after a successful survey completion' })
	@ApiParam({ name: 'sessionId', description: 'The unique ID of the completed survey session.' })
	@ApiResponse({ status: 201, description: 'Progress points awarded successfully. Returns the progress update payload.', type: ProgressUpdatePayloadDto })
	@ApiResponse({ status: 404, description: 'Session not found.' })
	@ApiResponse({ status: 409, description: 'User does not own this session or progress points are not pending.' })
	async handleDismissSuccessPopup(
		@Req() req,
		@Param('sessionId') sessionId: string,
	) {
		const userId = req.user.userId;

		return this.surveySessionsService.awardPendingProgressPoints(userId, sessionId);
	}
}