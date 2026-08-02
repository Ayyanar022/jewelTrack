import { IsOptional, isString, IsString } from "class-validator";


export class CreateShopSettingDto {

  @IsString()
  shop_name!: string;

  @IsOptional()
  @IsString()
  owner_name?: string;

   @IsOptional()
  @IsString()
  address?: string;

   @IsOptional()
  @IsString()
  phone?: string;

 @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  email?: string;
}