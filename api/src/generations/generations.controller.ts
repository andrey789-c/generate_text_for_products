import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import {
  GenerationsService,
  StreamingGenerationEvent,
} from './generations.service';
import { CreateGenerationDto } from './dto/create-generation.dto';

@Controller('generations')
export class GenerationsController {
  constructor(private readonly generationsService: GenerationsService) {}

  @Post()
  create(@Body() dto: CreateGenerationDto) {
    return this.generationsService.create(dto);
  }

  @Post('stream')
  async stream(@Body() dto: CreateGenerationDto, @Res() response: Response) {
    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');
    response.flushHeaders();

    let disconnected = false;
    let completed = false;
    let abortCurrentGeneration: () => void = () => undefined;
    const handleClose = () => {
      if (!completed) {
        disconnected = true;
        abortCurrentGeneration();
      }
    };
    response.on('close', handleClose);
    const heartbeat = setInterval(() => {
      if (!disconnected && !response.writableEnded)
        response.write(': heartbeat\n\n');
    }, 15_000);

    const send = (event: StreamingGenerationEvent) => {
      if (!disconnected && !response.writableEnded) {
        response.write(
          `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`,
        );
      }
    };

    try {
      await this.generationsService.stream(
        dto,
        send,
        (abort) => {
          abortCurrentGeneration = abort;
        },
        () => disconnected,
      );
    } catch (error) {
      if (!disconnected && !response.writableEnded) {
        send({
          type: 'error',
          data: {
            message:
              error instanceof Error
                ? error.message
                : 'Не удалось выполнить генерацию.',
          },
        });
      }
    } finally {
      completed = true;
      clearInterval(heartbeat);
      response.off('close', handleClose);
      if (!response.writableEnded) response.end();
    }
  }

  @Get()
  findAll(
    @Query('productId') productId?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.generationsService.findAll(productId, Math.min(limit, 100));
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.generationsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.generationsService.remove(id);
  }
}
