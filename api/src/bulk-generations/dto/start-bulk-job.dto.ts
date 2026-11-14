import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class StartBulkJobDto {
  @IsObject()
  mapping!: Record<string, string>;

  @IsOptional()
  @IsString()
  sheetName?: string;

  @IsIn(['professional', 'sales', 'friendly', 'premium', 'seo'])
  tone!: string;

  @IsString()
  language!: string;

  @IsIn(['short', 'medium', 'long'])
  length!: string;

  @IsInt()
  @Min(1)
  @Max(3)
  variants!: number;
}
