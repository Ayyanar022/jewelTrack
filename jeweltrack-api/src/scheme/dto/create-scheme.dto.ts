import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SchemePaymentMode } from '@prisma/client';

export class InitialDepositDto {
  @ApiProperty({ description: 'Initial deposit cash amount in INR', example: 5000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ enum: SchemePaymentMode, default: SchemePaymentMode.CASH })
  @IsOptional()
  @IsEnum(SchemePaymentMode)
  payment_mode?: SchemePaymentMode = SchemePaymentMode.CASH;

  @ApiPropertyOptional({ description: 'Custom 22k rate per gram if overriding today rate' })
  @IsOptional()
  @IsNumber()
  custom_rate?: number;

  @ApiPropertyOptional({ description: 'UPI or Bank transaction reference' })
  @IsOptional()
  @IsString()
  transaction_ref?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSchemeDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsNotEmpty()
  @IsString()
  customer_id: string;

  @ApiPropertyOptional({ description: 'Scheme title or plan name', example: 'Flexi Gold Accumulation' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Target gold weight in grams', example: 8.0 })
  @IsOptional()
  @IsNumber()
  target_grams?: number;

  @ApiPropertyOptional({ description: 'Target amount in INR', example: 50000 })
  @IsOptional()
  @IsNumber()
  target_amount?: number;

  @ApiPropertyOptional({ description: 'Notes or terms' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: InitialDepositDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InitialDepositDto)
  initial_deposit?: InitialDepositDto;
}
