import { Injectable, BadRequestException, NotFoundException, ConflictException } from "@nestjs/common";
import { randomInt } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CheckoutService } from "../checkout/checkout.service";

const FLOW: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "FAILED"],
  DELIVERED: ["RETURNED"],
  FAILED: [],
  CANCELLED: [],
  RETURNED: [],
};
const RELEASE = new Set(["CANCELLED", "FAILED", "RETURNED"]);

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService, private checkout: CheckoutService) {}

  async create(
    userId: string | undefined,
    b: {
      items: { variantId: string; quantity: number }[];
      address: any;
      zoneId?: string;
      couponCode?: string;
      paymentMethod?: string;
    },
  ) {
    if (!["COD", "SSLCOMMERZ", undefined].includes(b.paymentMethod)) throw new BadRequestException("Bad method");
    const q = await this.checkout.quote(b.items, b.zoneId, b.couponCode);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: b.items.map((i) => i.variantId) } },
      include: { product: true },
    });

    // Unique order no with retry
    for (let attempt = 0; attempt < 5; attempt++) {
      const orderNo = `GB-${260000 + randomInt(1, 39999)}`;
      try {
        return await this.prisma.$transaction(async (tx) => {
          // Reserve stock atomically
          for (const it of b.items) {
            const r = await tx.productVariant.updateMany({
              where: { id: it.variantId, stock: { gte: it.quantity } },
              data: { stock: { decrement: it.quantity } },
            });
            if (r.count === 0) throw new ConflictException("Out of stock during checkout");
          }
          const order = await tx.order.create({
            data: {
              orderNo,
              userId,
              status: "PENDING",
              paymentMethod: b.paymentMethod ?? "COD",
              paymentStatus: "UNPAID",
              subtotal: q.subtotal,
              delivery: q.delivery,
              discount: q.discount,
              total: q.total,
              couponId: q.couponId,
              address: b.address,
              items: {
                create: b.items.map((it) => {
                  const v = variants.find((x) => x.id === it.variantId)!;
                  return {
                    variantId: v.id,
                    nameSnapshot: `${v.product.nameEn} (${v.label})`,
                    price: v.price,
                    quantity: it.quantity,
                    lineTotal: v.price * it.quantity,
                  };
                }),
              },
              history: { create: { from: null, to: "PENDING", note: "Order placed" } },
            },
            include: { items: true },
          });
          if (q.couponId) await tx.coupon.update({ where: { id: q.couponId }, data: { usedCount: { increment: 1 } } });
          return order;
        });
      } catch (e: any) {
        if (e?.code === "P2002") continue; // orderNo collision → retry
        throw e;
      }
    }
    throw new ConflictException("Please retry order");
  }

  byNo(orderNo: string) {
    return this.prisma.order.findUnique({ where: { orderNo }, include: { items: true, history: { orderBy: { createdAt: "asc" } } } });
  }

  mine(userId: string) {
    return this.prisma.order.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { items: true } });
  }

  async transition(id: string, to: string, changedBy?: string, note?: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundException("Order not found");
    if (!FLOW[order.status]?.includes(to)) throw new BadRequestException(`${order.status} → ${to} not allowed`);
    return this.prisma.$transaction(async (tx) => {
      if (RELEASE.has(to)) {
        for (const it of order.items) {
          await tx.productVariant.update({ where: { id: it.variantId }, data: { stock: { increment: it.quantity } } });
        }
      }
      return tx.order.update({
        where: { id },
        data: {
          status: to as any,
          history: { create: { from: order.status, to, changedBy, note } },
        },
        include: { items: true, history: { orderBy: { createdAt: "asc" } } },
      });
    });
  }

  list(status?: string) {
    return this.prisma.order.findMany({
      where: status ? { status: status as any } : {},
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { items: true },
    });
  }
}
