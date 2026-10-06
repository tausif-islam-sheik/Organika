import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService, private notes?: NotificationsService) {}

  visibleByProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId, isVisible: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async submit(d: { productId: string; name: string; rating?: number; title?: string; body: string; photos?: string[] }) {
    const review = await this.prisma.review.create({
      data: {
        productId: d.productId,
        name: d.name,
        rating: Math.min(Math.max(Number(d.rating ?? 5), 1), 5),
        title: d.title,
        body: d.body,
        photos: d.photos ?? [],
      },
    });
    const product = await this.prisma.product.findUnique({ where: { id: d.productId }, select: { nameEn: true } });
    this.notes?.notifyReview(product?.nameEn ?? "Product", review.rating).catch(() => {});
    return review;
  }

  all(visible?: string) {
    return this.prisma.review.findMany({
      where: visible === undefined || visible === "" ? {} : { isVisible: visible === "1" || visible === "true" },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { product: { select: { nameEn: true, slug: true } } },
    });
  }

  setVisible(id: string, isVisible: boolean) {
    return this.prisma.review.update({ where: { id }, data: { isVisible } });
  }

  remove(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }
}
