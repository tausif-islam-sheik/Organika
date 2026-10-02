"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Store, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { ThemeToggle } from "./theme-toggle";
import { ScrollTop } from "./scroll-top";
import { cn } from "../lib/utils";
import { API } from "./admin";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, exact: false },
  { href: "/admin/products", label: "Products", icon: Package, exact: false },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (path === "/admin/login") return <><ScrollTop />{children}</>;

  const title = path.startsWith("/admin/orders") ? "Orders" : path.startsWith("/admin/products") ? "Products" : "Dashboard";

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
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <Link href="/" className="flex h-14 shrink-0 items-center gap-2 overflow-hidden whitespace-nowrap px-5" title="View store">
          <span className="text-2xl font-extrabold text-white">Organika<span className="text-accent-500">.</span></span>
          <span className="rounded bg-sidebar-accent px-1.5 py-0.5 text-[11px] font-bold">Admin</span>
        </Link>
        <Separator className="bg-sidebar-border" />
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((n) => {
            const active = n.exact ? path === n.href : path.startsWith(n.href);
            return (
              <Button
                key={n.href}
                asChild
                variant="ghost"
                className={cn(
                  "justify-start",
                  active ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Link href={n.href}>
                  <n.icon /> {n.label}
                </Link>
              </Button>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-1 p-3">
          <Separator className="mb-2 bg-sidebar-border" />
          <Button variant="ghost" onClick={logout} disabled={busy} className="justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <LogOut /> {busy ? "Logging out…" : "Logout"}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b bg-background">
          <div className="flex h-14 shrink-0 items-center gap-2 px-4">
            <span className="font-bold tracking-tight md:hidden">Organika Admin</span>
            <span className="hidden font-bold tracking-tight md:inline">{title}</span>
            <div className="ml-auto flex items-center gap-1.5">
              <ThemeToggle />
              <Button asChild variant="outline" size="sm">
                <Link href="/"><Store /> <span className="hidden sm:inline">View store</span></Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto px-2 pb-2 md:hidden">
            {NAV.map((n) => (
              <Button key={n.href} asChild variant={(n.exact ? path === n.href : path.startsWith(n.href)) ? "secondary" : "ghost"} size="sm">
                <Link href={n.href}><n.icon /> {n.label}</Link>
              </Button>
            ))}
          </div>
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
