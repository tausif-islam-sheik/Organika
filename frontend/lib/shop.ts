// Data layer: tries backend API, falls back to demo catalog (works offline).
export type Variant = {
  id: string;
  sku: string;
  label: string;
  price: number; // paisa
  comparePrice?: number | null;
  stock: number;
};
export type Product = {
  id: string;
  slug: string;
  nameEn: string;
  nameBn?: string | null;
  images?: string[];
  description?: string | null;
  badges: string[];
  categorySlug?: string | null;
  variants: Variant[];
};
export type Category = { id: string; name: string; nameBn?: string | null; slug: string };

const API = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function api<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${API}${path}`, { next: { revalidate: 60 } });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export const formatBDT = (paisa: number) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", minimumFractionDigits: 0 })
    .format(paisa / 100)
    .replace("BDT", "৳")
    .trim();

// ---- demo fallback (mirrors seed data, richer for UI) ----
const demoVariants = (p: string, base: number): Variant[] => [
  { id: `${p}-500`, sku: `${p}-500`, label: "500g", price: base, comparePrice: Math.round(base * 1.18), stock: 100 },
  { id: `${p}-1k`, sku: `${p}-1k`, label: "1kg", price: base * 2 - 5000, comparePrice: base * 2, stock: 50 },
];

export const DEMO_CATEGORIES: Category[] = [
  { id: "c1", name: "Honey", nameBn: "মধু", slug: "honey" },
  { id: "c2", name: "Sundarban Honey", nameBn: "সুন্দরবনের মধু", slug: "sundarban-honey" },
  { id: "c3", name: "Dates & Gur", nameBn: "খেজুর ও গুড়", slug: "dates-gur" },
  { id: "c4", name: "Oils", nameBn: "তেল", slug: "oils" },
  { id: "c5", name: "Spices", nameBn: "মসলা", slug: "spices" },
  { id: "c6", name: "Dry Foods", nameBn: "শুকনো খাবার", slug: "dry-foods" },
];

export const DEMO_PRODUCTS: Product[] = [
  { id: "p1", slug: "sundarban-wild-honey-500g", nameEn: "Sundarban Wild Honey", nameBn: "সুন্দরবনের খাঁটি মধু", badges: ["Best Selling"], categorySlug: "honey", variants: demoVariants("HNY-SUN", 55000) },
  { id: "p2", slug: "sidr-honey-500g", nameEn: "Sidr Honey", nameBn: "সিদর মধু", badges: ["Premium"], categorySlug: "honey", variants: demoVariants("HNY-SID", 95000) },
  { id: "p3", slug: "khejur-gur-1kg", nameEn: "Khejur Gur (Date Jaggery)", nameBn: "খেজুরের গুড়", badges: ["New Arrival"], categorySlug: "dates-gur", variants: demoVariants("GUR-KHE", 32000) },
  { id: "p4", slug: "mustard-oil-1l", nameEn: "Cold-Pressed Mustard Oil", nameBn: "ঘানি ভাঙা সরিষার তেল", badges: ["Best Selling"], categorySlug: "oils", variants: demoVariants("OIL-MUS", 28000) },
  { id: "p5", slug: "turmeric-powder-500g", nameEn: "Wild Turmeric Powder", nameBn: "কাঁচা হলুদ গুঁড়া", badges: ["Offer"], categorySlug: "spices", variants: demoVariants("SPC-TUR", 18000) },
  { id: "p6", slug: "mixed-dry-fruits-500g", nameEn: "Mixed Dry Fruits", nameBn: "মিক্সড ড্রাই ফ্রুটস", badges: ["New Arrival"], categorySlug: "dry-foods", variants: demoVariants("DRY-MIX", 45000) },
  { id: "p7", slug: "black-seed-honey-500g", nameEn: "Black Seed Honey", nameBn: "কালোজিরা মধু", badges: ["Offer"], categorySlug: "honey", variants: demoVariants("HNY-BLK", 62000) },
  { id: "p8", slug: "ghee-500g", nameEn: "Pure Cow Ghee", nameBn: "খাঁটি গাওয়া ঘি", badges: ["Best Selling"], categorySlug: "oils", variants: demoVariants("GHE-COW", 68000) },
  { id: "p9", slug: "chili-powder-500g", nameEn: "Chili Powder", nameBn: "মরিচ গুঁড়া", badges: ["Best Selling"], categorySlug: "spices", variants: demoVariants("SPC-CHI", 22000) },
  { id: "p10", slug: "cumin-powder-500g", nameEn: "Cumin Powder", nameBn: "জিরা গুঁড়া", badges: ["New Arrival"], categorySlug: "spices", variants: demoVariants("SPC-CUM", 26000) },
  { id: "p11", slug: "chinigura-rice-1kg", nameEn: "Chinigura Rice", nameBn: "চিনিগুঁড়া চাল", badges: ["Best Selling"], categorySlug: "dry-foods", variants: demoVariants("RIC-CHI", 14000) },
  { id: "p12", slug: "masoor-lentil-1kg", nameEn: "Masoor Lentil", nameBn: "মসুর ডাল", badges: ["Offer"], categorySlug: "dry-foods", variants: demoVariants("LEN-MAS", 13000) },
  { id: "p13", slug: "almonds-500g", nameEn: "Almonds", nameBn: "কাঠবাদাম", badges: ["Premium"], categorySlug: "dry-foods", variants: demoVariants("DRY-ALM", 85000) },
  { id: "p14", slug: "raisins-500g", nameEn: "Raisins", nameBn: "কিশমিশ", badges: ["New Arrival"], categorySlug: "dry-foods", variants: demoVariants("DRY-RAI", 45000) },
];

export async function getCategories(): Promise<Category[]> {
  const live = await api<Category[]>("/categories");
  return live?.length ? live : DEMO_CATEGORIES;
}

// Live products all sit under the "organic" category — derive the shopper-facing
// category from the product name (same vocabulary as the homepage rails) so
// collection pages and multi-category filtering work on live data too.
const CATEGORY_KEYWORDS: [string, string[]][] = [
  ["sundarban-honey", ["sundarban"]],
  ["honey", ["honey"]],
  ["dates-gur", ["gur", "jaggery"]],
  ["oils", ["oil", "ghee"]],
  ["spices", ["turmeric", "chili", "cumin", "coriander", "spice", "masala", "black seed"]],
  ["dry-foods", ["rice", "lentil", "chickpea", "peanut", "almond", "cashew", "raisin", "dry fruit", "puffed", "flattened", "nut"]],
];

export function deriveCategory(nameEn: string): string | null {
  const n = nameEn.toLowerCase();
  for (const [slug, kws] of CATEGORY_KEYWORDS) {
    if (kws.some((k) => n.includes(k))) return slug;
  }
  return null;
}

const withCategory = (p: Product): Product =>
  p.categorySlug ? p : { ...p, categorySlug: deriveCategory(p.nameEn) ?? "organic" };

export async function getCollection(slug: string): Promise<Product[]> {
  const live = await api<Product[]>(`/collections/${slug}`);
  if (live?.length) return live.map(withCategory);
  // "organic" is the backend seed catalog (= everything); "all" is everything.
  if (slug === "all" || slug === "organic") return DEMO_PRODUCTS;
  const filtered = DEMO_PRODUCTS.filter((p) => p.categorySlug === slug);
  return filtered.length ? filtered : DEMO_PRODUCTS;
}
export async function getProduct(slug: string): Promise<Product | null> {
  const live = await api<Product>(`/products/${slug}`);
  if (live) return live;
  return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
}
export async function searchProducts(q: string): Promise<Product[]> {
  if (!q) return [];
  const live = await api<Product[]>(`/search?q=${encodeURIComponent(q)}`);
  if (live) return live;
  const s = q.toLowerCase();
  return DEMO_PRODUCTS.filter((p) => p.nameEn.toLowerCase().includes(s));
}
async function organicAll(): Promise<Product[]> {
  const live = await api<Product[]>("/collections/organic");
  return live?.length ? live : DEMO_PRODUCTS;
}
const byBadge = (all: Product[], b: string) => {
  const f = all.filter((p) => p.badges?.includes(b));
  return f.length ? f : DEMO_PRODUCTS.filter((p) => p.badges.includes(b));
};
export const bestSellers = async () => byBadge(await organicAll(), "Best Selling");
export const newArrivals = async () => byBadge(await organicAll(), "New Arrival");
export const offers = async () => byBadge(await organicAll(), "Offer");
