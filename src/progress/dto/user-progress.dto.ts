import { ApiProperty } from '@nestjs/swagger';

export class UserProgressDto {
	@ApiProperty({ example: 14 })
	earnedPoints: number;
	@ApiProperty({ example: 50 })
	goalPoints: number;
	@ApiProperty({ example: 'LEARNING', enum: ['LEARNING', 'PLACING'] })
	phase: string;
	@ApiProperty({ example: false })
	showSurveysForcedCtaPending: boolean;
	@ApiProperty({ example: 28 })
	percent: number;
}