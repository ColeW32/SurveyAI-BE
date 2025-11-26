import { Controller, Post, Body, Version, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInAppleDto } from './dto/signin-apple.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

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

  @Version('1')
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out the current user' })
  @ApiResponse({ status: 200, description: 'Successfully logged out.', schema: { example: { ok: true } } })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async logout(@Req() req) {
    const { jti, exp } = req.user;
    return this.authService.logout(jti, exp);
  }

}