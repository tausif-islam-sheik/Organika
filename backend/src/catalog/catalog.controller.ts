import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { Public, Roles } from "../auth/decorators";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller()
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  @Public() @Get("categories") tree() { return this.catalog.tree(); }
  @Public() @Get("brands") brands() { return this.catalog.brands(); }
  @Public() @Get("products/:slug") one(@Param("slug") s: string) { return this.catalog.productBySlug(s); }
  @Public() @Get("search") search(@Query("q") q: string) { return this.catalog.search(q ?? ""); }
  @Public() @Get("collections/:slug") byCat(@Param("slug") s: string) { return this.catalog.byCategory(s); }

  @Roles("ADMIN", "MANAGER") @Post("admin/categories") mkCat(@Body() b: any) { return this.catalog.createCategory(b); }
  @Roles("ADMIN", "MANAGER") @Post("admin/brands") mkBrand(@Body() b: any) { return this.catalog.createBrand(b); }
  @Roles("ADMIN", "MANAGER") @Post("admin/products") mkProd(@Body() b: any) { return this.catalog.createProduct(b); }
  @Roles("ADMIN", "MANAGER", "PACKER") @Patch("admin/variants/:id/stock") stock(@Param("id") id: string, @Body() b: { delta: number }) { return this.catalog.adjustStock(id, b.delta); }
}
