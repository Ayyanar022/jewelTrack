import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Metal, Purity } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, isNotEmpty, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";



export class CreateBillItemDto{
    @ApiProperty({example:"Chain"})
    @IsString()
    @IsNotEmpty()
    category_id!:string;

    @ApiPropertyOptional({enum: Purity,example:Purity.K22})
    @IsOptional()
    @IsEnum(Purity)
    purity?:Purity;

    @ApiProperty({example:16.20})
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    gross_weight!:number; 

    @ApiProperty({example:16.20})
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    net_weight!:number; 

    @ApiPropertyOptional({example:16.20})
    @IsOptional()
    @IsNumber()
    @Min(0)
    stone!:number; 

    @ApiProperty({enum:Metal , example:Metal.GOLD})
    @IsEnum(Metal)
    metal!:Metal

    // @ApiProperty({example:8.02})
    // @IsNumber()
    // @Min(0)
    // weight!:number;

    @ApiPropertyOptional({example:0.5})
    @IsNumber()
    @IsOptional()
    @Min(0)
    wastage?:number

    @ApiProperty({example:6400})
    @IsNotEmpty()
    @IsNumber()
    rate!:number

    @ApiProperty({example:230})
    @IsOptional()
    @IsNumber()
    making_charge!:number

    @ApiProperty({example:39930})
    @IsNotEmpty()
    @IsNumber()
    amount!:number

 

}


export class CreateBillDto{
    @ApiProperty({example:"customer-uuid-here"})
    @IsString()
    @IsNotEmpty()
    customer_id!:string;

    @ApiPropertyOptional({example:false})
    @IsOptional()
    @IsBoolean()
    is_gst_bill?:boolean

    @ApiProperty({example:100})
    @IsNumber()
    @IsOptional()
    @Min(0)
    discount!:number

    @ApiPropertyOptional({example:"paid by cash"})
    @IsOptional()
    @IsString()
    notes?:string

    @ApiProperty({type:[CreateBillItemDto]})
    @IsArray()
    @ValidateNested({each:true})
    @Type(()=>CreateBillItemDto)
    billItem !:CreateBillItemDto[];

    @ApiProperty({example:36900})
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    totalAmount! :number

    @ApiProperty({example:3600})
    @IsNumber()
    @IsOptional()
    totalGST? :number

    @ApiProperty({example:36900})
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    payableAmount! :number

    }


    