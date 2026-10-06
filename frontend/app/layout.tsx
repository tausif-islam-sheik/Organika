import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "../components/cart";
import { StoreChrome } from "../components/store-chrome";
import { getCategories, getStoreSetting } from "../lib/shop";

export const metadata: Metadata = {
  title: "Organika | Organic Grocery BD",
  description: "Pure honey, gur, oils & spices delivered across Bangladesh. COD available.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [cats, store] = await Promise.all([getCategories(), getStoreSetting()]);
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <CartProvider>
          <StoreChrome cats={cats} store={store ?? undefined}>{children}</StoreChrome>
        </CartProvider>
      </body>
    </html>
  );
}
