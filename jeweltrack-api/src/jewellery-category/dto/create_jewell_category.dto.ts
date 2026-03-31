import { ApiProperty } from "@nestjs/swagger";
import { Metal } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";




export class CreateJewelleryCatdto{

    @ApiProperty({example:"Chain"})
    @IsNotEmpty()
    @IsString()
    name:string ;

    @ApiProperty({enum:Metal})
    @IsEnum(Metal)
    @IsNotEmpty()
    metal:Metal ; 

    @IsOptional()
    @IsNumber()
    default_wastage:number;

    @IsOptional()
    @IsNumber()
    default_making_charge:number;

    @IsOptional()
    @IsNumber()
    touch_22k:number ;

    @IsOptional()
    @IsNumber()
    touch_18k:number ;

    @IsOptional()
    @IsNumber()
    touch_24k:number ;

}