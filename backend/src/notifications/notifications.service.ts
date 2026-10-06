import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  create(data: { type?: string; title: string; body?: string; link?: string }) {
    return this.prisma.notification.create({
      data: {
        type: data.type ?? "INFO",
        title: data.title,
        body: data.body,
        link: data.link,
      },
    });
  }

  list(opts: { unreadOnly?: boolean; take?: number } = {}) {
    const take = Math.min(Math.max(opts.take ?? 50, 1), 200);
    return this.prisma.notification.findMany({
      where: opts.unreadOnly ? { readAt: null } : {},
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  async unreadCount() {
    const count = await this.prisma.notification.count({ where: { readAt: null } });
    return { count };
  }

  markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  markAllRead() {
    return this.prisma.notification.updateMany({
      where: { readAt: null },
      data: { readAt: new Date() },
    });
  }

  notifyOrderNew(order: { orderNo: string; total: number; id: string }) {
    return this.create({
      type: "ORDER_NEW",
      title: `New order ${order.orderNo}`,
      body: `৳${(order.total / 100).toLocaleString("en-BD")} · tap to review`,
      link: `/admin/orders?q=${order.orderNo}`,
    }).catch(() => null);
  }

  notifyStatusChange(orderNo: string, to: string) {
    return this.create({
      type: "ORDER_STATUS",
      title: `Order ${orderNo} → ${to}`,
      body: `Status changed to ${to}`,
      link: `/admin/orders?q=${orderNo}`,
    }).catch(() => null);
  }

  notifyStockLow(productName: string, label: string, stock: number, variantId: string) {
    return this.create({
      type: "STOCK_LOW",
      title: `Low stock: ${productName} (${label})`,
      body: `Only ${stock} left`,
      link: `/admin/products?q=${encodeURIComponent(productName)}`,
    }).catch(() => null);
  }

  notifyPayment(orderNo: string, status: string) {
    return this.create({
      type: "PAYMENT",
      title: `Payment ${status}: ${orderNo}`,
      body: `Payment status is ${status}`,
      link: `/admin/orders?q=${orderNo}`,
    }).catch(() => null);
  }

  notifyReview(productName: string, rating: number) {
    return this.create({
      type: "REVIEW",
      title: `New ${rating}★ review: ${productName}`,
      body: `Needs moderation`,
      link: `/admin/reviews`,
    }).catch(() => null);
  }
}
