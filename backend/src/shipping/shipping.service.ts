import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

// Courier adapters: one interface, dev stub + real APIs behind env keys (Phase 4+).
// Steadfast / Pathao / RedX plug in here without touching order code.
const WEBHOOK_TO_ORDER: Record<string, string> = {
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
  failed: "FAILED",
};

@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  async create(orderId: string, courier = "STEADFAST", by?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");
    if (!["CONFIRMED", "PROCESSING"].includes(order.status))
      throw new BadRequestException("Confirm order before dispatch");
    const consignmentId = `${courier.slice(0, 2)}-${randomBytes(4).toString("hex").toUpperCase()}`;
    return this.prisma.$transaction(async (tx) => {
      const ship = await tx.shipment.upsert({
        where: { orderId },
        update: { courier, consignmentId, trackingCode: consignmentId, status: "HANDED_OVER" },
        create: { orderId, courier, consignmentId, trackingCode: consignmentId, status: "HANDED_OVER" },
      });
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "SHIPPED",
          history: { create: { from: order.status, to: "SHIPPED", changedBy: by, note: `${courier} ${consignmentId}` } },
        },
      });
      return ship;
    });
  }

  async webhook(consignmentId: string, status: string) {
    const ship = await this.prisma.shipment.findUnique({ where: { consignmentId }, include: { order: true } });
    if (!ship) throw new NotFoundException("Unknown consignment");
    const to = WEBHOOK_TO_ORDER[status.toLowerCase()];
    await this.prisma.shipment.update({ where: { id: ship.id }, data: { status: status.toUpperCase() } });
    if (to && to !== ship.order.status) {
      const allowed: Record<string, string[]> = { SHIPPED: ["DELIVERED", "FAILED"], DELIVERED: ["RETURNED"] };
      if (allowed[ship.order.status]?.includes(to)) {
        await this.prisma.order.update({
          where: { id: ship.orderId },
          data: { status: to as any, history: { create: { from: ship.order.status, to, note: `Courier: ${status}` } } },
        });
      }
    }
    return { ok: true };
  }
}
