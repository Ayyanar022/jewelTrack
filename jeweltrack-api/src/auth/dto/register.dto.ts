import { isNotEmpty, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";


export class RegisterDto{
    @IsString()
    @IsNotEmpty()
    name:string;

    @IsString()
    @IsNotEmpty()
    owner_name:string ;

    @IsString()
    @IsNotEmpty()
    @Matches(/^[0-9]{10}$/, { message: 'Phone must be a valid 10 digit number' })
    phone:string

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password:string
}