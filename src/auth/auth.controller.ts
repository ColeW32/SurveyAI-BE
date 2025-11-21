import { Controller, Post, Body, Version } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInAppleDto } from './dto/signin-apple.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Version('1')
  @Post('apple/signin')
  @ApiOperation({
    summary: 'Sign in with Apple',
    description: 'Authenticates a user using their Apple ID token and returns a JWT access token.',
  })
  @ApiBody({ type: SignInAppleDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully authenticated.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. The Apple token is invalid.',
  })
  signInWithApple(@Body() signInDto: SignInAppleDto) {
    return this.authService.signInWithApple(signInDto);
  }
}