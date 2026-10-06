import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.coupon.findMany({ orderBy: { code: "asc" }, take: 200 });
  }

  create(d: any) {
    if (!d.code) throw new BadRequestException("Code required");
    return this.prisma.coupon.create({
      data: {
        code: String(d.code).toUpperCase().trim(),
        type: d.type ?? "FLAT",
        value: Number(d.value ?? 0),
        minOrder: Number(d.minOrder ?? 0),
        usageLimit: d.usageLimit ? Number(d.usageLimit) : null,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
        isActive: d.isActive ?? true,
      },
    });
  }

  update(id: string, d: any) {
    const { id: _drop, code, ...rest } = d ?? {};
    const data: any = { ...rest };
    if (code) data.code = String(code).toUpperCase().trim();
    if (data.value !== undefined) data.value = Number(data.value);
    if (data.minOrder !== undefined) data.minOrder = Number(data.minOrder);
    if (data.usageLimit !== undefined) data.usageLimit = data.usageLimit ? Number(data.usageLimit) : null;
    if (data.expiresAt !== undefined) data.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    return this.prisma.coupon.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.coupon.delete({ where: { id } });
  }
}
