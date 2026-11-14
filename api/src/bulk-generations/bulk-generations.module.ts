import { Module } from '@nestjs/common';
import { GenerationsModule } from '../generations/generations.module';
import { BulkFileService } from './bulk-file.service';
import { BulkGenerationsController } from './bulk-generations.controller';
import { BulkGenerationsService } from './bulk-generations.service';

@Module({
  imports: [GenerationsModule],
  controllers: [BulkGenerationsController],
  providers: [BulkFileService, BulkGenerationsService],
})
export class BulkGenerationsModule {}
