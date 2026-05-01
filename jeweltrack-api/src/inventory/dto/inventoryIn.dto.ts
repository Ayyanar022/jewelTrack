import { ApiProperty } from "@nestjs/swagger";
import { Purity, ReferenceType, StockType, Type } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";




export class In_out_adj_dto{
    @ApiProperty({example:"category_Id"})
    @IsNotEmpty()
    @IsString()
    category_id!:string 

    @ApiProperty({enum:Type ,example:Type.IN})
    @IsNotEmpty()
    @IsEnum(Type)
    type! : Type

    @ApiProperty({example:34.89})
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    weight! : number 

    @ApiProperty({enum:Purity ,example:Purity.K18})
    @IsNotEmpty()
    @IsEnum(Purity)
    purity! : Purity


    // @ApiProperty({enum:StockType ,example:StockType.OWN})
    // @IsNotEmpty()
    // @IsEnum(StockType)
    // stockType!: StockType

    @ApiProperty({enum:ReferenceType ,example:ReferenceType.BILL})
    @IsNotEmpty()
    @IsEnum(ReferenceType)
    reference! : ReferenceType

    // @ApiProperty({example:'bill reference id'})
    // @IsOptional()
    // @IsString()
    // reference_id?  : string

}