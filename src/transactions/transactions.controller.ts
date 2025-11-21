import { Controller, Get, Version, Query, ParseIntPipe, DefaultValuePipe, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionResponseDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Version('1')
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get user transactions',
    description: 'Retrieves a paginated list of the authenticated user\'s transactions.',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page.', example: 20 })
  @ApiQuery({ name: 'startAfter', required: false, description: 'The ID of the last item from the previous page to fetch the next page.' })
  @ApiQuery({ name: 'types', required: false, description: 'Comma-separated list of transaction types to filter by.', example: 'Survey Reward,Disqualification Reward' })
  @ApiResponse({
    status: 200,
    description: 'A paginated list of transactions.',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Token is missing or invalid.',
  })
  async findAll(
    @Req() req,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('startAfter') startAfter?: string,
    @Query('types') types?: string,
  ): Promise<TransactionResponseDto> {
    const userId = req.user.userId;

    const { transactions, nextPageToken } = await this.transactionsService.findAllForUser(
      userId,
      limit,
      startAfter,
      types,
    );

    return {
      items: transactions,
      nextPageToken: nextPageToken,
    };
  }
}