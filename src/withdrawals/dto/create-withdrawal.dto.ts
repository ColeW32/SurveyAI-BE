import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNumber, IsString, Min } from 'class-validator';


export class CreateWithdrawalDto {
	@ApiProperty({
		description: 'Withdrawal amount.',
		example: 15.0,
		minimum: 15.0,
	})
	@IsNumber()
	@Min(15)
	amount: number;

	@ApiProperty({
		description: 'Payment method',
		example: 'paypal',
		enum: ['paypal', 'mastercard', 'ebay'],
	})
	method: string;

	@ApiProperty({
		description: 'Recipient address (e.g., PayPal email).',
		example: 'recipient@example.com',
	})
	@IsEmail()
	recipientEmail: string;
}