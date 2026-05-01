import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import {  IsInt, IsNotEmpty, IsNumber, IsOptional } from "class-validator"



export class CreateRateDto{

 @ApiProperty({ example: 6200 })
@IsInt()
@IsNotEmpty()
  rate_22k!:number

@ApiProperty({ example: 5100 })
@IsInt()
@IsNotEmpty()
  rate_18k! :number

@ApiPropertyOptional({ example: 6600 })
@IsInt()
@IsNotEmpty()
@IsOptional()
  rate_999? :number

@ApiProperty({ example: 85 })
@IsInt()
@IsNotEmpty()
  rate_silver! :number
}