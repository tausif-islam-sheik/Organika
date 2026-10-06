import { Controller, Get, Patch, Body, Param, Query, UseGuards } from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { Roles } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("admin/customers")
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private customers: CustomersService) {}

  @Roles("ADMIN", "MANAGER", "PACKER")
  @Get()
  list(@Query("q") q?: string) {
    return this.customers.list(q);
  }

  @Roles("ADMIN", "MANAGER", "PACKER")
  @Get(":id")
  detail(@Param("id") id: string) {
    return this.customers.detail(id);
  }

  @Roles("ADMIN")
  @Patch(":id/role")
  role(@Param("id") id: string, @Body() b: { role: string }) {
    return this.customers.setRole(id, b.role);
  }
}
