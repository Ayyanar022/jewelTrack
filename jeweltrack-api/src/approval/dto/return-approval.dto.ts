import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReturnApprovalItemDto {
  @ApiProperty({ description: 'Approval Item ID' })
  @IsNotEmpty()
  @IsString()
  item_id: string;

  @ApiProperty({ example: 1, description: 'Pieces returned by the dealer' })
  @IsNotEmpty()
  @IsNumber()
  pieces_in: number;

  @ApiProperty({ example: 5.120, description: 'Gross weight returned in grams' })
  @IsNotEmpty()
  @IsNumber()
  gross_weight_in: number;

  @ApiProperty({ example: 5.000, description: 'Net weight returned in grams' })
  @IsNotEmpty()
  @IsNumber()
  net_weight_in: number;

  @ApiPropertyOptional({ example: 0.050, description: 'Optional hallmark pure gold in grams' })
  @IsOptional()
  @IsNumber()
  hallmark_charge?: number;
}

export class ReturnApprovalMemoDto {
  @ApiProperty({ type: [ReturnApprovalItemDto], description: 'Items returned' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnApprovalItemDto)
  items: ReturnApprovalItemDto[];

  @ApiPropertyOptional({ example: 'Partial return received at counter', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
