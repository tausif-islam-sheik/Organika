import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  list(q?: string) {
    return this.prisma.user.findMany({
      where: q
        ? { OR: [{ phone: { contains: q } }, { name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
        : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, phone: true, name: true, email: true, role: true, createdAt: true, _count: { select: { orders: true } } },
    });
  }

  async detail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, phone: true, name: true, email: true, role: true, createdAt: true, addresses: true },
    });
    if (!user) throw new NotFoundException("Customer not found");
    const orders = await this.prisma.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { items: true },
    });
    const spent = orders.reduce((s, o) => s + o.total, 0);
    return { ...user, orders, orderCount: orders.length, totalSpent: spent };
  }

  setRole(id: string, role: string) {
    if (!["CUSTOMER", "ADMIN", "MANAGER", "PACKER"].includes(role)) throw new NotFoundException("Bad role");
    return this.prisma.user.update({ where: { id }, data: { role: role as any } });
  }
}
