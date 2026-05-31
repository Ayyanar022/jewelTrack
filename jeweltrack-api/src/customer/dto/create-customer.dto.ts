import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, isString, IsString, Matches } from "class-validator";



export class CreateCustomerDto {
    @ApiProperty({example:"MagaLakshmi"})
    @IsNotEmpty()
    @IsString()
    name!:string;

    @ApiProperty({example:'9876543210'})
    @IsNotEmpty()
    @Matches(/^[0-9]{10}$/, { message: 'Phone must be a valid 10 digit number' })
    phone!:string;

    @ApiProperty({ example: 'Erode' })
     @IsNotEmpty()
    @IsString()
    village!:string

    @ApiPropertyOptional({ example: '123 Main St, Erode' })
    @IsOptional()
    @IsString()
    address?:string


}


export class UpdateCustomerDto {
    @ApiProperty({example:"MagaLakshmi"})
    @IsNotEmpty()
    @IsString()
    name!:string;

    @ApiProperty({example:'9876543210'})
    @IsNotEmpty()
    @Matches(/^[0-9]{10}$/, { message: 'Phone must be a valid 10 digit number' })
    phone!:string;

    @ApiProperty({ example: 'Erode' })
     @IsNotEmpty()
    @IsString()
    village!:string

    @ApiPropertyOptional({ example: '123 Main St, Erode' })
    @IsOptional()
    @IsString()
    address!:string

    @ApiPropertyOptional({example:"cus-id"})  
    @IsString()
    id!:string

    @ApiPropertyOptional({example:"shop-id"})
    @IsString()
    shop_id!:string

    @ApiPropertyOptional({example:"34-08-2026"})
    @IsString()
    created_at!:string


}