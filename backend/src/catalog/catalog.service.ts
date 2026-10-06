import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\u0980-\u09FF]+/g, "-").replace(/^-+|-+$/g, "");

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService, private notes?: NotificationsService) {}

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
  updateCategory(id: string, d: any) {
    const { id: _drop, slug: rawSlug, ...rest } = d ?? {};
    const data: any = { ...rest };
    if (rawSlug) data.slug = rawSlug;
    else if (rest.name) data.slug = slug(rest.name);
    return this.prisma.category.update({ where: { id }, data });
  }
  deleteCategory(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
  reorderCategories(items: { id: string; sortOrder: number }[]) {
    return this.prisma.$transaction(
      (items ?? []).map((it) =>
        this.prisma.category.update({ where: { id: it.id }, data: { sortOrder: it.sortOrder } }),
      ),
    );
  }
  createBrand(d: any) {
    return this.prisma.brand.create({ data: { ...d, slug: d.slug ?? slug(d.name) } });
  }
  updateBrand(id: string, d: any) {
    const { id: _drop, slug: rawSlug, ...rest } = d ?? {};
    const data: any = { ...rest };
    if (rawSlug) data.slug = rawSlug;
    else if (rest.name) data.slug = slug(rest.name);
    return this.prisma.brand.update({ where: { id }, data });
  }
  deleteBrand(id: string) {
    return this.prisma.brand.delete({ where: { id } });
  }
  adminProducts(q?: string) {
    return this.prisma.product.findMany({
      where: q ? { nameEn: { contains: q, mode: "insensitive" } } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { variants: true, brand: true, category: true },
    });
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
    const v = await this.prisma.productVariant.findUnique({ where: { id: variantId }, include: { product: { select: { nameEn: true } } } });
    if (!v) throw new NotFoundException("Variant not found");
    const updated = await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: Math.max(0, v.stock + delta) },
    });
    if (updated.stock <= 5) {
      this.notes?.notifyStockLow(v.product.nameEn, updated.label, updated.stock, updated.id).catch(() => {});
    }
    return updated;
  }
  async updateProduct(id: string, d: any) {
    const { id: _drop, variants, ...rest } = d ?? {};
    const data: any = { ...rest };
    if (rest.nameEn && !rest.slug) data.slug = slug(rest.nameEn);
    return this.prisma.product.update({ where: { id }, data });
  }
  async deleteProduct(id: string) {
    await this.prisma.productVariant.deleteMany({ where: { productId: id } });
    return this.prisma.product.delete({ where: { id } });
  }
  createVariant(productId: string, d: any) {
    return this.prisma.productVariant.create({ data: { ...d, productId } });
  }
  updateVariant(id: string, d: any) {
    const { id: _drop, productId: _p, ...rest } = d ?? {};
    return this.prisma.productVariant.update({ where: { id }, data: rest });
  }
  deleteVariant(id: string) {
    return this.prisma.productVariant.delete({ where: { id } });
  }
}
