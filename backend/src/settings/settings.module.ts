import { Module } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { PublicSettingsController, AdminSettingsController } from "./settings.controller";

@Module({ controllers: [PublicSettingsController, AdminSettingsController], providers: [SettingsService], exports: [SettingsService] })
export class SettingsModule {}
