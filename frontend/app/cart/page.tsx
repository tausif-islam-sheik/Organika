"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "../../components/cart";
import { formatBDT } from "../../lib/shop";
import { PageSkeleton } from "../../components/skeletons";

export default function CartPage() {
  const { lines, subtotal, setQty, remove } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Cart hydrates from localStorage after mount — skeleton avoids an "Empty" flash.
  if (!mounted) return <PageSkeleton />;
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-extrabold">Cart</h1>
      {lines.length === 0 && <p className="mt-4 text-sm">Empty. <Link href="/collections/all" className="underline">Continue shopping</Link></p>}
      {lines.map((l) => (
        <div key={l.variantId} className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3">
          <div className="min-w-0 flex-1 basis-40">
            <Link href={`/products/${l.productSlug}`} className="font-semibold">{l.name}</Link>
            <div className="text-xs text-gray-500">{l.label} · {formatBDT(l.price)}</div>
            <div className="mt-1 flex items-center gap-2">
              <button onClick={() => setQty(l.variantId, l.qty - 1)} className="rounded border px-2">-</button>
              <span>{l.qty}</span>
              <button onClick={() => setQty(l.variantId, l.qty + 1)} className="rounded border px-2">+</button>
            </div>
          </div>
          <div className="font-bold">{formatBDT(l.price * l.qty)}</div>
          <button onClick={() => remove(l.variantId)} className="text-xs text-red-600">Remove</button>
        </div>
      ))}
      {lines.length > 0 && (
        <div className="mt-4 rounded-xl border bg-white p-4">
          <div className="flex justify-between font-bold"><span>Subtotal</span><span>{formatBDT(subtotal)}</span></div>
          <Link href="/checkout" className="mt-3 block rounded-full bg-brand-600 py-3 text-center font-semibold text-white">Proceed to Checkout</Link>
        </div>
      )}
    </main>
  );
}
