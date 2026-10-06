"use client";
import { usePathname } from "next/navigation";
import { Header, Footer, FloatingButtons, MobileNav, CartDrawer } from "./chrome";
import { ScrollTop } from "./scroll-top";
import type { StoreConfig } from "../lib/shop";

export function StoreChrome({ cats, store, children }: { cats: { name: string; slug: string }[]; store?: StoreConfig; children: React.ReactNode }) {
  const path = usePathname();
  if (path.startsWith("/admin")) return <>{children}</>;
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <ScrollTop />
      <Header cats={cats} announcement={store?.codText} hotline={store?.hotline} />
      <div className="flex-1">{children}</div>
      <Footer cats={cats} hotline={store?.hotline} whatsapp={store?.whatsapp} />
      <FloatingButtons />
      <MobileNav />
      <CartDrawer />
    </div>
  );
}
