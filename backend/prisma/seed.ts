import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as argon2 from "argon2";
import { makeImage, makeGalleryViews, themeFor } from "../scripts/make-images";

// Seed: zones + geo (Dhaka-focused) + demo honey catalog. Idempotent via upserts.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const [i, z] of [
    { name: "Inside Dhaka", charge: 6000, freeOver: 200000 },
    { name: "Dhaka Suburbs", charge: 10000, freeOver: 300000 },
    { name: "Outside Dhaka", charge: 13000, freeOver: null },
  ].entries()) {
    await prisma.deliveryZone.upsert({
      where: { name: z.name },
      update: {},
      create: { ...z, sortOrder: i },
    });
  }

  const dhaka = await prisma.division.upsert({ where: { name: "Dhaka" }, update: {}, create: { name: "Dhaka" } });
  const ctg = await prisma.division.upsert({ where: { name: "Chattogram" }, update: {}, create: { name: "Chattogram" } });
  const dDist = await prisma.district.upsert({
    where: { divisionId_name: { divisionId: dhaka.id, name: "Dhaka" } },
    update: {},
    create: { divisionId: dhaka.id, name: "Dhaka" },
  });
  for (const u of ["Dhanmondi", "Mirpur", "Uttara"]) {
    await prisma.upazila.upsert({
      where: { districtId_name: { districtId: dDist.id, name: u } },
      update: {},
      create: { districtId: dDist.id, name: u },
    });
  }
  const cDist = await prisma.district.upsert({
    where: { divisionId_name: { divisionId: ctg.id, name: "Chattogram" } },
    update: {},
    create: { divisionId: ctg.id, name: "Chattogram" },
  });
  await prisma.upazila.upsert({
    where: { districtId_name: { districtId: cDist.id, name: "GEC Circle" } },
    update: {},
    create: { districtId: cDist.id, name: "GEC Circle" },
  });

  // ---- 100-product Organic catalog (idempotent) ----
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany({ where: { slug: { not: "organic" } } });

  const organic = await prisma.category.upsert({
    where: { slug: "organic" },
    update: { name: "Organic", nameBn: "অর্গানিক" },
    create: { name: "Organic", nameBn: "অর্গানিক", slug: "organic", sortOrder: 1 },
  });
  const brand = await prisma.brand.upsert({
    where: { slug: "organika" },
    update: {},
    create: { name: "Organika", slug: "organika" },
  });

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9\u0980-\u09FF]+/g, "-").replace(/^-+|-+$/g, "");

  // base price = paisa for 500g pack
  const BASES: { en: string; bn: string; price: number }[] = [
    { en: "Sundarban Wild Honey", bn: "সুন্দরবনের খাঁটি মধু", price: 55000 },
    { en: "Sidr Honey", bn: "সিদর মধু", price: 95000 },
    { en: "Black Seed Honey", bn: "কালোজিরা মধু", price: 62000 },
    { en: "Mustard Flower Honey", bn: "সরিষা ফুলের মধু", price: 48000 },
    { en: "Khejur Gur", bn: "খেজুরের গুড়", price: 32000 },
    { en: "Akher Gur", bn: "আখের গুড়", price: 28000 },
    { en: "Mustard Oil", bn: "সরিষার তেল", price: 28000 },
    { en: "Pure Cow Ghee", bn: "খাঁটি গাওয়া ঘি", price: 68000 },
    { en: "Turmeric Powder", bn: "হলুদ গুঁড়া", price: 18000 },
    { en: "Chili Powder", bn: "মরিচ গুঁড়া", price: 22000 },
    { en: "Cumin Powder", bn: "জিরা গুঁড়া", price: 26000 },
    { en: "Coriander Powder", bn: "ধনিয়া গুঁড়া", price: 16000 },
    { en: "Chinigura Rice", bn: "চিনিগুঁড়া চাল", price: 14000 },
    { en: "Kalijira Rice", bn: "কালিজিরা চাল", price: 15000 },
    { en: "Masoor Lentil", bn: "মসুর ডাল", price: 13000 },
    { en: "Moong Lentil", bn: "মুগ ডাল", price: 14500 },
    { en: "Chickpeas", bn: "ছোলা", price: 11000 },
    { en: "Peanuts", bn: "চিনাবাদাম", price: 12000 },
    { en: "Almonds", bn: "কাঠবাদাম", price: 85000 },
    { en: "Cashews", bn: "কাজুবাদাম", price: 95000 },
    { en: "Raisins", bn: "কিশমিশ", price: 45000 },
    { en: "Black Seeds", bn: "কালোজিরা", price: 30000 },
    { en: "Green Tea", bn: "গ্রিন টি", price: 25000 },
    { en: "Puffed Rice", bn: "মুড়ি", price: 8000 },
    { en: "Flattened Rice", bn: "চিরা", price: 9000 },
  ];
  const SIZES = [
    { label: "250g", mult: 0.5, w: 250 },
    { label: "500g", mult: 1, w: 500 },
    { label: "1kg", mult: 1.9, w: 1000 },
    { label: "2kg", mult: 3.6, w: 2000 },
  ];
  const BADGES: string[][] = [["Best Selling"], ["New Arrival"], ["Offer"], ["Premium"], []];

  let n = 0;
  for (const [bi, b] of BASES.entries()) {
    for (const [si, s] of SIZES.entries()) {
      n++;
      const baseSlug = slugify(b.en);
      const slug = `${baseSlug}-${s.label}`;
      const img = `/uploads/images/${baseSlug}.jpg`;
      await makeImage(baseSlug, b.en, themeFor(b.en));
      await makeGalleryViews(baseSlug);
      const gallery = [img, `/uploads/images/${baseSlug}-2.jpg`, `/uploads/images/${baseSlug}-3.jpg`];
      const price = Math.round((b.price * s.mult) / 100) * 100;
      const badges = BADGES[(bi + si) % BADGES.length];
      const sku = `ORG-${String(n).padStart(4, "0")}`;
      const prod = await prisma.product.upsert({
        where: { slug },
        update: { nameEn: `${b.en} ${s.label}`, badges, images: gallery },
        create: {
          slug,
          nameEn: `${b.en} ${s.label}`,
          nameBn: `${b.bn} ${s.label}`,
          brandId: brand.id,
          categoryId: organic.id,
          description: `Pure organic ${b.en.toLowerCase()} from trusted Bangladeshi farms.`,
          images: gallery,
          badges,
        },
      });
      await prisma.productVariant.upsert({
        where: { sku },
        update: { price },
        create: {
          productId: prod.id,
          sku,
          label: s.label,
          price,
          comparePrice: Math.round(price * 1.15),
          stock: 20 + ((bi * 7 + si * 13) % 80),
          weightGrams: s.w,
        },
      });
    }
  }
  console.log(`seeded ${n} organic products`);

  // Staff admin (email + password login)
  const adminHash = await argon2.hash("organika321");
  const existing = await prisma.user.findFirst({ where: { OR: [{ email: "admin@organika.com" }, { email: "admin@organika.local" }, { phone: "01700000000" }] } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { email: "admin@organika.com", passwordHash: adminHash, role: "ADMIN", name: "Admin" },
    });
  } else {
    await prisma.user.create({
      data: {
        phone: "01700000000",
        name: "Admin",
        email: "admin@organika.com",
        passwordHash: adminHash,
        role: "ADMIN",
      },
    });
  }

  console.log("seed ok: zones, geo, organic catalog, admin");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
