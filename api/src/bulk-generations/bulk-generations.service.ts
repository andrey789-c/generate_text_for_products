import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  GenerationSettings,
  GenerationsService,
} from '../generations/generations.service';
import { BulkFileService, BulkFormat, BulkRecord } from './bulk-file.service';
import { StartBulkJobDto } from './dto/start-bulk-job.dto';

@Injectable()
export class BulkGenerationsService implements OnModuleInit {
  private readonly processingJobs = new Set<string>();
  private readonly storageDir = join(process.cwd(), 'storage', 'bulk');

  constructor(
    private readonly prisma: PrismaService,
    private readonly files: BulkFileService,
    private readonly generations: GenerationsService,
  ) {}

  async onModuleInit() {
    await mkdir(this.storageDir, { recursive: true });
    const jobs = await this.prisma.bulkJob.findMany({
      where: { status: 'processing' },
      select: { id: true },
    });
    for (const job of jobs) {
      await this.prisma.bulkJobRow.updateMany({
        where: { jobId: job.id, status: 'processing' },
        data: { status: 'pending' },
      });
      void this.processJob(job.id);
    }
  }

  async create(file: {
    buffer: Buffer;
    originalname: string;
    size: number;
    mimetype: string;
  }) {
    if (!file) throw new BadRequestException('Выберите файл');
    if (file.size > 10 * 1024 * 1024)
      throw new BadRequestException('Максимальный размер файла — 10 МБ');
    const parsed = await this.files.parse(file.buffer, file.originalname);
    const safeName = `${randomUUID()}.${parsed.format}`;
    const sourcePath = join(this.storageDir, safeName);
    await writeFile(sourcePath, file.buffer);
    const job = await this.prisma.bulkJob.create({
      data: {
        originalFileName: file.originalname.replace(/[^\p{L}\p{N}._ -]/gu, '_'),
        originalFormat: parsed.format,
        sourcePath,
        sheetName: parsed.sheetName,
        totalRows: parsed.rows.length,
        settings: {} as Prisma.InputJsonValue,
        mapping: parsed.mapping as Prisma.InputJsonValue,
        columns: parsed.columns as Prisma.InputJsonValue,
        sheetNames: parsed.sheetNames as Prisma.InputJsonValue,
        rows: {
          create: parsed.rows.map((inputData, rowIndex) => ({
            rowIndex,
            inputData: inputData as Prisma.InputJsonValue,
          })),
        },
      },
    });
    return { jobId: job.id };
  }

  async get(id: string) {
    const job = await this.prisma.bulkJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Задача массовой генерации не найдена');
    return this.publicJob(job);
  }

  async preview(id: string, sheetName?: string) {
    const job = await this.prisma.bulkJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Задача массовой генерации не найдена');
    if (sheetName && sheetName !== job.sheetName) {
      const parsed = await this.files.parse(
        await readFile(job.sourcePath),
        job.originalFileName,
        sheetName,
      );
      return {
        ...this.publicJob(job),
        columns: parsed.columns,
        mapping: parsed.mapping,
        previewRows: parsed.rows.slice(0, 10),
        totalRows: parsed.rows.length,
        selectedSheet: parsed.sheetName,
      };
    }
    const rows = await this.prisma.bulkJobRow.findMany({
      where: { jobId: id },
      orderBy: { rowIndex: 'asc' },
      take: 10,
    });
    return {
      ...this.publicJob(job),
      previewRows: rows.map((row) => row.inputData),
    };
  }

  async start(id: string, dto: StartBulkJobDto) {
    const job = await this.prisma.bulkJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Задача массовой генерации не найдена');
    if (job.status !== 'pending')
      throw new BadRequestException('Задача уже запущена или завершена');
    let rows: BulkRecord[] | null = null;
    let columns = job.columns as string[];
    if (dto.sheetName && dto.sheetName !== job.sheetName) {
      const parsed = await this.files.parse(
        await readFile(job.sourcePath),
        job.originalFileName,
        dto.sheetName,
      );
      rows = parsed.rows;
      columns = parsed.columns;
    }
    const productNameColumn = dto.mapping.productName;
    if (!productNameColumn || !columns.includes(productNameColumn))
      throw new BadRequestException(
        'Сопоставьте обязательное поле «Название товара»',
      );
    await this.prisma.$transaction(async (tx) => {
      if (rows) {
        await tx.bulkJobRow.deleteMany({ where: { jobId: id } });
        await tx.bulkJobRow.createMany({
          data: rows.map((inputData, rowIndex) => ({
            jobId: id,
            rowIndex,
            inputData: inputData as Prisma.InputJsonValue,
          })),
        });
      }
      await tx.bulkJob.update({
        where: { id },
        data: {
          status: 'processing',
          sheetName: dto.sheetName ?? job.sheetName,
          totalRows: rows?.length ?? job.totalRows,
          processedRows: 0,
          successfulRows: 0,
          failedRows: 0,
          mapping: dto.mapping as Prisma.InputJsonValue,
          settings: {
            tone: dto.tone,
            language: dto.language,
            length: dto.length,
            variants: dto.variants,
          } as Prisma.InputJsonValue,
          columns: columns as Prisma.InputJsonValue,
        },
      });
    });
    void this.processJob(id);
    return this.get(id);
  }

