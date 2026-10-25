import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDealerDto {
  @ApiProperty({ example: 'Senthil Kumar', description: 'Dealer or contact person name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Sri Murugan Jewellery', description: 'Shop or business name' })
  @IsNotEmpty()
  @IsString()
  shop_name: string;

  @ApiProperty({ example: '9876543210', description: 'Phone number' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: '12 Car Street, Bazaar', description: 'Shop address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Salem', description: 'City / Town' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 0, description: 'Initial / opening pure gold balance in grams' })
  @IsOptional()
  @IsNumber()
  opening_pure_balance?: number;

  @ApiPropertyOptional({ example: 'Regular counter lending party', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
