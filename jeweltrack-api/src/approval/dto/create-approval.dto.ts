import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Metal, Purity } from '@prisma/client';

export class CreateApprovalItemDto {
  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsString()
  category_id?: string;

  @ApiProperty({ example: 'Ladies Ring', description: 'Item description' })
  @IsNotEmpty()
  @IsString()
  item_name: string;

  @ApiProperty({ enum: Metal, default: Metal.GOLD })
  @IsOptional()
  @IsEnum(Metal)
  metal?: Metal;

  @ApiProperty({ enum: Purity, default: Purity.K22 })
  @IsOptional()
  @IsEnum(Purity)
  purity?: Purity;

  @ApiProperty({ example: 91.6, description: 'Category Touch % (e.g. 91.6, 92, 75)' })
  @IsNotEmpty()
  @IsNumber()
  touch: number;

  @ApiProperty({ example: 2, description: 'Pieces given out' })
  @IsNotEmpty()
  @IsNumber()
  pieces_out: number;

  @ApiProperty({ example: 10.250, description: 'Gross weight given out in grams' })
  @IsNotEmpty()
  @IsNumber()
  gross_weight_out: number;

  @ApiProperty({ example: 10.000, description: 'Net weight given out in grams' })
  @IsNotEmpty()
  @IsNumber()
  net_weight_out: number;

  @ApiPropertyOptional({ example: 45, description: 'Optional hallmark charge in ₹' })
  @IsOptional()
  @IsNumber()
  hallmark_charge?: number;
}

export class CreateApprovalMemoDto {
  @ApiProperty({ description: 'Dealer / Partner ID' })
  @IsNotEmpty()
  @IsString()
  dealer_id: string;

  @ApiPropertyOptional({ description: 'Outward date' })
  @IsOptional()
  date?: string | Date;

  @ApiPropertyOptional({ example: 'Approval for party customer viewing', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateApprovalItemDto], description: 'Items issued on approval' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateApprovalItemDto)
  items: CreateApprovalItemDto[];
}
