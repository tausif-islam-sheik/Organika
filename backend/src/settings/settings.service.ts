import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export const DEFAULT_HOMEPAGE = {
  announcement: "Cash on Delivery available all over Bangladesh",
  hero: [
    { title: "100% Pure Sundarban Honey", subtitle: "Raw, unprocessed, lab-tested. Free delivery over ৳2,000.", cta: "Shop Now", href: "/collections/all", gradient: "from-brand-700 to-brand-500", enabled: true },
    { title: "Khejur Gur Season is Here", subtitle: "Fresh date jaggery from Jessore. Limited stock.", cta: "Shop Now", href: "/collections/all", gradient: "from-amber-600 to-yellow-500", enabled: true },
    { title: "Cold-Pressed Oils", subtitle: "Ghani-bhanga mustard oil, traditional taste.", cta: "Shop Now", href: "/collections/all", gradient: "from-emerald-700 to-green-500", enabled: true },
  ],
  featuredCategories: { title: "Featured Categories", sub: "Explore Collections", limit: 8, enabled: true },
  rails: [
    { id: "best", title: "Top Selling Products", sub: "Most loved by our customers", source: "best", href: "/collections/all", limit: 10, enabled: true },
    { id: "fresh", title: "New Arrivals", sub: "Fresh picks this week", source: "new", href: "/collections/all", limit: 10, enabled: true },
    { id: "honey", title: "All Natural Honey", sub: "Raw & unprocessed, straight from the hive", source: "keyword:Honey", href: "/collections/organic", limit: 10, enabled: true },
    { id: "gur", title: "Premium Gur", sub: "Khejur & akher gur, winter special", source: "keyword:Gur,Jaggery", href: "/collections/organic", limit: 10, enabled: true },
    { id: "spices", title: "Spices & Masala", sub: "Stone-ground, full aroma", source: "keyword:Turmeric,Chili,Cumin,Coriander,Black Seed", href: "/collections/organic", limit: 10, enabled: true },
    { id: "grains", title: "Rice, Lentils & Grains", sub: "Daily staples, chemical-free", source: "keyword:Rice,Lentil,Chickpeas,Puffed,Flattened", href: "/collections/organic", limit: 10, enabled: true },
    { id: "nuts", title: "Nuts & Dry Fruits", sub: "Protein-packed goodness", source: "keyword:Peanut,Almond,Cashew,Raisin,Dry Fruit", href: "/collections/organic", limit: 10, enabled: true },
  ],
  offerBanners: [
    { kicker: "Offer Zone · Limited time", title: "Winter Gur Festival — up to 20% off", cta: "Grab the offer", href: "/collections/all", gradient: "from-brand-700 to-brand-500", enabled: true },
    { kicker: "Organic Certified", title: "100% Natural · Lab Tested · Farm Direct", cta: "Shop organic", href: "/collections/organic", gradient: "from-emerald-700 to-green-500", enabled: true },
  ],
  trustBadges: [
    { title: "Assured Quality", sub: "Lab-checked pure products", enabled: true },
    { title: "Timely Delivery", sub: "All over Bangladesh", enabled: true },
    { title: "Secure Payments", sub: "COD + bKash, Nagad", enabled: true },
    { title: "Happy Return", sub: "Easy return policy", enabled: true },
  ],
  testimonials: [
    { name: "Rahima K.", role: "Housewife", area: "Dhanmondi, Dhaka", text: "মধুটা একদম খাঁটি। বাচ্চারা প্রতিদিন খায়। ডেলিভারিও দ্রুত ছিল।", enabled: true },
    { name: "Tanvir H.", role: "Service Holder", area: "Uttara, Dhaka", text: "Gur quality is excellent, tastes like childhood. COD made it easy.", enabled: true },
    { name: "Nasrin S.", role: "Housewife", area: "Chattogram", text: "Mustard oil is genuinely cold-pressed. Became a regular customer.", enabled: true },
  ],
};

export const DEFAULT_STORE = {
  hotline: "09611-XXXXXX",
  whatsapp: "8801XXXXXXXXX",
  codText: "Cash on Delivery available all over Bangladesh",
  freeShipDhakaOver: 200000,
  insideDhakaCharge: 6000,
  outsideDhakaCharge: 13000,
};

const DEFAULTS: Record<string, any> = { homepage: DEFAULT_HOMEPAGE, store: DEFAULT_STORE };

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get(key: string) {
    const row = await this.prisma.siteSetting.findUnique({ where: { key } });
    if (row?.value !== undefined && row?.value !== null) return row.value;
    return DEFAULTS[key] ?? null;
  }

  async set(key: string, value: any) {
    return this.prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async all() {
    const rows = await this.prisma.siteSetting.findMany();
    const out: Record<string, any> = { ...DEFAULTS };
    for (const r of rows) out[r.key] = r.value;
    return out;
  }
}
