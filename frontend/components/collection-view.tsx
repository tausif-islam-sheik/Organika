"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { formatBDT, type Category, type Product } from "../lib/shop";
import { GBCard } from "./home";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type Sort = "featured" | "low" | "high" | "off";

export function CollectionView({ products, cats, slug, title }: { products: Product[]; cats: Category[]; slug: string; title: string }) {
  const prices = products.map((p) => p.variants[0]?.price ?? 0);
  const maxPrice = Math.max(...prices, 0);
  const [max, setMax] = useState(maxPrice);
  const [badges, setBadges] = useState<string[]>([]);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<Sort>("featured");
  const [page, setPage] = useState(1);
  const PER = 20;

  const toggleBadge = (b: string) =>
    setBadges((bs) => (bs.includes(b) ? bs.filter((x) => x !== b) : [...bs, b]));

  const items = useMemo(() => {
    let list = products.filter((p) => {
      const v = p.variants[0];
      if (!v) return false;
      if (v.price > max) return false;
      if (badges.length && !badges.some((b) => p.badges?.includes(b))) return false;
      if (inStock && v.stock <= 0) return false;
      return true;
    });
    if (sort === "low") list = [...list].sort((a, b) => (a.variants[0]?.price ?? 0) - (b.variants[0]?.price ?? 0));
    if (sort === "high") list = [...list].sort((a, b) => (b.variants[0]?.price ?? 0) - (a.variants[0]?.price ?? 0));
    if (sort === "off")
      list = [...list].sort((a, b) => {
        const off = (p: Product) => {
          const v = p.variants[0];
          return v?.comparePrice ? 1 - v.price / v.comparePrice : 0;
        };
        return off(b) - off(a);
      });
    return list;
  }, [products, max, badges, inStock, sort]);

  useEffect(() => {
    setPage(1);
  }, [max, badges, inStock, sort, slug]);

  const totalPages = Math.max(1, Math.ceil(items.length / PER));
  const safePage = Math.min(page, totalPages);
  const paged = items.slice((safePage - 1) * PER, safePage * PER);

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-extrabold">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <details className="md:hidden">
            <summary className="cursor-pointer rounded-lg border bg-white px-3 py-2 text-sm font-semibold">Filters</summary>
            <div className="absolute z-10 mt-2 w-64 rounded-xl border bg-white p-4 shadow-lg">
              <h3 className="font-bold">Max price</h3>
              <input
                type="range" min={0} max={maxPrice} step={1000} value={max}
                onChange={(e) => setMax(Number(e.target.value))}
                className="mt-2 w-full accent-brand-600"
              />
              <div className="text-sm">Up to <b>{formatBDT(max)}</b></div>
              <h3 className="mt-4 font-bold">Badges</h3>
              {["Best Selling", "New Arrival", "Offer"].map((b) => (
                <label key={b} className="mt-1 flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={badges.includes(b)} onChange={() => toggleBadge(b)} className="accent-brand-600" />
                  {b}
                </label>
              ))}
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="accent-brand-600" />
                In stock only
              </label>
            </div>
          </details>
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger className="w-44 bg-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Sort: Featured</SelectItem>
              <SelectItem value="low">Price: Low to High</SelectItem>
              <SelectItem value="high">Price: High to Low</SelectItem>
              <SelectItem value="off">Discount %</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 flex gap-6">
        <aside className="hidden w-60 shrink-0 md:block">
          <div className="sticky top-32 rounded-xl border bg-white p-4">
            <h3 className="font-bold">Categories</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <Link href="/collections/all" className={slug === "all" ? "font-bold text-brand-700" : "hover:text-brand-600"}>
                  All Products
                </Link>
              </li>
              {cats.map((c) => (
                <li key={c.slug}>
                  <Link href={`/collections/${c.slug}`} className={slug === c.slug ? "font-bold text-brand-700" : "hover:text-brand-600"}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="mt-5 font-bold">Max price</h3>
            <input
              type="range" min={0} max={maxPrice} step={1000} value={max}
              onChange={(e) => setMax(Number(e.target.value))}
              className="mt-2 w-full accent-brand-600"
            />
            <div className="text-sm">Up to <b>{formatBDT(max)}</b></div>

            <h3 className="mt-5 font-bold">Badges</h3>
            {["Best Selling", "New Arrival", "Offer"].map((b) => (
              <label key={b} className="mt-1 flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={badges.includes(b)} onChange={() => toggleBadge(b)} className="accent-brand-600" />
                {b}
              </label>
            ))}

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="accent-brand-600" />
              In stock only
            </label>

            {(badges.length > 0 || max < maxPrice || inStock) && (
              <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => { setBadges([]); setMax(maxPrice); setInStock(false); }}>
                Clear filters
              </Button>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {items.length === 0 ? (
            <p className="mt-6 text-sm">No products match the filters.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {paged.map((p) => <GBCard key={p.id} p={p} />)}
              </div>
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-1.5">
                  <Button variant="outline" size="icon" disabled={safePage <= 1} onClick={() => setPage(1)} aria-label="First page"><ChevronsLeft /></Button>
                  <Button variant="outline" size="icon" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page"><ChevronLeft /></Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <Button key={n} variant={n === safePage ? "default" : "outline"} size="sm" onClick={() => setPage(n)}>{n}</Button>
                  ))}
                  <Button variant="outline" size="icon" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} aria-label="Next page"><ChevronRight /></Button>
                  <Button variant="outline" size="icon" disabled={safePage >= totalPages} onClick={() => setPage(totalPages)} aria-label="Last page"><ChevronsRight /></Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
