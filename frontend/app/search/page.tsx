import Link from "next/link";
import { searchProducts } from "../../lib/shop";
import { ProductCard } from "../../components/home";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const items = await searchProducts(q ?? "");
  return (
    <main className="mx-auto max-w-[1440px] px-4 py-6">
      <div className="text-xs text-gray-500"><Link href="/">Home</Link> / Search</div>
      <h1 className="mt-1 text-2xl font-extrabold">Results for “{q}”</h1>
      <div className="mt-4 flex flex-wrap gap-3">
        {items.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}
      </div>
      {items.length === 0 && <p className="mt-6 text-sm">Nothing found. Try “honey”.</p>}
    </main>
  );
}
