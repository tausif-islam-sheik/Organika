import { Module } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { AdminOrdersController } from "./admin-orders.controller";
import { CheckoutModule } from "../checkout/checkout.module";

@Module({
  imports: [CheckoutModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
