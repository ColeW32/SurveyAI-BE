import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInAppleDto {
	@ApiProperty({
		description: 'The ID token received from Apple after a successful sign-in.',
		example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjgzQ...',
	})
	@IsString()
	@IsNotEmpty()
	idToken: string;

	@ApiProperty({
		description: 'User\'s gender from the onboarding flow. Required for new users.',
		example: 'female',
		required: false,
	})
	@IsString()
	@IsOptional()
	gender?: string;

	@ApiProperty({
		description: 'User\'s date of birth (YYYY-MM-DD) from the onboarding flow. Required for new users.',
		example: '1990-01-01',
		required: false,
	})
	@IsString()
	@IsOptional()
	dob?: string;

	@ApiProperty({
		description: 'User\'s ZIP code from the onboarding flow. Required for new users.',
		example: '90210',
		required: false,
	})
	@IsString()
	@IsOptional()
	zip?: string;
}