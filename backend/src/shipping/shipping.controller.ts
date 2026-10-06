import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { ShippingService } from "./shipping.service";
import { Public, Roles } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller()
@UseGuards(JwtAuthGuard)
export class ShippingController {
  constructor(private shipping: ShippingService) {}

  @Public()
  @Get("delivery-zones")
  publicZones() {
    return this.shipping.zones();
  }

  @Roles("ADMIN", "MANAGER", "PACKER")
  @Post("admin/shipments")
  send(@Body() b: { orderId: string; courier?: string }) {
    return this.shipping.create(b.orderId, b.courier);
  }

  @Roles("ADMIN", "MANAGER", "PACKER")
  @Get("admin/delivery-zones")
  zones() {
    return this.shipping.zones();
  }

  @Roles("ADMIN", "MANAGER")
  @Post("admin/delivery-zones")
  mkZone(@Body() b: any) {
    return this.shipping.createZone(b);
  }

  @Roles("ADMIN", "MANAGER")
  @Patch("admin/delivery-zones/:id")
  upZone(@Param("id") id: string, @Body() b: any) {
    return this.shipping.updateZone(id, b);
  }

  @Roles("ADMIN", "MANAGER")
  @Delete("admin/delivery-zones/:id")
  delZone(@Param("id") id: string) {
    return this.shipping.deleteZone(id);
  }

  @Public()
  @Post("shipping/webhook")
  hook(@Body() b: { consignmentId: string; status: string }) {
    return this.shipping.webhook(b.consignmentId, b.status);
  }
}
