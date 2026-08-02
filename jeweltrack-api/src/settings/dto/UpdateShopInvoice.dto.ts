

import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateShopInvoiceDto {
  @IsString()
  @MaxLength(10)
  invoice_prefix!: string;

  @IsString()
  @MaxLength(10)
  estimate_prefix!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  terms_conditions?: string;
}