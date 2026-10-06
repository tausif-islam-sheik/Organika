import { Module } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { AdminOrdersController } from "./admin-orders.controller";
import { CheckoutModule } from "../checkout/checkout.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [CheckoutModule, NotificationsModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
