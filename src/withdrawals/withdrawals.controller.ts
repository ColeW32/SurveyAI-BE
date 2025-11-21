import { Controller, Post, Body, UseGuards, Req, Version, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { WithdrawalsService, VerificationImages } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Withdrawals (Mobile App)')
@ApiBearerAuth()
@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) { }

  @Version('1')
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create a new withdrawal request (for mobile app)',
    description: 'Supports multipart/form-data for optional verification images (idImage, selfieImage).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateWithdrawalDto })
  @ApiResponse({ status: 201, description: 'Withdrawal request created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'idImage', maxCount: 1 },
    { name: 'selfieImage', maxCount: 1 },
  ]))
  create(
    @Req() req,
    @Body() createDto: CreateWithdrawalDto,
    @UploadedFiles() files: { idImage?: Express.Multer.File[], selfieImage?: Express.Multer.File[] },
  ) {
    const userId = req.user.userId;

    const verificationImages: VerificationImages = {
      idImage: files?.idImage?.[0],
      selfieImage: files?.selfieImage?.[0],
    };

    return this.withdrawalsService.create(userId, createDto, verificationImages);
  }
}