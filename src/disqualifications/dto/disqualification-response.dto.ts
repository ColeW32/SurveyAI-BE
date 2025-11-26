import { ApiProperty } from '@nestjs/swagger';

export class ProgressUpdatePayloadDto {
	@ApiProperty({
		description: "The user's unique identifier.",
		example: 'user-id-abc-123',
	})
	userId: string;

	@ApiProperty({
		description: 'The number of points added in this event (2 for DQ, 7 for Complete).',
		example: 2,
	})
	deltaPoints: number;

	@ApiProperty({
		description: 'The total number of earned points after this event.',
		example: 14,
	})
	earnedPointsAfter: number;

	@ApiProperty({
		description: 'The total number of points required to reach 100%.',
		example: 50,
	})
	goalPoints: number;

	@ApiProperty({
		description: "The user's progress phase before this event.",
		enum: ['LEARNING', 'PLACING'],
		example: 'LEARNING',
	})
	phaseBefore: string;

	@ApiProperty({
		description: "The user's progress phase after this event.",
		enum: ['LEARNING', 'PLACING'],
		example: 'LEARNING',
	})
	phaseAfter: string;

	@ApiProperty({
		description: 'Indicates if the user reached 100% with this specific event.',
		example: false,
	})
	reached100ThisEvent: boolean;

	@ApiProperty({
		description: 'Indicates if the user has a pending forced "Show Surveys" CTA.',
		example: false,
	})
	showSurveysForcedCtaPending: boolean;
}

export class DisqualificationResponseDto {
	@ApiProperty({
		description: "Indicates the status of the request.",
		example: 'ok',
	})
	status: string;

	@ApiProperty({
		description: "The outcome of the survey attempt.",
		example: 'disqualified',
	})
	outcome: string;

	@ApiProperty({
		description: 'The monetary amount awarded for the disqualification (can be 0.00 if cap is reached).',
		example: 0.02,
	})
	amountRewarded: number;

	@ApiProperty({
		description: "The user's paid disqualification count for the current day after this event.",
		example: 3,
	})
	dailyPaidDQCount: number;

	@ApiProperty({
		description: 'The daily cap for paid disqualifications.',
		example: 5,
	})
	cap: number;

	@ApiProperty({
		description: 'Payload containing details about the progress update. Can be null if points were already awarded for this session.',
		type: ProgressUpdatePayloadDto,
		nullable: true,
	})
	progressUpdate: ProgressUpdatePayloadDto | null;
}