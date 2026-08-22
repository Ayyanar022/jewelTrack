import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsIn, IsNotEmpty } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  razorpay_order_id!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  razorpay_payment_id!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  razorpay_signature!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  plan_id!: string;

  @ApiProperty({ enum: [1, 3, 6, 12] })
  @IsInt()
  @IsIn([1, 3, 6, 12])
  duration_months!: number;
}
