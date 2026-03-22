import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";



export class CreateCustomerDto {
    @ApiProperty({example:"MagaLakshmi"})
    @IsNotEmpty()
    @IsString()
    name:string;

    @ApiProperty({example:'9876543210'})
    @IsNotEmpty()
    @Matches(/^[0-9]{10}$/, { message: 'Phone must be a valid 10 digit number' })
    phone:string;

    @ApiProperty({ example: 'Erode' })
     @IsNotEmpty()
    @IsString()
    village:string

    @ApiPropertyOptional({ example: '123 Main St, Erode' })
    @IsOptional()
    @IsString()
    address:string

}