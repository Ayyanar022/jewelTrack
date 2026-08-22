import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class RepayLoanDto {
  @ApiProperty({ example: 0, description: 'Principal amount paid in Rupees' })
  @IsInt()
  @Min(0)
  principal_paid: number;

  @ApiProperty({ example: 1500, description: 'Interest amount paid in Rupees' })
  @IsInt()
  @Min(0)
  interest_paid: number;

  @ApiProperty({ example: 0, description: 'Discount / waiver given by shop in Rupees', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  discount_amount?: number;

  @ApiProperty({ example: 'Payment via GPay', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: false, description: 'Set true if full loan is settled and gold returned' })
  @IsOptional()
  @IsBoolean()
  is_closing?: boolean;
}
