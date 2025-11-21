import { ApiProperty } from '@nestjs/swagger';

export class TransactionDto {
	@ApiProperty()
	id: string;
	@ApiProperty()
	type: string;
	@ApiProperty()
	amount: number;
	@ApiProperty()
	occurredAt: string;
	@ApiProperty({ required: false })
	provider?: string;
	@ApiProperty({ required: false })
	surveyId?: string;
	@ApiProperty({
		required: false,
		description: 'Optional metadata related to the transaction.',
		example: { custom_key: 'custom_value' }
	})
	meta?: Record<string, any>;
}

export class TransactionResponseDto {
	@ApiProperty({ type: [TransactionDto] })
	items: TransactionDto[];

	@ApiProperty({ nullable: true })
	nextPageToken: string | null;
}