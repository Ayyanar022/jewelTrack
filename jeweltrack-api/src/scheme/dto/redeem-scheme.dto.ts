import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RedeemSchemeDto {
  @ApiProperty({
    description: 'Gold grams to redeem (supports partial or full redemption)',
    example: 5.0,
  })
  @IsNumber()
  @Min(0.001)
  grams_redeemed: number;

  @ApiPropertyOptional({
    description: '22K (916) rate per gram applied at redemption (if omitted, latest daily rate is used)',
    example: 14100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  gold_rate_applied?: number;

  @ApiPropertyOptional({ description: 'Optional Bill Number / Invoice Ref where this gold is used' })
  @IsOptional()
  @IsString()
  bill_number?: string;

  @ApiPropertyOptional({ description: 'Notes or redemption details (e.g. Redeemed for 22K Ring)' })
  @IsOptional()
  @IsString()
  notes?: string;
}
