import { BadRequestException, Injectable } from '@nestjs/common';
import { parse as parseCsv } from 'csv-parse/sync';
import { stringify as stringifyCsv } from 'csv-stringify/sync';
import ExcelJS from 'exceljs';

export type BulkFormat = 'csv' | 'xlsx' | 'json';
export type BulkRecord = Record<string, unknown>;

export interface ParsedBulkFile {
  format: BulkFormat;
  columns: string[];
  rows: BulkRecord[];
  sheetNames: string[];
  sheetName?: string;
  mapping: Record<string, string>;
}

const aliases: Record<string, string[]> = {
  productName: ['productname', 'name', 'title', 'название', 'товар'],
  brand: ['brand', 'manufacturer', 'бренд', 'производитель'],
  category: ['category', 'категория', 'тип'],
  features: ['features', 'characteristics', 'характеристики', 'описание'],
  targetAudience: ['targetaudience', 'audience', 'аудитория'],
};

@Injectable()
export class BulkFileService {
  detectFormat(fileName: string, buffer: Buffer): BulkFormat {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'json'].includes(extension ?? '')) {
      throw new BadRequestException('Поддерживаются только CSV, XLSX и JSON');
    }
    if (extension === 'xlsx' && buffer.subarray(0, 2).toString() !== 'PK') {
      throw new BadRequestException(
        'Содержимое файла не соответствует формату XLSX',
      );
    }
    return extension as BulkFormat;
  }

  async parse(
    buffer: Buffer,
    fileName: string,
    selectedSheet?: string,
  ): Promise<ParsedBulkFile> {
    const format = this.detectFormat(fileName, buffer);
    let rows: BulkRecord[] = [];
    let columns: string[] = [];
    let sheetNames: string[] = [];
    let sheetName: string | undefined;

    try {
      if (format === 'json') {
        const parsed = JSON.parse(
          buffer.toString('utf8').replace(/^\uFEFF/, ''),
        ) as unknown;
        if (!Array.isArray(parsed) || !parsed.every(this.isFlatObject)) {
          throw new Error('JSON должен содержать массив плоских объектов');
        }
        rows = parsed as BulkRecord[];
        columns = this.collectColumns(rows);
      } else if (format === 'csv') {
        const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
        const delimiter = this.detectDelimiter(text);
        rows = parseCsv(text, {
          columns: true,
          delimiter,
          skip_empty_lines: true,
          relax_column_count: false,
          trim: true,
        }) as BulkRecord[];
        columns = this.collectColumns(rows);
      } else {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
        sheetNames = workbook.worksheets.map((sheet) => sheet.name);
        const sheet = selectedSheet
          ? workbook.getWorksheet(selectedSheet)
          : workbook.worksheets[0];
        if (!sheet) throw new Error('В книге нет доступных листов');
        sheetName = sheet.name;
        const headerRow = sheet.getRow(1);
        const headerValues = Array.isArray(headerRow.values)
          ? headerRow.values
          : [];
        columns = headerValues
          .slice(1)
          .map((value) => String(value ?? '').trim())
          .filter(Boolean);
        sheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const record: BulkRecord = {};
          columns.forEach((column, index) => {
            const value = row.getCell(index + 1).value;
            record[column] = this.excelValue(value);
          });
          if (
            Object.values(record).some((value) => value !== '' && value != null)
          )
            rows.push(record);
        });
      }
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Не удалось прочитать файл',
      );
    }

    if (!rows.length)
      throw new BadRequestException('Файл не содержит строк с данными');
    if (rows.length > 1000)
      throw new BadRequestException('Максимум 1000 строк на одну задачу');
    return {
      format,
      columns,
      rows,
      sheetNames,
      sheetName,
      mapping: this.autoMapping(columns),
    };
  }

  async export(
    format: BulkFormat,
    rows: BulkRecord[],
    columns: string[],
  ): Promise<Buffer> {
    const resultColumns = [
      'description',
      'shortDescription',
      'seoTitle',
      'metaDescription',
      'keywords',
      'generationStatus',
      'generationError',
    ];
    const allColumns = [...columns, ...resultColumns];
    if (format === 'json')
      return Buffer.from(JSON.stringify(rows, null, 2), 'utf8');
    if (format === 'csv') {
      const safeRows = rows.map((row) =>
        Object.fromEntries(
          allColumns.map((key) => [key, this.safeCsv(row[key])]),
        ),
      );
      return Buffer.from(
        `\uFEFF${stringifyCsv(safeRows, { header: true, columns: allColumns })}`,
        'utf8',
      );
    }
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Results');
    sheet.columns = allColumns.map((key) => ({ header: key, key, width: 22 }));
    rows.forEach((row) => sheet.addRow(row));
    const output = await workbook.xlsx.writeBuffer();
    return Buffer.from(output);
  }

  private detectDelimiter(text: string) {
    const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
    return (firstLine.match(/;/g)?.length ?? 0) >
      (firstLine.match(/,/g)?.length ?? 0)
      ? ';'
      : ',';
  }

  private collectColumns(rows: BulkRecord[]) {
    return [...new Set(rows.flatMap((row) => Object.keys(row)))];
  }

  private autoMapping(columns: string[]) {
    const normalized = new Map(
      columns.map((column) => [
        column.toLowerCase().replace(/[\s_-]/g, ''),
        column,
      ]),
    );
    return Object.fromEntries(
      Object.entries(aliases).map(([field, names]) => [
        field,
        names.map((name) => normalized.get(name)).find(Boolean) ?? '',
      ]),
    );
  }

  private isFlatObject(value: unknown): value is BulkRecord {
    return (
      Boolean(value) &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.values(value as BulkRecord).every(
        (item) =>
          item == null ||
          ['string', 'number', 'boolean'].includes(typeof item) ||
          (Array.isArray(item) &&
            item.every((part) => ['string', 'number'].includes(typeof part))),
      )
    );
  }

  private excelValue(value: ExcelJS.CellValue): unknown {
    if (value == null) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') {
      if ('text' in value) return value.text;
      if ('result' in value) return value.result ?? '';
      return String(value);
    }
    return value;
  }

  private safeCsv(value: unknown) {
    const text = Array.isArray(value) ? value.join(', ') : String(value ?? '');
    return /^[=+\-@]/.test(text) ? `'${text}` : text;
  }
}
