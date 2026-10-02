import { Controller, Post, Body, Req, UseGuards } from "@nestjs/common";
import { ShippingService } from "./shipping.service";
import { Public, Roles } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller()
@UseGuards(JwtAuthGuard)
export class ShippingController {
  constructor(private shipping: ShippingService) {}

  @Roles("ADMIN", "MANAGER", "PACKER")
  @Post("admin/shipments")
  send(@Req() req: any, @Body() b: { orderId: string; courier?: string }) {
    return this.shipping.create(b.orderId, b.courier, req.user?.id);
  }

  @Public()
  @Post("shipping/webhook")
  hook(@Body() b: { consignmentId: string; status: string }) {
    return this.shipping.webhook(b.consignmentId, b.status);
  }
}
