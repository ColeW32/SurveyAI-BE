import { Controller, Get, Req, UseGuards, Ip, Version, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SurveyWallService } from '../survey-wall/survey-wall.service';
import { Throttle } from '@nestjs/throttler';
import { StartSurveyDto } from './dto/start-survey.dto';
import { SurveySessionsService } from 'src/survey-sessions/survey-sessions.service';

@ApiTags('Survey Wall')
@Controller('survey-wall')
export class SurveyWallController {
	constructor(
		private readonly surveyWallService: SurveyWallService,
		private readonly surveySessionsService: SurveySessionsService,
	) { }

	@Version('1')
	@Throttle({ default: { limit: 6, ttl: 60000 } })
	@Get()
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Fetch the survey wall from PureSpectrum' })
	async getSurveyWall(
		@Req() req,
		@Ip() ipAddress: string,
	) {
		const userId = req.user.userId;
		const userAgent = req.headers['user-agent'] || '';
		return this.surveyWallService.getSurveyWall(userId, ipAddress, userAgent);
	}

	@Version('1')
	@Post('start')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Starts a survey session and returns a redirect URL' })
	async startSurvey(
		@Req() req,
		@Body() startSurveyDto: StartSurveyDto,
	) {
		const userId = req.user.userId;
		return this.surveySessionsService.startSurveySession(userId, startSurveyDto.surveyId);
	}
}