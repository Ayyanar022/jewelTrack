import { IsOptional, IsString } from "class-validator";


export class UpdateShopTaxDto {
  @IsOptional()
  @IsString()
  gstin?: string;

  @IsOptional()
  @IsString()
  pan?: string;
}