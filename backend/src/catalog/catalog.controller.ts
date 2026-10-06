import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
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

  @Roles("ADMIN", "MANAGER", "PACKER") @Get("admin/products") adminList(@Query("q") q?: string) { return this.catalog.adminProducts(q); }
  @Roles("ADMIN", "MANAGER") @Post("admin/categories") mkCat(@Body() b: any) { return this.catalog.createCategory(b); }
  @Roles("ADMIN", "MANAGER") @Patch("admin/categories/:id") upCat(@Param("id") id: string, @Body() b: any) { return this.catalog.updateCategory(id, b); }
  @Roles("ADMIN", "MANAGER") @Delete("admin/categories/:id") delCat(@Param("id") id: string) { return this.catalog.deleteCategory(id); }
  @Roles("ADMIN", "MANAGER") @Post("admin/categories/reorder") reorder(@Body() b: { items: { id: string; sortOrder: number }[] }) { return this.catalog.reorderCategories(b.items); }
  @Roles("ADMIN", "MANAGER") @Post("admin/brands") mkBrand(@Body() b: any) { return this.catalog.createBrand(b); }
  @Roles("ADMIN", "MANAGER") @Patch("admin/brands/:id") upBrand(@Param("id") id: string, @Body() b: any) { return this.catalog.updateBrand(id, b); }
  @Roles("ADMIN", "MANAGER") @Delete("admin/brands/:id") delBrand(@Param("id") id: string) { return this.catalog.deleteBrand(id); }
  @Roles("ADMIN", "MANAGER") @Post("admin/products") mkProd(@Body() b: any) { return this.catalog.createProduct(b); }
  @Roles("ADMIN", "MANAGER") @Patch("admin/products/:id") upProd(@Param("id") id: string, @Body() b: any) { return this.catalog.updateProduct(id, b); }
  @Roles("ADMIN", "MANAGER") @Delete("admin/products/:id") delProd(@Param("id") id: string) { return this.catalog.deleteProduct(id); }
  @Roles("ADMIN", "MANAGER") @Post("admin/products/:id/variants") mkVar(@Param("id") id: string, @Body() b: any) { return this.catalog.createVariant(id, b); }
  @Roles("ADMIN", "MANAGER") @Patch("admin/variants/:id") upVar(@Param("id") id: string, @Body() b: any) { return this.catalog.updateVariant(id, b); }
  @Roles("ADMIN", "MANAGER") @Delete("admin/variants/:id") delVar(@Param("id") id: string) { return this.catalog.deleteVariant(id); }
  @Roles("ADMIN", "MANAGER", "PACKER") @Patch("admin/variants/:id/stock") stock(@Param("id") id: string, @Body() b: { delta: number }) { return this.catalog.adjustStock(id, b.delta); }
}
