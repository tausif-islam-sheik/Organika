"use client";
import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, PackageSearch, User } from "lucide-react";
import { useCart } from "./cart";
import { imgUrl } from "./home";
import { DEMO_CATEGORIES } from "../lib/shop";
import { formatBDT } from "../lib/shop";

export function Header({ cats }: { cats: { name: string; slug: string }[] }) {
  const { count, setOpen } = useCart();
  const [q, setQ] = useState("");
  const liveSlugs = new Set(cats.map((c) => c.slug));
  const full = [
    ...cats,
    ...DEMO_CATEGORIES.filter((c) => !liveSlugs.has(c.slug)),
    { name: "All Products", slug: "all" },
  ];
  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="bg-brand-700 text-white text-xs">
        <div className="mx-auto max-w-[1440px] px-4 py-1.5 flex justify-between">
          <span>Cash on Delivery available all over Bangladesh</span>
          <span className="hidden sm:inline">Hotline: 09611-XXXXXX</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 md:grid md:grid-cols-[1fr_minmax(0,36rem)_1fr]">
        <Link href="/" className="justify-self-start text-2xl font-extrabold text-brand-700">
          Organika<span className="text-accent-500">.</span>
        </Link>
        <form action="/search" className="hidden w-full md:flex">
          <input
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search honey, gur, oil…"
            className="w-full rounded-l-full border border-r-0 px-4 py-2 text-sm outline-none focus:border-brand-500"
          />
          <button className="shrink-0 rounded-r-full bg-brand-600 px-5 text-sm font-semibold text-white">Search</button>
        </form>
        <div className="ml-auto flex items-center gap-2 md:ml-0 md:justify-self-end">
          <Link href="/track-order" className="hidden items-center gap-1.5 rounded-full border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 sm:flex">
            <PackageSearch className="size-4" /> Track Order
          </Link>
          <Link href="/login" className="hidden items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white sm:flex">
            <User className="size-4" /> Login
          </Link>
          <button onClick={() => setOpen(true)} aria-label="Open cart" className="relative rounded-full bg-brand-600 p-2.5 text-white">
            <ShoppingCart className="size-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
      <form action="/search" className="px-4 pb-2 md:hidden">
        <div className="flex">
          <input
            name="q"
            placeholder="Search honey, gur, oil…"
            className="w-full rounded-l-full border border-r-0 px-4 py-2 text-sm outline-none focus:border-brand-500"
          />
          <button className="shrink-0 rounded-r-full bg-brand-600 px-5 text-sm font-semibold text-white">Search</button>
        </div>
      </form>
      <nav className="bg-brand-600 text-white">
        <div className="no-scrollbar mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-4">
          <Link href="/" className="whitespace-nowrap rounded px-3 py-2.5 text-sm font-semibold hover:bg-white/15">Home</Link>
          {full.map((c) => (
            <Link key={c.slug} href={`/collections/${c.slug}`} className="whitespace-nowrap rounded px-3 py-2.5 text-sm font-medium hover:bg-white/15">
              {c.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-12 bg-brand-700 text-white">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:grid-cols-4">
        <div>
          <div className="text-xl font-extrabold">Organika.</div>
          <p className="mt-2 text-sm opacity-80">Pure organic groceries, delivered across Bangladesh. COD available.</p>
        </div>
        <div>
          <div className="font-semibold">Shop</div>
          <ul className="mt-2 space-y-1 text-sm opacity-80">
            <li><Link href="/collections/honey">Honey</Link></li>
            <li><Link href="/collections/oils">Oils</Link></li>
            <li><Link href="/collections/spices">Spices</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Help</div>
          <ul className="mt-2 space-y-1 text-sm opacity-80">
            <li><Link href="/track-order">Track Order</Link></li>
            <li><Link href="/checkout">Checkout</Link></li>
            <li><Link href="/login">Login</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Contact</div>
          <p className="mt-2 text-sm opacity-80">Hotline: 09611-XXXXXX<br />WhatsApp: 01XXXXXXXXX<br />Dhaka, Bangladesh</p>
        </div>
      </div>
      <div className="border-t border-white/20 py-3 text-center text-xs opacity-70">© 2026 Organika · Prices in BDT · Made in Bangladesh</div>
    </footer>
  );
}

export function FloatingButtons() {
  return (
    <div className="fixed bottom-20 right-3 z-40 flex flex-col gap-2 md:bottom-6">
      <a href="tel:09611000000" className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg" title="Call">C</a>
      <a href="https://wa.me/8801XXXXXXXXX" className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500 text-white shadow-lg" title="WhatsApp">W</a>
    </div>
  );
}

export function MobileNav() {
  const { setOpen, count } = useCart();
  return (
    <nav className="fixed bottom-0 z-40 grid w-full grid-cols-4 border-t bg-white py-2 text-center text-xs md:hidden">
      <Link href="/" className="py-1">Home</Link>
      <Link href="/collections/all" className="py-1">Shop</Link>
      <button onClick={() => setOpen(true)} className="py-1">Cart ({count})</button>
      <Link href="/login" className="py-1">Account</Link>
    </nav>
  );
}

export function CartDrawer() {
  const { lines, subtotal, open, setOpen, setQty, remove } = useCart();
  const close = () => setOpen(false);
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${open ? "opacity-100" : "opacity-0"}`} onClick={close} />
      <aside className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-bold">Your Cart ({lines.length})</h2>
          <button onClick={() => setOpen(false)} className="px-2 py-1 text-xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {lines.length === 0 && <p className="text-sm text-gray-500">Cart is empty. Add some organic goodness!</p>}
          {lines.map((l) => (
            <div key={l.variantId} className="mb-3 flex items-center gap-3 rounded border p-2">
              {imgUrl(l.image) ? (
                <img src={imgUrl(l.image)!} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-brand-50 font-bold text-brand-600">{l.name.charAt(0)}</div>
              )}
              <div className="flex-1">
                <div className="text-sm font-semibold">{l.name}</div>
                <div className="text-xs text-gray-500">{l.label} · {formatBDT(l.price)}</div>
                <div className="mt-1 flex items-center gap-2">
                  <button onClick={() => setQty(l.variantId, l.qty - 1)} className="rounded border px-2">-</button>
                  <span className="text-sm">{l.qty}</span>
                  <button onClick={() => setQty(l.variantId, l.qty + 1)} className="rounded border px-2">+</button>
                </div>
              </div>
              <button onClick={() => remove(l.variantId)} className="text-xs text-red-600">Remove</button>
            </div>
          ))}
        </div>
        <div className="border-t p-4">
          <div className="mb-2 flex justify-between font-semibold">
            <span>Subtotal</span>
            <span>{formatBDT(subtotal)}</span>
          </div>
          <Link href="/checkout" onClick={() => setOpen(false)} className="block rounded-full bg-brand-600 py-2.5 text-center font-semibold text-white">
            Checkout
          </Link>
          <Link href="/cart" onClick={() => setOpen(false)} className="mt-2 block text-center text-sm underline">
            View full cart
          </Link>
        </div>
      </aside>
    </div>
  );
}
