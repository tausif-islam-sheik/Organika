import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { CouponsService } from "./coupons.service";
import { Roles } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("admin/coupons")
@UseGuards(JwtAuthGuard)
@Roles("ADMIN", "MANAGER")
export class CouponsController {
  constructor(private coupons: CouponsService) {}

  @Get() list() { return this.coupons.list(); }
  @Post() create(@Body() b: any) { return this.coupons.create(b); }
  @Patch(":id") update(@Param("id") id: string, @Body() b: any) { return this.coupons.update(id, b); }
  @Delete(":id") remove(@Param("id") id: string) { return this.coupons.remove(id); }
}
