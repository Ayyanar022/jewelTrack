import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator"



export class LoginDto{

        @IsString()
        @IsNotEmpty()
        @Matches(/^[0-9]{10}$/, { message: 'Phone must be a valid 10 digit number' })
        phone:string
    
        @IsString()
        @IsNotEmpty()
        @MinLength(6)
        password:string
}