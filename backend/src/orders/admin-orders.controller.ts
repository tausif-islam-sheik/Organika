import { Controller, Get, Patch, Body, Param, Query, UseGuards } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { Roles } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("admin/orders")
@UseGuards(JwtAuthGuard)
export class AdminOrdersController {
  constructor(private orders: OrdersService) {}

  @Roles("ADMIN", "MANAGER", "PACKER")
  @Get()
  list(@Query("status") s?: string) {
    return this.orders.list(s);
  }

  @Roles("ADMIN", "MANAGER", "PACKER")
  @Patch(":id/status")
  transition(@Param("id") id: string, @Body() b: { to: string; note?: string; by?: string }) {
    return this.orders.transition(id, b.to, b.by, b.note);
  }
}
