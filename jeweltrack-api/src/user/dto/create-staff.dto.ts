import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateStaffDto {
  @ApiProperty({ example: 'Suresh Kumar' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '9876543211' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10}$/, { message: 'Phone must be a valid 10 digit number' })
  phone: string;

  @ApiProperty({ example: 'staff123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: [Role.MANAGER, Role.CASHIER], example: Role.CASHIER })
  @IsEnum(Role, { message: 'Role must be MANAGER or CASHIER' })
  role: Role;

  @ApiProperty({ example: 'staff@jeweltrack.com', required: false })
  @IsOptional()
  @IsString()
  email?: string;
}
