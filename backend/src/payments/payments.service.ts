import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

// SSLCommerz: sandbox when creds exist, demo mode otherwise.
// Rule: only server-to-server IPN marks an order PAID — never the browser redirect.
@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async initSsl(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");
    if (order.paymentStatus === "PAID") throw new BadRequestException("Already paid");
    const tranId = `ORG-${order.orderNo}-${randomBytes(3).toString("hex").toUpperCase()}`;
    await this.prisma.payment.create({
      data: { orderId, method: "SSLCOMMERZ", status: "PENDING", amount: order.total, gatewayTxnId: tranId },
    });

    const storeId = process.env.SSLCZ_STORE_ID;
    const storePass = process.env.SSLCZ_STORE_PASSWD;
    if (storeId && storePass) {
      const sandbox = process.env.SSLCZ_SANDBOX !== "false";
      const base = sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";
      const params = new URLSearchParams({
        store_id: storeId,
        store_passwd: storePass,
        total_amount: String(order.total / 100),
        currency: "BDT",
        tran_id: tranId,
        success_url: `${process.env.PUBLIC_APP_URL ?? "http://localhost:3000"}/payment/success?tran=${tranId}`,
        fail_url: `${process.env.PUBLIC_APP_URL ?? "http://localhost:3000"}/payment/fail?tran=${tranId}`,
        cancel_url: `${process.env.PUBLIC_APP_URL ?? "http://localhost:3000"}/payment/fail?tran=${tranId}`,
        ipn_url: `${process.env.PUBLIC_API_URL ?? "http://localhost:4000"}/payments/ipn`,
        cus_name: "Organika Customer",
        cus_phone: "01XXXXXXXXX",
        cus_add1: "Dhaka",
        cus_city: "Dhaka",
        cus_country: "Bangladesh",
        shipping_method: "Courier",
        product_name: `Organika order ${order.orderNo}`,
        product_category: "Grocery",
        product_profile: "general",
      });
      const r = await fetch(`${base}/gwprocess/v4/api.php`, { method: "POST", body: params });
      const j: any = await r.json();
      if (j?.GatewayPageURL) return { gatewayUrl: j.GatewayPageURL, tranId };
      throw new BadRequestException(`Gateway init failed: ${j?.failedreason ?? "unknown"}`);
    }
    return { demo: true, tranId, message: "Set SSLCZ_STORE_ID/PASSWD for live gateway" };
  }

  // Idempotent IPN handler — safe to receive twice
  async ipn(body: any) {
    const tranId: string | undefined = body?.tran_id;
    if (!tranId) throw new BadRequestException("Missing tran_id");
    const payment = await this.prisma.payment.findUnique({ where: { gatewayTxnId: tranId }, include: { order: true } });
    if (!payment) throw new NotFoundException("Unknown transaction");
    if (payment.status === "PAID") return { ok: true, dedup: true };

    const okStatus = ["VALID", "VALIDATED"].includes(String(body?.status ?? "").toUpperCase());
    const paidBdt = Number(body?.amount ?? body?.total_amount ?? NaN);
    const amountOk = !Number.isNaN(paidBdt) && Math.round(paidBdt * 100) === payment.amount;
    if (!okStatus || !amountOk) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", rawIpn: body } });
      return { ok: false, reason: "validation failed" };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: payment.id }, data: { status: "PAID", rawIpn: body } });
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
          history: { create: { from: payment.order.status, to: "CONFIRMED", note: `Paid via SSLCommerz ${tranId}` } },
        },
      });
    });
    return { ok: true };
  }
}
