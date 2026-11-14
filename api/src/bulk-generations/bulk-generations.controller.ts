import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BulkGenerationsService } from './bulk-generations.service';
import { StartBulkJobDto } from './dto/start-bulk-job.dto';

@Controller('bulk-generations')
export class BulkGenerationsController {
  constructor(private readonly service: BulkGenerationsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  )
  create(
    @UploadedFile()
    file: {
      buffer: Buffer;
      originalname: string;
      size: number;
      mimetype: string;
    },
  ) {
    return this.service.create(file);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }

  @Get(':id/preview')
  preview(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('sheetName') sheetName?: string,
  ) {
    return this.service.preview(id, sheetName);
  }

  @Post(':id/start')
  start(@Param('id', ParseUUIDPipe) id: string, @Body() dto: StartBulkJobDto) {
    return this.service.start(id, dto);
  }

  @Post(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancel(id);
  }

  @Get(':id/download')
  async download(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.service.download(id);
    const type =
      result.format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : result.format === 'json'
          ? 'application/json'
          : 'text/csv; charset=utf-8';
    return new StreamableFile(result.buffer, {
      type,
      disposition: `attachment; filename="${result.fileName}"`,
    });
  }
}
