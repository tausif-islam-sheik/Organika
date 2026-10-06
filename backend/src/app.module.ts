import { Module, Controller, Get } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { CatalogModule } from "./catalog/catalog.module";
import { CartModule } from "./cart/cart.module";
import { CheckoutModule } from "./checkout/checkout.module";
import { OrdersModule } from "./orders/orders.module";
import { PaymentsModule } from "./payments/payments.module";
import { ShippingModule } from "./shipping/shipping.module";
import { AdminModule } from "./admin/admin.module";
import { UploadsModule } from "./uploads/uploads.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { SettingsModule } from "./settings/settings.module";
import { CustomersModule } from "./customers/customers.module";
import { CouponsModule } from "./coupons/coupons.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { Public } from "./auth/decorators";

@Controller()
class HealthController {
  @Public()
  @Get("health")
  health() {
    return { ok: true, service: "organika-backend" };
  }
}

@Module({
  imports: [PrismaModule, AuthModule, CatalogModule, CartModule, CheckoutModule, OrdersModule, PaymentsModule, ShippingModule, AdminModule, UploadsModule, NotificationsModule, SettingsModule, CustomersModule, CouponsModule, ReviewsModule],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
