// import { PartialType } from '@nestjs/mapped-types';
import { PartialType } from '@nestjs/swagger';
import { CreateShopSettingDto } from './CreateShopSetting.Dto ';

export class UpdateShopSettingDto extends PartialType(CreateShopSettingDto) {}