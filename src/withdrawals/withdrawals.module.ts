import { Module } from '@nestjs/common';
import { WithdrawalsService } from './withdrawals.service';
import { WithdrawalsController } from './withdrawals.controller';
import { StorageService } from 'src/storage/storage.service';

@Module({
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService, StorageService],
})
export class WithdrawalsModule { }
