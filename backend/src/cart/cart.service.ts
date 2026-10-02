import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async resolve(userId?: string, guestToken?: string) {
    if (userId) {
      let cart = await this.prisma.cart.findFirst({ where: { userId }, include: { items: true } });
      if (!cart) cart = await this.prisma.cart.create({ data: { userId }, include: { items: true } });
      return cart;
    }
    if (!guestToken) throw new BadRequestException("guestToken required");
    let cart = await this.prisma.cart.findFirst({ where: { guestToken }, include: { items: true } });
    if (!cart)
      cart = await this.prisma.cart.create({
        data: { guestToken, expiresAt: new Date(Date.now() + 30 * 86400e3) },
        include: { items: true },
      });
    return cart;
  }

  get(userId?: string, guestToken?: string) {
    return this.resolve(userId, guestToken);
  }

  async addItem(userId: string | undefined, guestToken: string | undefined, variantId: string, quantity: number) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw new NotFoundException("Variant not found");
    if (quantity < 1 || quantity > 99) throw new BadRequestException("Bad quantity");
    const cart = await this.resolve(userId, guestToken);
    const ex = cart.items.find((i) => i.variantId === variantId);
    if (ex) {
      await this.prisma.cartItem.update({ where: { id: ex.id }, data: { quantity: Math.min(99, ex.quantity + quantity) } });
    } else {
      await this.prisma.cartItem.create({ data: { cartId: cart.id, variantId, quantity } });
    }
    return this.resolve(userId, guestToken);
  }

  async setQty(userId: string | undefined, guestToken: string | undefined, variantId: string, quantity: number) {
    const cart = await this.resolve(userId, guestToken);
    const ex = cart.items.find((i) => i.variantId === variantId);
    if (!ex) throw new NotFoundException("Item not in cart");
    if (quantity <= 0) await this.prisma.cartItem.delete({ where: { id: ex.id } });
    else await this.prisma.cartItem.update({ where: { id: ex.id }, data: { quantity: Math.min(99, quantity) } });
    return this.resolve(userId, guestToken);
  }

  async merge(userId: string, guestToken: string) {
    const guest = await this.prisma.cart.findFirst({ where: { guestToken }, include: { items: true } });
    if (!guest) return this.resolve(userId);
    const mine = await this.resolve(userId);
    for (const item of guest.items) {
      const ex = mine.items.find((i) => i.variantId === item.variantId);
      if (ex) {
        await this.prisma.cartItem.update({ where: { id: ex.id }, data: { quantity: Math.min(99, ex.quantity + item.quantity) } });
      } else {
        await this.prisma.cartItem.create({ data: { cartId: mine.id, variantId: item.variantId, quantity: item.quantity } });
      }
    }
    await this.prisma.cart.delete({ where: { id: guest.id } });
    return this.resolve(userId);
  }
}
