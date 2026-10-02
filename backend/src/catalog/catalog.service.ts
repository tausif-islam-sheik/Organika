import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\u0980-\u09FF]+/g, "-").replace(/^-+|-+$/g, "");

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  // Read (public, cached at edge later)
  tree() {
    return this.prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  }
  brands() {
    return this.prisma.brand.findMany({ where: { isActive: true } });
  }
  productBySlug(slug_: string) {
    return this.prisma.product.findUnique({
      where: { slug: slug_ },
      include: { variants: true, brand: true, category: true },
    });
  }
  search(q: string) {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { nameEn: { contains: q, mode: "insensitive" } },
          { nameBn: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { variants: true },
      take: 24,
    });
  }
  byCategory(slug_: string) {
    if (slug_ === "all") {
      return this.prisma.product.findMany({
        where: { isActive: true },
        include: { variants: true },
        take: 120,
      });
    }
    return this.prisma.product.findMany({
      where: { isActive: true, category: { slug: slug_ } },
      include: { variants: true },
      take: 120,
    });
  }

  // Write (admin)
  createCategory(d: any) {
    return this.prisma.category.create({ data: { ...d, slug: d.slug ?? slug(d.name) } });
  }
  createBrand(d: any) {
    return this.prisma.brand.create({ data: { ...d, slug: d.slug ?? slug(d.name) } });
  }
  async createProduct(d: any) {
    const { variants = [], ...p } = d;
    const product = await this.prisma.product.create({
      data: { ...p, slug: p.slug ?? slug(p.nameEn) },
    });
    if (variants.length) {
      await this.prisma.productVariant.createMany({
        data: variants.map((v: any) => ({ ...v, productId: product.id })),
      });
    }
    return this.productBySlug(product.slug);
  }
  async adjustStock(variantId: string, delta: number) {
    const v = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!v) throw new NotFoundException("Variant not found");
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: Math.max(0, v.stock + delta) },
    });
  }
}
