import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ReviewsService } from "./reviews.service";
import { Public, Roles } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller()
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  @Public()
  @Get("products/:productId/reviews")
  visible(@Param("productId") productId: string) {
    return this.reviews.visibleByProduct(productId);
  }

  @Public()
  @Post("reviews")
  submit(@Body() b: { productId: string; name: string; rating?: number; title?: string; body: string; photos?: string[] }) {
    return this.reviews.submit(b);
  }

  @Roles("ADMIN", "MANAGER", "PACKER")
  @Get("admin/reviews")
  all(@Query("visible") visible?: string) {
    return this.reviews.all(visible);
  }

  @Roles("ADMIN", "MANAGER")
  @Patch("admin/reviews/:id")
  setVisible(@Param("id") id: string, @Body() b: { isVisible: boolean }) {
    return this.reviews.setVisible(id, !!b.isVisible);
  }

  @Roles("ADMIN", "MANAGER")
  @Delete("admin/reviews/:id")
  remove(@Param("id") id: string) {
    return this.reviews.remove(id);
  }
}
