"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingCart, PackageSearch, User, Home, LayoutGrid, ShoppingBag, CircleUserRound, Search, Phone, MessageCircle, Banknote, CreditCard, MapPin } from "lucide-react";
import { useCart } from "./cart";
import { imgUrl } from "./home";
import { SearchBar } from "./search-bar";
import { DEMO_CATEGORIES } from "../lib/shop";
import { formatBDT } from "../lib/shop";

export function Header({ cats, announcement, hotline }: { cats: { name: string; slug: string }[]; announcement?: string; hotline?: string }) {
  const { count, setOpen } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
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
          <span>{announcement ?? "Cash on Delivery available all over Bangladesh"}</span>
          <span className="hidden sm:inline">Hotline: {hotline ?? "09611-XXXXXX"}</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 md:grid md:grid-cols-[1fr_minmax(0,36rem)_1fr]">
        <Link href="/" className="justify-self-start text-3xl font-extrabold text-brand-700">
          Organika<span className="text-accent-500">.</span>
        </Link>
        <div className="hidden w-full md:flex">
          <SearchBar id="site-search-desktop" />
        </div>
        <div className="ml-auto flex items-center gap-2 md:ml-0 md:justify-self-end">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
            className={`rounded-full p-2.5 transition md:hidden ${searchOpen ? "bg-brand-600 text-white" : "border border-gray-200 text-gray-700"}`}
          >
            <Search className="size-5" />
          </button>
          <Link href="/track-order" className="hidden items-center gap-1.5 rounded-full border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 sm:flex">
            <PackageSearch className="size-4" /> Track Order
          </Link>
          <Link href="/login" className="hidden items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white sm:flex">
            <User className="size-4" /> Login
          </Link>
          <button onClick={() => setOpen(true)} aria-label="Open cart" className="relative rounded-full border border-gray-200 p-2.5 text-gray-700 transition hover:border-brand-600 hover:text-brand-700">
            <ShoppingCart className="size-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
      {searchOpen && (
      <div className="px-4 pb-2 md:hidden">
        <SearchBar id="site-search-mobile" autoFocus onNavigate={() => setSearchOpen(false)} />
      </div>
      )}
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

export function Footer({ cats = [], hotline, whatsapp }: { cats?: { name: string; slug: string }[]; hotline?: string; whatsapp?: string }) {
  const shop = cats.length ? cats.slice(0, 5) : [
    { name: "Honey", slug: "honey" },
    { name: "Oils", slug: "oils" },
    { name: "Spices", slug: "spices" },
  ];
  return (
    <footer className="mt-12 bg-brand-700 text-white">
      {/* main */}
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-2 lg:col-span-1">
          <Link href="/" className="text-3xl font-extrabold tracking-tight">
            Organika<span className="text-accent-400">.</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed opacity-80">
            Pure honey, gur, oils & spices from trusted Bangladeshi farms — delivered to your doorstep.
          </p>
          <div className="mt-4 flex gap-2">
            <a href="#" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/30">
              <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M13.5 21.5v-7h2.6l.5-3h-3.1V9.6c0-.9.3-1.6 1.7-1.6h1.5V5.2c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.6H8.2v3h2.6v7h2.7z" /></svg>
            </a>
            <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/30">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" stroke="none" /></svg>
            </a>
            <a href="#" aria-label="YouTube" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/30">
              <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" /></svg>
            </a>
          </div>
        </div>
        <div>
          <div className="text-sm font-bold uppercase tracking-wider">
            Shop
            <span className="mt-1.5 block h-0.5 w-8 rounded-full bg-accent-500" />
          </div>
          <ul className="mt-3 space-y-2 text-sm opacity-80">
            {shop.map((c) => (
              <li key={c.slug}>
                <Link href={`/collections/${c.slug}`} className="inline-block transition hover:translate-x-1 hover:text-accent-400 hover:opacity-100">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/collections/all" className="inline-block transition hover:translate-x-1 hover:text-accent-400 hover:opacity-100">
                All Products
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-bold uppercase tracking-wider">
            Help
            <span className="mt-1.5 block h-0.5 w-8 rounded-full bg-accent-500" />
          </div>
          <ul className="mt-3 space-y-2 text-sm opacity-80">
            <li><Link href="/track-order" className="inline-block transition hover:translate-x-1 hover:text-accent-400 hover:opacity-100">Track Order</Link></li>
            <li><Link href="/checkout" className="inline-block transition hover:translate-x-1 hover:text-accent-400 hover:opacity-100">Checkout</Link></li>
            <li><Link href="/cart" className="inline-block transition hover:translate-x-1 hover:text-accent-400 hover:opacity-100">Cart</Link></li>
            <li><Link href="/login" className="inline-block transition hover:translate-x-1 hover:text-accent-400 hover:opacity-100">Login / Register</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-bold uppercase tracking-wider">
            Contact
            <span className="mt-1.5 block h-0.5 w-8 rounded-full bg-accent-500" />
          </div>
          <ul className="mt-3 space-y-2.5 text-sm opacity-80">
            <li className="flex items-center gap-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15"><Phone className="size-3.5" /></span> Hotline: {hotline ?? "09611-XXXXXX"}</li>
            <li className="flex items-center gap-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15"><MessageCircle className="size-3.5" /></span> WhatsApp: {whatsapp ?? "01XXXXXXXXX"}</li>
            <li className="flex items-center gap-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15"><MapPin className="size-3.5" /></span> Dhaka, Bangladesh</li>
          </ul>
          <div className="mt-4 flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-[11px] font-bold">
              <Banknote className="size-3.5" /> COD
            </span>
            <span className="flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-[11px] font-bold">
              <img src="/images/bkash-white.svg" alt="" className="h-3.5 w-3.5 object-contain" /> bKash
            </span>
            <span className="flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-[11px] font-bold">
              <CreditCard className="size-3.5" /> Cards
            </span>
          </div>
        </div>
      </div>

      <div className="bg-black/20">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-1 px-4 py-3 text-xs opacity-70 sm:flex-row">
          <span>© 2026 Organika · Prices in BDT · Made in Bangladesh</span>
          <span>Terms · Privacy · Refund Policy</span>
        </div>
      </div>
    </footer>
  );
}

export function FloatingButtons() {
  return (
    <div className="fixed bottom-24 right-2 z-40 flex flex-col gap-2 md:bottom-6 md:right-3">
      <a href="tel:09611000000" aria-label="Call us" className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:brightness-110 md:h-11 md:w-11">
        <Phone className="size-4 md:size-5" />
      </a>
      <a href="https://wa.me/8801XXXXXXXXX" aria-label="WhatsApp" className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:brightness-110 md:h-11 md:w-11">
        <MessageCircle className="size-4 md:size-5" />
      </a>
    </div>
  );
}

export function MobileNav() {
  const { setOpen, count } = useCart();
  const path = usePathname();
  const linkCls = (active: boolean) =>
    `relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition ${
      active ? "bg-brand-50 text-brand-700" : "text-gray-500 active:bg-gray-100"
    }`;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="grid grid-cols-4 gap-1 border border-x-0 border-b-0 border-gray-100 bg-white/95 p-1.5 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
        <Link href="/" className={linkCls(path === "/")}>
          <Home className="size-5" /> Home
        </Link>
        <Link
          href="/collections/all"
          className={linkCls(path.startsWith("/collections") || path.startsWith("/products") || path.startsWith("/search"))}
        >
          <LayoutGrid className="size-5" /> Shop
        </Link>
        <button onClick={() => setOpen(true)} className={linkCls(false)}>
          <span className="relative">
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </span>
          Cart
        </button>
        <Link href="/login" className={linkCls(path.startsWith("/login") || path.startsWith("/track-order"))}>
          <CircleUserRound className="size-5" /> Account
        </Link>
      </div>
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
