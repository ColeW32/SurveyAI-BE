import { Controller, Post, Body, Request, UseGuards, HttpCode, HttpStatus, Version } from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { CompleteDummySurveyDto } from './dto/complete-dummy-survey.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Surveys')
@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) { }

  @Version('1')
  @Post('complete-dummy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete the post-account creation dummy survey' })
  @ApiResponse({ status: 200, description: 'Survey successfully completed and user rewarded.', schema: { example: { rewardedAmount: 0.85 } } })
  @ApiResponse({ status: 400, description: 'Invalid input data or user not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Survey has already been completed by this user.' })
  async completeDummySurvey(
    @Request() req,
    @Body() completeDummySurveyDto: CompleteDummySurveyDto,
  ) {
    const userId = req.user.userId;

    return this.surveysService.completeDummySurvey(
      userId,
      completeDummySurveyDto.amount,
    );
  }
}