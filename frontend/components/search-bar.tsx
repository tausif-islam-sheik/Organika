"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2, Search, ArrowRight, PackageSearch } from "lucide-react";
import { DEMO_PRODUCTS, formatBDT, type Product } from "../lib/shop";
import { imgUrl } from "./home";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function fetchSuggestions(q: string, signal: AbortSignal): Promise<Product[]> {
  const query = q.trim();
  if (!query) return [];
  try {
    const r = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, { signal });
    if (r.ok) {
      const live = (await r.json()) as Product[];
      if (Array.isArray(live)) return live.slice(0, 8);
    }
  } catch {
    // fall through to local fallback (abort also lands here)
    if (signal.aborted) return [];
  }
  const s = query.toLowerCase();
  return DEMO_PRODUCTS.filter(
    (p) =>
      p.nameEn.toLowerCase().includes(s) ||
      (p.nameBn ?? "").includes(query) ||
      p.slug.toLowerCase().includes(s),
  ).slice(0, 8);
}

export function SearchBar({
  autoFocus = false,
  defaultValue = "",
  onNavigate,
  id,
}: {
  autoFocus?: boolean;
  defaultValue?: string;
  onNavigate?: () => void;
  id?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Product[]>([]);
  const [touched, setTouched] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced live lookup — shows related products while typing.
  useEffect(() => {
    const query = q.trim();
    if (query.length < 1) {
      setItems([]);
      setLoading(false);
      setOpen(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const res = await fetchSuggestions(query, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setItems(res);
      setLoading(false);
      setOpen(true);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // Close on outside click / Escape.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const go = (href: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };

  const showDropdown = open && (loading || touched || items.length > 0 || q.trim().length > 0);

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        action="/search"
        className="flex w-full"
        onSubmit={() => {
          setOpen(false);
          onNavigate?.();
        }}
      >
        <div className="relative w-full">
          <input
            id={id}
            name="q"
            value={q}
            autoFocus={autoFocus}
            autoComplete="off"
            onChange={(e) => {
              setQ(e.target.value);
              setTouched(true);
            }}
            onFocus={() => {
              setTouched(true);
              if (q.trim().length >= 1 && (items.length > 0 || loading)) setOpen(true);
            }}
            placeholder="Search honey, gur, oil…"
            className="w-full rounded-l-full border border-r-0 px-4 py-2 pr-9 text-sm outline-none focus:border-brand-500"
          />
          {q && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQ("");
                setItems([]);
                setOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lg leading-none text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
        <button
          type="submit"
          aria-label="Search"
          className="flex shrink-0 items-center gap-1.5 rounded-r-full bg-brand-600 px-5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <Search className="size-4 md:hidden" />
          <span className="hidden md:inline">Search</span>
        </button>
      </form>

      {showDropdown && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.14)]">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
              <Loader2 className="size-4 animate-spin" /> Searching…
            </div>
          ) : items.length > 0 ? (
            <>
              <div className="max-h-[60vh] overflow-y-auto py-1.5">
                {items.map((p) => {
                  const v = p.variants[0];
                  const url = imgUrl(p.images?.[0]);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => go(`/products/${p.slug}`)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-brand-50"
                    >
                      {url ? (
                        <img src={url} alt="" className="h-11 w-11 shrink-0 rounded-lg border object-cover" />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-lg font-extrabold text-brand-600">
                          {p.nameEn.charAt(0)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold leading-snug">{p.nameEn}</span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {p.nameBn ? `${p.nameBn} · ` : ""}
                          {v ? formatBDT(v.price) : ""}
                          {v ? ` · ${v.label}` : ""}
                        </span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-gray-300" />
                    </button>
                  );
                })}
              </div>
              <Link
                href={`/search?q=${encodeURIComponent(q.trim())}`}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className="flex items-center justify-center gap-1.5 border-t bg-gray-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                <Search className="size-4" /> See all results for “{q.trim()}”
              </Link>
            </>
          ) : (
            touched &&
            q.trim().length >= 1 && (
              <div className="px-4 py-4 text-center">
                <PackageSearch className="mx-auto size-6 text-gray-300" />
                <p className="mt-1.5 text-sm text-gray-600">
                  No products found for “<span className="font-semibold">{q.trim()}</span>”
                </p>
                <Link
                  href={`/search?q=${encodeURIComponent(q.trim())}`}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className="mt-2 inline-block rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white"
                >
                  View full search
                </Link>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