  async cancel(id: string) {
    const result = await this.prisma.bulkJob.updateMany({
      where: { id, status: { in: ['pending', 'processing'] } },
      data: { status: 'cancelled', completedAt: new Date() },
    });
    if (!result.count) throw new BadRequestException('Задачу нельзя отменить');
    return this.get(id);
  }

  async download(id: string) {
    const job = await this.prisma.bulkJob.findUnique({
      where: { id },
      include: { rows: { orderBy: { rowIndex: 'asc' } } },
    });
    if (!job) throw new NotFoundException('Задача массовой генерации не найдена');
    if (!['completed', 'completed_with_errors'].includes(job.status))
      throw new BadRequestException('Результат ещё не готов');
    const rows = job.rows.map((row) => ({
      ...(row.inputData as BulkRecord),
      ...((row.outputData as BulkRecord | null) ?? {}),
      generationStatus: row.status,
      generationError: row.error ?? '',
    }));
    const buffer = await this.files.export(
      job.originalFormat as BulkFormat,
      rows,
      job.columns as string[],
    );
    return {
      buffer,
      fileName: `productai-${job.id}.${job.originalFormat}`,
      format: job.originalFormat,
    };
  }

  private async processJob(jobId: string) {
    if (this.processingJobs.has(jobId)) return;
    this.processingJobs.add(jobId);
    try {
      while (true) {
        const job = await this.prisma.bulkJob.findUnique({
          where: { id: jobId },
        });
        if (!job || job.status !== 'processing') break;
        const row = await this.prisma.bulkJobRow.findFirst({
          where: { jobId, status: 'pending' },
          orderBy: { rowIndex: 'asc' },
        });
        if (!row) {
          const status =
            job.failedRows > 0 ? 'completed_with_errors' : 'completed';
          await this.prisma.bulkJob.update({
            where: { id: jobId },
            data: { status, completedAt: new Date() },
          });
          break;
        }
        const claimed = await this.prisma.bulkJobRow.updateMany({
          where: { id: row.id, status: 'pending' },
          data: { status: 'processing', attempts: { increment: 1 } },
        });
        if (!claimed.count) continue;
        try {
          const input = row.inputData as BulkRecord;
          const mapping = job.mapping as Record<string, string>;
          const settings = job.settings as unknown as GenerationSettings;
          const productName = String(input[mapping.productName] ?? '').trim();
          if (!productName) throw new Error('Не указано название товара');
          const featuresValue = mapping.features ? input[mapping.features] : [];
          const features = Array.isArray(featuresValue)
            ? featuresValue.map(String).filter(Boolean)
            : String(featuresValue ?? '')
                .split(/[|;\n]+/)
                .map((item) => item.trim())
                .filter(Boolean);
          const variants = await this.generations.generateContents(
            {
              name: productName,
              brand: mapping.brand
                ? String(input[mapping.brand] ?? '')
                : undefined,
              category: mapping.category
                ? String(input[mapping.category] ?? '')
                : undefined,
              features,
              targetAudience: mapping.targetAudience
                ? String(input[mapping.targetAudience] ?? '')
                : undefined,
            },
            settings,
          );
          const output = {
            description: variants
              .map((item) => item.description)
              .join('\n\n---\n\n'),
            shortDescription: variants
              .map((item) => item.shortDescription)
              .join('\n\n'),
            seoTitle: variants.map((item) => item.seoTitle).join(' | '),
            metaDescription: variants
              .map((item) => item.metaDescription)
              .join('\n\n'),
            keywords: [...new Set(variants.flatMap((item) => item.keywords))],
          };
          await this.prisma.$transaction([
            this.prisma.bulkJobRow.update({
              where: { id: row.id },
              data: {
                status: 'completed',
                outputData: output as Prisma.InputJsonValue,
              },
            }),
            this.prisma.bulkJob.update({
              where: { id: jobId },
              data: {
                processedRows: { increment: 1 },
                successfulRows: { increment: 1 },
              },
            }),
          ]);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Ошибка генерации';
          await this.prisma.$transaction([
            this.prisma.bulkJobRow.update({
              where: { id: row.id },
              data: { status: 'failed', error: message.slice(0, 1000) },
            }),
            this.prisma.bulkJob.update({
              where: { id: jobId },
              data: {
                processedRows: { increment: 1 },
                failedRows: { increment: 1 },
              },
            }),
          ]);
        }
      }
    } catch {
      await this.prisma.bulkJob
        .update({
          where: { id: jobId },
          data: { status: 'failed', completedAt: new Date() },
        })
        .catch(() => undefined);
    } finally {
      this.processingJobs.delete(jobId);
    }
  }

  private publicJob(job: {
    id: string;
    status: string;
    originalFileName: string;
    originalFormat: string;
    totalRows: number;
    processedRows: number;
    successfulRows: number;
    failedRows: number;
    settings: unknown;
    mapping: unknown;
    columns: unknown;
    sheetNames: unknown;
    sheetName: string | null;
    createdAt: Date;
    completedAt: Date | null;
  }) {
    return {
      id: job.id,
      status: job.status,
      originalFileName: job.originalFileName,
      originalFormat: job.originalFormat,
      totalRows: job.totalRows,
      processedRows: job.processedRows,
      successfulRows: job.successfulRows,
      failedRows: job.failedRows,
      settings: job.settings,
      mapping: job.mapping,
      columns: job.columns,
      sheetNames: job.sheetNames,
      selectedSheet: job.sheetName,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    };
  }
}
