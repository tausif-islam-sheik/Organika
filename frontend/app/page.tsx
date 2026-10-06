import Link from "next/link";
import { getCategories, getCollection, bestSellers, newArrivals, offers, DEMO_CATEGORIES, getHomepage, type Product } from "../lib/shop";
import { Hero, SectionHead, CategoryCircle, GBCard, SlideRow, Testimonials } from "../components/home";

const CAT_IMG: Record<string, string> = {
  honey: "/uploads/images/sundarban-wild-honey.jpg",
  "sundarban-honey": "/uploads/images/sidr-honey.jpg",
  "dates-gur": "/uploads/images/khejur-gur.jpg",
  oils: "/uploads/images/mustard-oil.jpg",
  spices: "/uploads/images/turmeric-powder.jpg",
  "dry-foods": "/uploads/images/almonds.jpg",
};

function resolveRail(source: string, best: Product[], fresh: Product[], organic: Product[]): Product[] {
  if (source === "best") return best;
  if (source === "new") return fresh;
  if (source.startsWith("keyword:")) {
    const kws = source.slice(8).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const hit = organic.filter((p) => kws.some((k) => p.nameEn.toLowerCase().includes(k)));
    return hit.length ? hit : organic;
  }
  return organic;
}

export default async function Home() {
  const [cats, best, fresh, off, organic, cfg] = await Promise.all([
    getCategories(),
    bestSellers(),
    newArrivals(),
    offers(),
    getCollection("organic"),
    getHomepage(),
  ]);
  void off;
  const organicImg = organic.find((p) => p.images?.[0])?.images?.[0];

  const liveSlugs = new Set(cats.map((c) => c.slug));
  const featured = [
    ...cats.map((c) => ({
      name: c.name,
      slug: c.slug,
      img: c.slug === "organic" ? organicImg : CAT_IMG[c.slug],
    })),
    ...DEMO_CATEGORIES.filter((c) => !liveSlugs.has(c.slug)).map((c) => ({
      name: c.name,
      slug: c.slug,
      img: CAT_IMG[c.slug],
    })),
    { name: "All Products", slug: "all", img: organicImg },
  ];

  const rails = (cfg?.rails ?? [
    { id: "best", title: "Top Selling Products", sub: "Most loved by our customers", source: "best", href: "/collections/all", limit: 10, enabled: true },
    { id: "fresh", title: "New Arrivals", sub: "Fresh picks this week", source: "new", href: "/collections/all", limit: 10, enabled: true },
    { id: "honey", title: "All Natural Honey", sub: "Raw & unprocessed, straight from the hive", source: "keyword:Honey", href: "/collections/organic", limit: 10, enabled: true },
    { id: "gur", title: "Premium Gur", sub: "Khejur & akher gur, winter special", source: "keyword:Gur,Jaggery", href: "/collections/organic", limit: 10, enabled: true },
    { id: "spices", title: "Spices & Masala", sub: "Stone-ground, full aroma", source: "keyword:Turmeric,Chili,Cumin,Coriander,Black Seed", href: "/collections/organic", limit: 10, enabled: true },
    { id: "grains", title: "Rice, Lentils & Grains", sub: "Daily staples, chemical-free", source: "keyword:Rice,Lentil,Chickpeas,Puffed,Flattened", href: "/collections/organic", limit: 10, enabled: true },
    { id: "nuts", title: "Nuts & Dry Fruits", sub: "Protein-packed goodness", source: "keyword:Peanut,Almond,Cashew,Raisin,Dry Fruit", href: "/collections/organic", limit: 10, enabled: true },
  ]).filter((r) => r.enabled);

  const heroSlides = (cfg?.hero ?? []).filter((h) => h.enabled);
  const banners = (cfg?.offerBanners ?? []).filter((b) => b.enabled);
  const trust = (cfg?.trustBadges ?? []).filter((t) => t.enabled);
  const featLimit = cfg?.featuredCategories?.limit ?? 8;
  const featOn = cfg?.featuredCategories?.enabled ?? true;

  // Interleave: hero → featured → rail0 → banner0 → rail1 → rail2 → banner1 → rest → trust → testimonials
  const railBlocks = rails.map((r) => ({ ...r, items: resolveRail(r.source, best, fresh, organic).slice(0, r.limit) }));

  return (
    <main>
      {heroSlides.length > 0 ? <Hero slides={heroSlides} /> : <Hero />}

      {featOn && (
        <section className="mx-auto mt-8 max-w-[1440px] px-4">
          <SectionHead title={cfg?.featuredCategories?.title ?? "Featured Categories"} sub={cfg?.featuredCategories?.sub ?? "Explore Collections"} href="/collections/all" />
          <SlideRow>
            {featured.slice(0, featLimit).map((c) => (
              <div key={c.slug} className="w-32 shrink-0 snap-start sm:w-40">
                <CategoryCircle name={c.name} slug={c.slug} img={c.img} big />
              </div>
            ))}
          </SlideRow>
        </section>
      )}

      {railBlocks.slice(0, 1).map((r) => (
        <section key={r.id} className="mx-auto mt-10 max-w-[1440px] px-4">
          <SectionHead title={r.title} sub={r.sub} href={r.href} />
          <SlideRow>
            {r.items.map((p) => (
              <div key={p.id} className="w-60 shrink-0 snap-start sm:w-72"><GBCard p={p} /></div>
            ))}
          </SlideRow>
        </section>
      ))}

      {banners[0] && (
        <section className="mx-auto mt-8 max-w-[1440px] px-4">
          <div className={`rounded-2xl bg-gradient-to-r ${banners[0].gradient} p-6 text-white sm:p-8`}>
            <div className="text-sm font-semibold">{banners[0].kicker}</div>
            <div className="text-2xl font-extrabold">{banners[0].title}</div>
            <Link href={banners[0].href} className="mt-3 inline-block rounded-full bg-white px-6 py-2 text-sm font-bold text-gray-900">{banners[0].cta}</Link>
          </div>
        </section>
      )}

      {railBlocks.slice(1, 3).map((r) => (
        <section key={r.id} className="mx-auto mt-10 max-w-[1440px] px-4">
          <SectionHead title={r.title} sub={r.sub} href={r.href} />
          <SlideRow>
            {r.items.map((p) => (
              <div key={p.id} className="w-60 shrink-0 snap-start sm:w-72"><GBCard p={p} /></div>
            ))}
          </SlideRow>
        </section>
      ))}

      {banners[1] && (
        <section className="mx-auto mt-8 max-w-[1440px] px-4">
          <div className={`rounded-2xl bg-gradient-to-r ${banners[1].gradient} p-6 text-white sm:p-8`}>
            <div className="text-sm font-semibold">{banners[1].kicker}</div>
            <div className="text-2xl font-extrabold">{banners[1].title}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {trust.map((t) => (
                <div key={t.title} className="rounded-lg bg-white/15 px-3 py-2 font-semibold">✓ {t.title}</div>
              ))}
            </div>
          </div>
        </section>
      )}

      {railBlocks.slice(3).map((r) => (
        <section key={r.id} className="mx-auto mt-10 max-w-[1440px] px-4">
          <SectionHead title={r.title} sub={r.sub} href={r.href} />
          <SlideRow>
            {r.items.map((p) => (
              <div key={p.id} className="w-60 shrink-0 snap-start sm:w-72"><GBCard p={p} /></div>
            ))}
          </SlideRow>
        </section>
      ))}

      {!banners[1] && trust.length > 0 && (
        <section className="mx-auto mt-8 max-w-[1440px] px-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {trust.map((t) => (
              <div key={t.title} className="rounded-xl border bg-white p-3 text-center">
                <div className="text-sm font-bold">{t.title}</div>
                <div className="text-xs text-gray-500">{t.sub}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Testimonials items={cfg?.testimonials?.filter((t) => t.enabled)} />
      <div className="pb-4" />
    </main>
  );
}
