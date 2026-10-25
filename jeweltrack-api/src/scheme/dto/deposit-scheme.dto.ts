import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { SchemePaymentMode } from '@prisma/client';

export class DepositSchemeDto {
  @ApiProperty({ description: 'Cash amount deposited in INR', example: 5000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  cash_amount: number;

  @ApiPropertyOptional({
    description: 'Gold rate for 22K (916) per gram applied. If not provided, latest shop rate is used.',
    example: 6850,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  gold_rate_applied?: number;

  @ApiPropertyOptional({ enum: SchemePaymentMode, default: SchemePaymentMode.CASH })
  @IsOptional()
  @IsEnum(SchemePaymentMode)
  payment_mode?: SchemePaymentMode = SchemePaymentMode.CASH;

  @ApiPropertyOptional({ description: 'Transaction reference or UTR number' })
  @IsOptional()
  @IsString()
  transaction_ref?: string;

  @ApiPropertyOptional({ description: 'Payment notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Payment date (defaults to current time)' })
  @IsOptional()
  @IsString()
  payment_date?: string;
}
