import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  ValidateIf,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateGenerationDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ValidateIf((dto: CreateGenerationDto) => !dto.productId)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  productName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ValidateIf((dto: CreateGenerationDto) => !dto.productId)
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  targetAudience?: string;

  @IsOptional()
  @IsIn(['professional', 'sales', 'friendly', 'premium', 'seo'])
  tone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @IsOptional()
  @IsIn(['short', 'medium', 'long'])
  length?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  variants?: number;
}
