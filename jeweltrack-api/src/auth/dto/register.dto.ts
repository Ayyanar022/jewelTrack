import { ApiProperty } from "@nestjs/swagger";
import { isNotEmpty, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";


export class RegisterDto{
     @ApiProperty({ example: 'Sri Lakshmi Jewels' })
    @IsString()
    @IsNotEmpty()
    name:string;

    @ApiProperty({ example: 'Ramesh Kumar' })
    @IsString()
    @IsNotEmpty()
    owner_name:string ;

    @ApiProperty({ example: '9876543210' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^[0-9]{10}$/, { message: 'Phone must be a valid 10 digit number' })
    phone:string

    @ApiProperty({ example: 'secret123', minLength: 6 })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password:string
}