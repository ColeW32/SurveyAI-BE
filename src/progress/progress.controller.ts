import { Controller, Get, Post, Req, UseGuards, Version } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserProgressDto } from './dto/user-progress.dto';

@ApiTags('Progress')
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) { }

  @Version('1')
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the user's current AI learning progress" })
  @ApiResponse({ status: 200, description: "Returns the user's progress state.", type: UserProgressDto })
  async getProgress(@Req() req) {
    const userId = req.user.userId;
    return this.progressService.getUserProgress(userId);
  }

  @Version('1')
  @Post('forced-cta/consume')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Marks the forced "Show Surveys" CTA as consumed',
    description: 'This is an idempotent action. Calling it multiple times will not change the state after the first successful call.',
  })
  @ApiResponse({ status: 201, description: 'Confirms the CTA has been consumed and returns the updated progress state.', type: UserProgressDto })
  async consumeForcedCta(@Req() req) {
    const userId = req.user.userId;
    return this.progressService.consumeForcedCta(userId);
  }
}