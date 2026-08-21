import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsBoolean, IsObject, Min } from 'class-validator';

export class CreatePlanDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  price!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  max_users?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  max_invoices_per_month?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  max_branches?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}