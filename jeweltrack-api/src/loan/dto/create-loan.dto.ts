import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Purity, Metal } from '@prisma/client';

export class CollateralItemDto {
  @ApiProperty({ enum: Metal, required: false, default: Metal.GOLD })
  @IsOptional()
  @IsEnum(Metal)
  metal?: Metal;

  @ApiProperty({ example: 'Gold Chain / Silver Anklet' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: Purity, required: false, default: Purity.K22 })
  @IsOptional()
  @IsEnum(Purity)
  purity?: Purity;

  @ApiProperty({ example: 1, default: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  pieces?: number;

  @ApiProperty({ example: 12.5, required: false })
  @IsOptional()
  @IsNumber()
  gross_weight?: number;

  @ApiProperty({ example: 12.0, required: false })
  @IsOptional()
  @IsNumber()
  net_weight?: number;
}

export class CreateLoanDto {
  @ApiProperty({ example: 'customer-uuid' })
  @IsString()
  @IsNotEmpty()
  customer_id: string;

  @ApiProperty({ example: 50000, description: 'Loan amount in Rupees' })
  @IsInt()
  @Min(1)
  loan_amount: number;

  @ApiProperty({ example: 1.5, description: 'Monthly interest rate percentage (e.g. 1.5% / month)' })
  @IsNumber()
  @Min(0)
  interest_rate: number;

  @ApiProperty({ example: 25.5, description: 'Total gross weight in grams' })
  @IsNumber()
  @Min(0)
  gross_weight: number;

  @ApiProperty({ example: 24.0, description: 'Total net pure weight in grams' })
  @IsNumber()
  @Min(0)
  net_weight: number;

  @ApiProperty({ example: 'Safe Locker Packet #104', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CollateralItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CollateralItemDto)
  items: CollateralItemDto[];
}
