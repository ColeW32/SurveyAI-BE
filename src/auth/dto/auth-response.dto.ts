import { ApiProperty } from '@nestjs/swagger';

class UserDto {
	@ApiProperty()
	appleUid: string;
	@ApiProperty()
	email: string;
	@ApiProperty()
	gender: string;
	@ApiProperty()
	dob: string;
	@ApiProperty()
	zip: string;
	@ApiProperty()
	balance: number;
}

export class AuthResponseDto {
	@ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
	accessToken: string;

	@ApiProperty({ type: UserDto })
	user: UserDto;
}