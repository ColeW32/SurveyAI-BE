import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class StartSurveyDto {
	@ApiProperty({ example: 45463631 })
	@IsNotEmpty()
	surveyId: string | number;
}