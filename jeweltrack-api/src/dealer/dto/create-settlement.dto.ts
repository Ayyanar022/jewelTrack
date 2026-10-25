import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SettlementMode } from '@prisma/client';

export class CreateSettlementDto {
  @ApiProperty({ description: 'Target Dealer ID' })
  @IsNotEmpty()
  @IsString()
  dealer_id: string;

  @ApiProperty({ enum: SettlementMode, default: SettlementMode.PURE_GOLD, description: 'Payment Mode' })
  @IsNotEmpty()
  @IsEnum(SettlementMode)
  payment_mode: SettlementMode;

  @ApiProperty({ example: 10.500, description: 'Pure Gold weight credited in grams' })
  @IsNotEmpty()
  @IsNumber()
  pure_weight_received: number;

  @ApiPropertyOptional({ example: 11.450, description: 'Gross weight if metal / scrap bar given' })
  @IsOptional()
  @IsNumber()
  gross_weight?: number;

  @ApiPropertyOptional({ example: 91.6, description: 'Touch % if scrap metal conversion' })
  @IsOptional()
  @IsNumber()
  touch?: number;

  @ApiPropertyOptional({ example: 75000, description: 'Cash amount if cash settlement' })
  @IsOptional()
  @IsNumber()
  cash_amount?: number;

  @ApiPropertyOptional({ example: 7500, description: 'Pure gold rate per gram used for cash conversion' })
  @IsOptional()
  @IsNumber()
  pure_gold_rate?: number;

  @ApiPropertyOptional({ description: 'Settlement date' })
  @IsOptional()
  date?: string | Date;

  @ApiPropertyOptional({ example: 'Received 999 24K bar from Senthil', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
