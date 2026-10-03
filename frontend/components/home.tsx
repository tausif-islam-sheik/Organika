"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Sparkles, Crown, Tag, Zap, type LucideIcon } from "lucide-react";
import { formatBDT, type Product } from "../lib/shop";
import { useCart } from "./cart";

const GRAD = [
  "from-amber-200 to-yellow-400",
  "from-green-200 to-emerald-400",
  "from-orange-200 to-amber-400",
  "from-lime-200 to-green-400",
];

const IMG_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export const imgUrl = (p?: string | null) => (!p ? null : p.startsWith("http") ? p : `${IMG_BASE}${p}`);

export function Thumb({ name, i = 0, big = false, tall = false, src }: { name: string; i?: number; big?: boolean; tall?: boolean; src?: string | null }) {
  const url = imgUrl(src);
  const h = big ? "h-72" : tall ? "h-52 sm:h-60" : "h-40";
  if (url) return <img src={url} alt={name} loading="lazy" className={`w-full object-cover ${h}`} />;
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br ${GRAD[i % GRAD.length]} ${h} ${big ? "text-7xl" : "text-5xl"} font-extrabold text-white/90`}>
      {name.charAt(0)}
    </div>
  );
}

const BADGE_STYLE: Record<string, { cls: string; Icon: LucideIcon }> = {
  "Best Selling": { cls: "bg-[#f04e23] text-white", Icon: Flame },
  "New Arrival": { cls: "bg-blue-600 text-white", Icon: Sparkles },
  Offer: { cls: "bg-orange-500 text-white", Icon: Tag },
  Premium: { cls: "bg-stone-900 text-white", Icon: Crown },
};

export function Badge({ label }: { label: string }) {
  const s = BADGE_STYLE[label] ?? BADGE_STYLE["Best Selling"];
  const Icon = s.Icon;
  return (
    <span
      className={`relative inline-flex items-center gap-1.5 rounded-l-full py-1 pl-3 pr-2 text-xs font-semibold drop-shadow-md ${s.cls}`}
    >
      <Icon className="size-3.5" strokeWidth={2.5} />
      {label}
      <span
        aria-hidden
        className="absolute -right-[10px] top-0 h-full w-[11px] bg-inherit"
        style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
      />
    </span>
  );
}

export function DiscountBadge({ text }: { text: string }) {
  return (
    <span className="relative inline-flex items-center gap-1.5 rounded-l-full bg-red-600 py-1 pl-3 pr-2 text-xs font-semibold text-white drop-shadow-md">
      <Zap className="size-3.5" strokeWidth={2.5} />
      {text}
      <span
        aria-hidden
        className="absolute -right-[10px] top-0 h-full w-[11px] bg-inherit"
        style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
      />
    </span>
  );
}

export function ProductCard({ p, i = 0 }: { p: Product; i?: number }) {
  const { add } = useCart();
  const [vi, setVi] = useState(0);
  const v = p.variants[vi] ?? p.variants[0];
  if (!v) return null;
  const off = v.comparePrice ? Math.round((1 - v.price / v.comparePrice) * 100) : 0;
  return (
    <div className="w-full min-w-0 snap-start overflow-hidden rounded-xl border bg-white">
      <Link href={`/products/${p.slug}`}>
        <div className="relative">
          <Thumb name={p.nameEn} i={i} src={p.images?.[0]} />
          <div className="absolute left-2 top-2 flex max-w-[62%] gap-1">{p.badges.map((b) => <Badge key={b} label={b} />)}</div>
          {off > 0 && <span className="absolute bottom-2 right-2"><DiscountBadge text={`-${off}%`} /></span>}
        </div>
      </Link>
      <div className="p-3">
        <Link href={`/products/${p.slug}`} className="line-clamp-2 text-sm font-semibold leading-snug">{p.nameEn}</Link>
        <div className="mt-1 flex gap-1">
          {p.variants.map((vv, k) => (
            <button key={vv.id} onClick={() => setVi(k)} className={`rounded-full border px-2 py-0.5 text-xs ${k === vi ? "border-brand-600 bg-brand-50 font-semibold" : ""}`}>
              {vv.label}
            </button>
          ))}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-bold text-brand-700">{formatBDT(v.price)}</span>
          {v.comparePrice && <span className="text-xs text-gray-400 line-through">{formatBDT(v.comparePrice)}</span>}
        </div>
        <div className="mt-2 flex gap-1.5">
          <button onClick={() => add(p, v)} className="flex-1 rounded-full bg-brand-600 py-1.5 text-xs font-semibold text-white">Add to Cart</button>
          <Link href={`/checkout?buy=${v.id}`} className="flex-1 rounded-full border border-brand-600 py-1.5 text-center text-xs font-semibold text-brand-700">Buy Now</Link>
        </div>
      </div>
    </div>
  );
}

export function ProductRow({ title, items, href }: { title: string; items: Product[]; href: string }) {
  return (
    <section className="mx-auto mt-8 max-w-[1440px] px-4">
      <SectionHead title={title} href={href} />
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {items.map((p, i) => (
          <div key={p.id} className="w-44 shrink-0 snap-start sm:w-56">
            <ProductCard p={p} i={i} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- GhorerBazar-style blocks (own brand + colors) ---------- */

export function SectionHead({ title, sub, href }: { title: string; sub?: string; href: string }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        <h2 className="text-xl font-extrabold sm:text-2xl">{title}</h2>
        <div className="mt-1 h-1 w-14 rounded-full bg-brand-600" />
        {sub && <p className="mt-1 text-sm text-gray-500">{sub}</p>}
      </div>
      <Link href={href} className="shrink-0 rounded-full border border-brand-600 px-4 py-1.5 text-sm font-semibold text-brand-700">
        See all
      </Link>
    </div>
  );
}

export function CategoryCircle({ name, slug, img, big = false }: { name: string; slug: string; img?: string | null; big?: boolean }) {
  const url = imgUrl(img);
  return (
    <Link href={`/collections/${slug}`} className="group block text-center">
      <div className={`mx-auto w-full overflow-hidden rounded-2xl border-2 border-brand-100 bg-brand-50 group-hover:border-brand-500 ${big ? "h-32 sm:h-40" : "h-20 sm:h-24"}`}>
        {url ? (
          <img src={url} alt={name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-200 to-emerald-400 text-2xl font-extrabold text-white">
            {name.charAt(0)}
          </div>
        )}
      </div>
      <div className="mt-1.5 text-xs font-semibold sm:text-sm">{name}</div>
    </Link>
  );
}

export function GBCard({ p }: { p: Product }) {
  const { add } = useCart();
  const v = p.variants[0];
  if (!v) return null;
  const off = v.comparePrice ? Math.round((1 - v.price / v.comparePrice) * 100) : 0;
  return (
    <div className="overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-md">
      <Link href={`/products/${p.slug}`}>
        <div className="relative">
          <Thumb name={p.nameEn} src={p.images?.[0]} tall />
          <div className="absolute left-2 top-2 flex max-w-[62%] gap-1">{p.badges.slice(0, 1).map((b) => <Badge key={b} label={b} />)}</div>
          {off > 0 && <span className="absolute bottom-2 right-2"><DiscountBadge text={`${off}% Off`} /></span>}
        </div>
      </Link>
      <div className="p-3">
        <Link href={`/products/${p.slug}`} className="line-clamp-2 min-h-10 text-sm font-semibold leading-snug">{p.nameEn}</Link>
        {p.nameBn && <div className="truncate text-xs text-gray-500">{p.nameBn}</div>}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-extrabold text-brand-700">{formatBDT(v.price)}</span>
          {v.comparePrice && <span className="text-xs text-gray-400 line-through">{formatBDT(v.comparePrice)}</span>}
        </div>
        <button onClick={() => add(p, v)} className="mt-2 w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white">
          Add To Cart
        </button>
        <Link href={`/checkout?buy=${v.id}`} className="mt-1.5 block w-full rounded-lg border border-brand-600 py-1.5 text-center text-sm font-semibold text-brand-700">
          Buy now
        </Link>
      </div>
    </div>
  );
}

export function SlideRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const slide = (dir: number) => ref.current?.scrollBy({ left: dir * 640, behavior: "smooth" });
  return (
    <div className="relative">
      <div ref={ref} className="no-scrollbar flex snap-x gap-3 overflow-x-auto scroll-smooth pb-1">
        {children}
      </div>
      <button
        onClick={() => slide(-1)}
        aria-label="Slide left"
        className="absolute left-1 top-1/3 hidden h-10 w-10 items-center justify-center rounded-full border bg-white shadow-md sm:flex"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        onClick={() => slide(1)}
        aria-label="Slide right"
        className="absolute right-1 top-1/3 hidden h-10 w-10 items-center justify-center rounded-full border bg-white shadow-md sm:flex"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

const SLIDES = [
  { t: "100% Pure Sundarban Honey", s: "Raw, unprocessed, lab-tested. Free delivery over ৳2,000.", c: "from-brand-700 to-brand-500" },
  { t: "Khejur Gur Season is Here", s: "Fresh date jaggery from Jessore. Limited stock.", c: "from-amber-600 to-yellow-500" },
  { t: "Cold-Pressed Oils", s: "Ghani-bhanga mustard oil, traditional taste.", c: "from-emerald-700 to-green-500" },
];

export function Hero() {
  const [i, setI] = useState(0);
  const go = (d: number) => setI((p) => (p + d + SLIDES.length) % SLIDES.length);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="mx-auto mt-4 max-w-[1440px] px-4">
      <div className="group relative overflow-hidden rounded-2xl">
        <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${i * 100}%)` }}>
          {SLIDES.map((s, k) => (
            <div key={k} className={`w-full shrink-0 bg-gradient-to-r ${s.c}`}>
              <div className="flex min-h-[280px] items-center justify-between p-6 text-white sm:min-h-[380px] sm:p-12">
                <div>
                  <h1 className="text-2xl font-extrabold sm:text-4xl">{s.t}</h1>
                  <p className="mt-2 text-sm opacity-90 sm:text-base">{s.s}</p>
                  <Link href="/collections/all" className="mt-4 inline-block rounded-full bg-white px-6 py-2 text-sm font-bold text-gray-900">Shop Now</Link>
                </div>
                <div className="hidden text-8xl opacity-30 sm:block">❋</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => go(-1)} aria-label="Previous banner" className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-md transition-opacity group-hover:opacity-100 sm:flex">
          <ChevronLeft className="size-5" />
        </button>
        <button onClick={() => go(1)} aria-label="Next banner" className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-md transition-opacity group-hover:opacity-100 sm:flex">
          <ChevronRight className="size-5" />
        </button>
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {SLIDES.map((_, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`Go to banner ${k + 1}`} className={`h-2 rounded-full transition-all ${k === i ? "w-6 bg-white" : "w-2 bg-white/60"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  const items = [
    { n: "Rahima K.", r: "Housewife", d: "Dhanmondi, Dhaka", t: "মধুটা একদম খাঁটি। বাচ্চারা প্রতিদিন খায়। ডেলিভারিও দ্রুত ছিল।" },
    { n: "Tanvir H.", r: "Service Holder", d: "Uttara, Dhaka", t: "Gur quality is excellent, tastes like childhood. COD made it easy." },
    { n: "Nasrin S.", r: "Housewife", d: "Chattogram", t: "Mustard oil is genuinely cold-pressed. Became a regular customer." },
  ];
  return (
    <section className="mx-auto mt-10 max-w-[1440px] px-4">
      <SectionHead title="Customer Reviews" sub="What our customers say" href="/collections/all" />
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((x) => (
          <div key={x.n} className="rounded-xl border bg-white p-4">
            <div className="text-accent-500">★★★★★</div>
            <p className="mt-2 text-sm">{x.t}</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{x.n.charAt(0)}</div>
              <div>
                <div className="text-sm font-semibold">{x.n}</div>
                <div className="text-xs text-gray-500">{x.r} · {x.d}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
