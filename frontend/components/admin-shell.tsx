"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ShoppingCart, Package, LayoutGrid, Award, Users, Ticket,
  Truck, Star, Home, Bell, ShieldCheck, Settings as SettingsIcon, LogOut, Store, Menu,
} from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { ScrollTop } from "./scroll-top";
import { Toaster } from "./ui/sonner";
import { NotificationBell } from "./admin/notifications";
import { cn } from "../lib/utils";
import { API } from "./admin";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, exact: false },
  { href: "/admin/products", label: "Products", icon: Package, exact: false },
  { href: "/admin/categories", label: "Categories", icon: LayoutGrid, exact: false },
  { href: "/admin/brands", label: "Brands", icon: Award, exact: false },
  { href: "/admin/customers", label: "Customers", icon: Users, exact: false },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket, exact: false },
  { href: "/admin/delivery", label: "Delivery", icon: Truck, exact: false },
  { href: "/admin/reviews", label: "Reviews", icon: Star, exact: false },
  { href: "/admin/homepage", label: "Homepage", icon: Home, exact: false },
  { href: "/admin/notifications", label: "Notifications", icon: Bell, exact: false },
  { href: "/admin/staff", label: "Staff", icon: ShieldCheck, exact: false },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon, exact: false },
];

function NavButtons({ path, onNav }: { path: string; onNav?: () => void }) {
  return (
    <>
      {NAV.map((n) => {
        const active = n.exact ? path === n.href : path.startsWith(n.href);
        return (
          <Button
            key={n.href}
            asChild
            variant="ghost"
            onClick={onNav}
            className={cn(
              "h-10 justify-start text-base font-medium [&_svg]:size-5",
              active ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            <Link href={n.href}>
              <n.icon /> {n.label}
            </Link>
          </Button>
        );
      })}
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  if (path === "/admin/login") return <><ScrollTop /><Toaster />{children}</>;

  const active = [...NAV].reverse().find((n) => (n.exact ? path === n.href : path.startsWith(n.href)));

  const logout = async () => {
    setBusy(true);
    try {
      await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {}
    router.replace("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-muted/40">
      <ScrollTop />
      <Toaster />
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <Link href="/" className="flex h-14 shrink-0 items-center gap-2 overflow-hidden whitespace-nowrap px-5" title="View store">
          <span className="text-2xl font-extrabold text-white">Organika<span className="text-accent-500">.</span></span>
          <span className="rounded bg-sidebar-accent px-1.5 py-0.5 text-[11px] font-bold">Admin</span>
        </Link>
        <Separator className="bg-sidebar-border" />
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          <NavButtons path={path} />
        </nav>
        <div className="flex flex-col gap-1 p-3">
          <Separator className="mb-2 bg-sidebar-border" />
          <Button variant="ghost" onClick={logout} disabled={busy} className="justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <LogOut /> {busy ? "Logging out…" : "Logout"}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b bg-background">
          <div className="flex h-14 shrink-0 items-center gap-1.5 px-3 md:px-4">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-sidebar text-sidebar-foreground">
                <SheetHeader>
                  <SheetTitle className="text-left text-white">Organika Admin</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 overflow-y-auto">
                  <NavButtons path={path} onNav={() => setSheetOpen(false)} />
                  <Separator className="my-2 bg-sidebar-border" />
                  <Button variant="ghost" onClick={logout} disabled={busy} className="justify-start text-sidebar-foreground/70">
                    <LogOut /> Logout
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
            <span className="font-bold tracking-tight">{active?.label ?? "Admin"}</span>
            <div className="ml-auto flex items-center gap-1">
              <NotificationBell />
              <ThemeToggle />
              <Button asChild variant="outline" size="sm">
                <Link href="/"><Store /> <span className="hidden sm:inline">View store</span></Link>
              </Button>
            </div>
          </div>
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
