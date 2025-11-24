import { Module } from '@nestjs/common';
import { PureSpectrumService } from './purespectrum.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule
  ],
  providers: [PureSpectrumService],
  exports: [PureSpectrumService]
})
export class PurespectrumModule { }
