import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DismissPopupDto {
	@ApiProperty({ description: 'The session ID of the completed survey.' })
	@IsString()
	@IsNotEmpty()
	completionId: string;
}