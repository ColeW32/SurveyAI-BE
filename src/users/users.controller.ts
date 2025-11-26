import { Controller, Delete, Req, UseGuards, Version } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Version('1')
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete the authenticated user account' })
  @ApiResponse({ status: 200, description: 'User account successfully deleted.' })
  async deleteMe(@Req() req) {
    const userId = req.user.userId;
    return this.usersService.deleteUser(userId);
  }
}