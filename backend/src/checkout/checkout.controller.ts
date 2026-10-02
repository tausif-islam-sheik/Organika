import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { CheckoutService } from "./checkout.service";
import { Public } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("checkout")
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private checkout: CheckoutService) {}

  @Public()
  @Post("quote")
  quote(@Body() b: { items: { variantId: string; quantity: number }[]; zoneId?: string; couponCode?: string }) {
    return this.checkout.quote(b.items, b.zoneId, b.couponCode);
  }
}
