import { Module } from "@nestjs/common";
import { SettingController } from "./settings.controller";
import { SettingService } from "./settings.service";


@Module({
    controllers :[SettingController],
    providers:[SettingService]
})

export class SettingsModule {}



