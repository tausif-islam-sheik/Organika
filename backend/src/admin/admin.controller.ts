import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { Roles } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("admin")
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private admin: AdminService) {}

  @Roles("ADMIN", "MANAGER", "PACKER")
  @Get("stats")
  stats() {
    return this.admin.stats();
  }

  @Roles("ADMIN", "MANAGER", "PACKER")
  @Get("sales-series")
  series(@Query("days") days?: string) {
    return this.admin.salesSeries(Number(days) || 14);
  }

  @Roles("ADMIN", "MANAGER", "PACKER")
  @Get("orders-series")
  ordersSeries(@Query("days") days?: string) {
    return this.admin.ordersSeries(Number(days) || 14);
  }
}
