import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsIn } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsString()
  plan_id!: string;

  @ApiProperty({ enum: [1, 3, 6, 12] })
  @IsInt()
  @IsIn([1, 3, 6, 12])
  duration_months!: number;
}