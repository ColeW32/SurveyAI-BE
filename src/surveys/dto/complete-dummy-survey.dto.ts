import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class CompleteDummySurveyDto {
	@ApiProperty({
		description: 'The value of the survey the user selected on the front-end.',
		example: 0.85,
	})
	@IsNumber()
	@IsPositive()
	amount: number;
}