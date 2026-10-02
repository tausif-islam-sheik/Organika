import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export type QuoteItem = { variantId: string; quantity: number };

@Injectable()
export class CheckoutService {
  constructor(private prisma: PrismaService) {}

  async quote(items: QuoteItem[], zoneId?: string, couponCode?: string) {
    if (!items?.length) throw new BadRequestException("Empty cart");
    const ids = items.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({ where: { id: { in: ids } } });
    if (variants.length !== ids.length) throw new BadRequestException("Unknown variant");
    let subtotal = 0;
    for (const it of items) {
      const v = variants.find((x) => x.id === it.variantId)!;
      if (it.quantity < 1) throw new BadRequestException("Bad quantity");
      if (v.stock < it.quantity) throw new BadRequestException(`Out of stock: ${v.sku}`);
      subtotal += v.price * it.quantity;
    }

    let zone = zoneId
      ? await this.prisma.deliveryZone.findUnique({ where: { id: zoneId } })
      : await this.prisma.deliveryZone.findFirst({ orderBy: { sortOrder: "asc" } });
    if (!zone) throw new NotFoundException("No delivery zone");
    let delivery = zone.charge;
    if (zone.freeOver && subtotal >= zone.freeOver) delivery = 0;

    let discount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await this.prisma.coupon.findUnique({ where: { code: couponCode } });
      if (!coupon?.isActive) throw new BadRequestException("Invalid coupon");
      if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException("Coupon expired");
      if (subtotal < coupon.minOrder) throw new BadRequestException(`Min order ${coupon.minOrder}`);
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new BadRequestException("Coupon exhausted");
      discount = coupon.type === "PERCENT" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
      discount = Math.min(discount, subtotal);
    }

    return { subtotal, delivery, discount, total: subtotal + delivery - discount, zone, couponId: coupon?.id ?? null };
  }
}
