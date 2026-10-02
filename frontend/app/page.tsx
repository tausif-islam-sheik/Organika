import Link from "next/link";
import { getCategories, getCollection, bestSellers, newArrivals, offers, DEMO_CATEGORIES } from "../lib/shop";
import { Hero, SectionHead, CategoryCircle, GBCard, SlideRow, Testimonials } from "../components/home";

const CAT_IMG: Record<string, string> = {
  honey: "/uploads/images/sundarban-wild-honey.jpg",
  "sundarban-honey": "/uploads/images/sidr-honey.jpg",
  "dates-gur": "/uploads/images/khejur-gur.jpg",
  oils: "/uploads/images/mustard-oil.jpg",
  spices: "/uploads/images/turmeric-powder.jpg",
  "dry-foods": "/uploads/images/almonds.jpg",
};

export default async function Home() {
  const [cats, best, fresh, off, organic] = await Promise.all([
    getCategories(),
    bestSellers(),
    newArrivals(),
    offers(),
    getCollection("organic"),
  ]);
  const organicImg = organic.find((p) => p.images?.[0])?.images?.[0];

  const liveSlugs = new Set(cats.map((c) => c.slug));
  const has = (names: string[]) => organic.filter((p) => names.some((n) => p.nameEn.includes(n)));
  const honey = has(["Honey"]);
  const gur = has(["Gur"]);
  const spices = has(["Turmeric", "Chili", "Cumin", "Coriander", "Black Seed"]);
  const grains = has(["Rice", "Lentil", "Chickpeas", "Puffed", "Flattened"]);
  const nuts = has(["Peanut", "Almond", "Cashew", "Raisin"]);
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

  return (
    <main>
      <Hero />

      <section className="mx-auto mt-8 max-w-[1440px] px-4">
        <SectionHead title="Featured Categories" sub="Explore Collections" href="/collections/all" />
        <SlideRow>
          {featured.slice(0, 8).map((c) => (
            <div key={c.slug} className="w-32 shrink-0 snap-start sm:w-40">
              <CategoryCircle name={c.name} slug={c.slug} img={c.img} big />
            </div>
          ))}
        </SlideRow>
      </section>

      <section className="mx-auto mt-10 max-w-[1440px] px-4">
        <SectionHead title="Top Selling Products" sub="Most loved by our customers" href="/collections/all" />
        <SlideRow>
          {best.slice(0, 10).map((p) => (
            <div key={p.id} className="w-60 shrink-0 snap-start sm:w-72">
              <GBCard p={p} />
            </div>
          ))}
        </SlideRow>
      </section>

      <section className="mx-auto mt-8 max-w-[1440px] px-4">
        <div className="rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 p-6 text-white sm:p-8">
          <div className="text-sm font-semibold">Offer Zone · Limited time</div>
          <div className="text-2xl font-extrabold">Winter Gur Festival — up to 20% off</div>
          <Link href="/collections/all" className="mt-3 inline-block rounded-full bg-white px-6 py-2 text-sm font-bold text-gray-900">Grab the offer</Link>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-[1440px] px-4">
        <SectionHead title="New Arrivals" sub="Fresh picks this week" href="/collections/all" />
        <SlideRow>
          {fresh.slice(0, 10).map((p) => (
            <div key={p.id} className="w-60 shrink-0 snap-start sm:w-72">
              <GBCard p={p} />
            </div>
          ))}
        </SlideRow>
      </section>

      <section className="mx-auto mt-10 max-w-[1440px] px-4">
        <SectionHead title="All Natural Honey" sub="Raw & unprocessed, straight from the hive" href="/collections/organic" />
        <SlideRow>
          {honey.slice(0, 10).map((p) => (
            <div key={p.id} className="w-60 shrink-0 snap-start sm:w-72">
              <GBCard p={p} />
            </div>
          ))}
        </SlideRow>
      </section>

      <section className="mx-auto mt-8 max-w-[1440px] px-4">
        <div className="rounded-2xl bg-brand-700 p-6 text-white sm:p-8">
          <div className="text-sm font-semibold">Organic Certified</div>
          <div className="text-2xl font-extrabold">100% Natural · Lab Tested · Farm Direct</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {["No Chemicals", "No Preservatives", "Hygienic Packing", "Quality Checked"].map((t) => (
              <div key={t} className="rounded-lg bg-white/15 px-3 py-2 font-semibold">✓ {t}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-[1440px] px-4">
        <SectionHead title="Premium Gur" sub="Khejur & akher gur, winter special" href="/collections/organic" />
        <SlideRow>
          {gur.slice(0, 10).map((p) => (
            <div key={p.id} className="w-60 shrink-0 snap-start sm:w-72">
              <GBCard p={p} />
            </div>
          ))}
        </SlideRow>
      </section>

      <section className="mx-auto mt-10 max-w-[1440px] px-4">
        <SectionHead title="Spices & Masala" sub="Stone-ground, full aroma" href="/collections/organic" />
        <SlideRow>
          {spices.slice(0, 10).map((p) => (
            <div key={p.id} className="w-60 shrink-0 snap-start sm:w-72">
              <GBCard p={p} />
            </div>
          ))}
        </SlideRow>
      </section>

      <section className="mx-auto mt-10 max-w-[1440px] px-4">
        <SectionHead title="Rice, Lentils & Grains" sub="Daily staples, chemical-free" href="/collections/organic" />
        <SlideRow>
          {grains.slice(0, 10).map((p) => (
            <div key={p.id} className="w-60 shrink-0 snap-start sm:w-72">
              <GBCard p={p} />
            </div>
          ))}
        </SlideRow>
      </section>

      <section className="mx-auto mt-10 max-w-[1440px] px-4">
        <SectionHead title="Nuts & Dry Fruits" sub="Protein-packed goodness" href="/collections/organic" />
        <SlideRow>
          {nuts.slice(0, 10).map((p) => (
            <div key={p.id} className="w-60 shrink-0 snap-start sm:w-72">
              <GBCard p={p} />
            </div>
          ))}
        </SlideRow>
      </section>

      <section className="mx-auto mt-8 max-w-[1440px] px-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[["Assured Quality", "Lab-checked pure products"], ["Timely Delivery", "All over Bangladesh"], ["Secure Payments", "COD + bKash, Nagad"], ["Happy Return", "Easy return policy"]].map(([t, s]) => (
            <div key={t} className="rounded-xl border bg-white p-3 text-center">
              <div className="text-sm font-bold">{t}</div>
              <div className="text-xs text-gray-500">{s}</div>
            </div>
          ))}
        </div>
      </section>

      <Testimonials />
      <div className="pb-4" />
    </main>
  );
}
