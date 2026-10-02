import { Controller, Get, Post, Body, Param, Req, UseGuards } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { Public } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private orders: OrdersService) {}

  // Guest checkout allowed (MVP) — attaches user when logged in
  @Public()
  @Post()
  create(@Req() req: any, @Body() b: any) {
    return this.orders.create(req.user?.id, b);
  }

  @Public()
  @Get("track/:orderNo")
  track(@Param("orderNo") no: string) {
    return this.orders.byNo(no);
  }

  @Get("mine")
  mine(@Req() req: any) {
    return this.orders.mine(req.user.id);
  }
}
