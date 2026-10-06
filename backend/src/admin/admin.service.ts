import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async stats() {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [today, month, pending, lowStock, top, byStatus, customers, recent] = await Promise.all([
      this.prisma.order.aggregate({ _sum: { total: true }, _count: true, where: { createdAt: { gte: dayStart } } }),
      this.prisma.order.aggregate({ _sum: { total: true }, _count: true, where: { createdAt: { gte: monthStart } } }),
      this.prisma.order.count({ where: { status: "PENDING" } }),
      this.prisma.productVariant.findMany({ where: { stock: { lte: 5 } }, take: 10, include: { product: { select: { nameEn: true } } } }),
      this.prisma.orderItem.groupBy({ by: ["variantId", "nameSnapshot"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
      this.prisma.order.groupBy({ by: ["status"], _count: true }),
      this.prisma.user.count({ where: { role: "CUSTOMER" } }),
      this.prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { items: true } }),
    ]);
    const monthRevenue = month._sum.total ?? 0;
    const monthCount = month._count ?? 0;
    return {
      today,
      month,
      pendingOrders: pending,
      lowStock,
      topProducts: top,
      byStatus,
      totalCustomers: customers,
      avgOrderValue: monthCount ? Math.round(monthRevenue / monthCount) : 0,
      recentOrders: recent,
    };
  }

  // Daily order-count series for charts — zero-filled
  async ordersSeries(days = 14) {
    const d = Math.min(Math.max(days || 14, 1), 90);
    const rows = await this.prisma.$queryRaw<{ date: string; count: number }[]>(
      Prisma.sql`SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS count
        FROM "Order" WHERE "createdAt" >= NOW() - (${d} || ' days')::interval
        GROUP BY 1 ORDER BY 1`,
    );
    const map = new Map(rows.map((r) => [r.date, r]));
    const out = [];
    for (let i = d - 1; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().slice(0, 10);
      const r = map.get(key);
      out.push({ date: key, count: r?.count ?? 0 });
    }
    return out;
  }

  // Daily revenue series for charts — zero-filled
  async salesSeries(days = 14) {
    const d = Math.min(Math.max(days || 14, 1), 90);
    const rows = await this.prisma.$queryRaw<{ date: string; total: number; count: number }[]>(
      Prisma.sql`SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS date,
        COALESCE(SUM(total), 0)::int AS total, COUNT(*)::int AS count
        FROM "Order" WHERE "createdAt" >= NOW() - (${d} || ' days')::interval
        GROUP BY 1 ORDER BY 1`,
    );
    const map = new Map(rows.map((r) => [r.date, r]));
    const out = [];
    for (let i = d - 1; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().slice(0, 10);
      const r = map.get(key);
      out.push({ date: key, total: r?.total ?? 0, count: r?.count ?? 0 });
    }
    return out;
  }
}
