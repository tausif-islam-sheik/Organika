import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { Public } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("payments")
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Public()
  @Post("ssl/init")
  init(@Body() b: { orderId: string }) {
    return this.payments.initSsl(b.orderId);
  }

  // Gateway server-to-server callback — must stay public
  @Public()
  @Post("ipn")
  ipn(@Body() b: any) {
    return this.payments.ipn(b);
  }
}
