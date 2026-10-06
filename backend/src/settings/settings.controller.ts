import { Controller, Get, Patch, Body, Param, UseGuards } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { Public, Roles } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Public()
@Controller("settings")
export class PublicSettingsController {
  constructor(private settings: SettingsService) {}

  @Get(":key")
  one(@Param("key") key: string) {
    return this.settings.get(key);
  }
}

@Controller("admin/settings")
@UseGuards(JwtAuthGuard)
export class AdminSettingsController {
  constructor(private settings: SettingsService) {}

  @Roles("ADMIN", "MANAGER", "PACKER")
  @Get()
  all() {
    return this.settings.all();
  }

  @Roles("ADMIN", "MANAGER", "PACKER")
  @Get(":key")
  one(@Param("key") key: string) {
    return this.settings.get(key);
  }

  @Roles("ADMIN", "MANAGER")
  @Patch(":key")
  set(@Param("key") key: string, @Body() body: { value: any }) {
    return this.settings.set(key, body.value ?? body);
  }
}
