import { Controller, Get, Post, Patch, Delete, Body, Query, Req, UseGuards } from "@nestjs/common";
import { CartService } from "./cart.service";
import { Public } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cart: CartService) {}

  private who(req: any, guestToken?: string) {
    return { userId: req.user?.id as string | undefined, guestToken: guestToken ?? req.query?.guestToken };
  }

  @Public()
  @Get()
  get(@Req() req: any, @Query("guestToken") g?: string) {
    const { userId, guestToken } = this.who(req, g);
    return this.cart.get(userId, guestToken);
  }

  @Public()
  @Post("items")
  add(@Req() req: any, @Body() b: { guestToken?: string; variantId: string; quantity: number }) {
    const { userId } = this.who(req, b.guestToken);
    return this.cart.addItem(userId, b.guestToken, b.variantId, b.quantity);
  }

  @Public()
  @Patch("items")
  set(@Req() req: any, @Body() b: { guestToken?: string; variantId: string; quantity: number }) {
    const { userId } = this.who(req, b.guestToken);
    return this.cart.setQty(userId, b.guestToken, b.variantId, b.quantity);
  }

  @Post("merge")
  merge(@Req() req: any, @Body() b: { guestToken: string }) {
    return this.cart.merge(req.user.id, b.guestToken);
  }

  @Public()
  @Delete("items")
  del(@Req() req: any, @Body() b: { guestToken?: string; variantId: string }) {
    const { userId } = this.who(req, b.guestToken);
    return this.cart.setQty(userId, b.guestToken, b.variantId, 0);
  }
}
