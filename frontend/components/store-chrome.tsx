"use client";
import { usePathname } from "next/navigation";
import { Header, Footer, FloatingButtons, MobileNav, CartDrawer } from "./chrome";
import { ScrollTop } from "./scroll-top";

export function StoreChrome({ cats, children }: { cats: { name: string; slug: string }[]; children: React.ReactNode }) {
  const path = usePathname();
  if (path.startsWith("/admin")) return <>{children}</>;
  return (
    <div className="pb-14 md:pb-0">
      <ScrollTop />
      <Header cats={cats} />
      {children}
      <Footer />
      <FloatingButtons />
      <MobileNav />
      <CartDrawer />
    </div>
  );
}
