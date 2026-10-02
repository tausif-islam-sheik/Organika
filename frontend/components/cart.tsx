"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Product, Variant } from "../lib/shop";

export type CartLine = {
  productSlug: string;
  name: string;
  image?: string;
  variantId: string;
  label: string;
  price: number;
  qty: number;
};

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (p: Product, v: Variant, qty?: number) => void;
  remove: (variantId: string) => void;
  setQty: (variantId: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("organika-cart");
      if (raw) setLines(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("organika-cart", JSON.stringify(lines));
    } catch {}
  }, [lines]);

  const add = useCallback((p: Product, v: Variant, qty = 1) => {
    setLines((ls) => {
      const i = ls.findIndex((l) => l.variantId === v.id);
      if (i >= 0) {
        const c = [...ls];
        c[i] = { ...c[i], qty: Math.min(99, c[i].qty + qty) };
        return c;
      }
      return [...ls, { productSlug: p.slug, name: p.nameEn, image: p.images?.[0], variantId: v.id, label: v.label, price: v.price, qty }];
    });
    setOpen(true);
  }, []);
  const remove = useCallback((variantId: string) => setLines((ls) => ls.filter((l) => l.variantId !== variantId)), []);
  const setQty = useCallback(
    (variantId: string, qty: number) =>
      setLines((ls) => (qty <= 0 ? ls.filter((l) => l.variantId !== variantId) : ls.map((l) => (l.variantId === variantId ? { ...l, qty } : l)))),
    [],
  );
  const clear = useCallback(() => setLines([]), []);

  const { count, subtotal } = useMemo(() => {
    return { count: lines.reduce((a, l) => a + l.qty, 0), subtotal: lines.reduce((a, l) => a + l.qty * l.price, 0) };
  }, [lines]);

  return <Ctx.Provider value={{ lines, count, subtotal, open, setOpen, add, remove, setQty, clear }}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside provider");
  return c;
};
