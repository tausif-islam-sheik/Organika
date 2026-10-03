"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export const STAFF = ["ADMIN", "MANAGER", "PACKER"];

export async function api(path: string, opts: RequestInit = {}) {
  const r = await fetch(`${API}${path}`, { credentials: "include", ...opts, headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) } });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<any>(null);
  const router = useRouter();
  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("login"))))
      .then((u) => (STAFF.includes(u.role) ? setMe(u) : Promise.reject(new Error("role"))))
      .catch(() => router.replace("/admin/login"));
  }, [router]);
  if (!me)
    return (
      <main className="mx-auto max-w-6xl animate-pulse p-4 md:p-6">
        <div className="h-8 w-48 rounded-md bg-primary/10" />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-md bg-primary/10" />
          ))}
        </div>
      </main>
    );
  return <>{children}</>;
}

export function AdminNav() {
  return (
    <nav className="flex gap-2 border-b bg-white px-4 py-2 text-sm font-medium">
      <a href="/admin" className="rounded px-3 py-1.5 hover:bg-stone-100">Dashboard</a>
      <a href="/admin/orders" className="rounded px-3 py-1.5 hover:bg-stone-100">Orders</a>
      <a href="/admin/products" className="rounded px-3 py-1.5 hover:bg-stone-100">Products</a>
      <a href="/" className="ml-auto rounded px-3 py-1.5 hover:bg-stone-100">← Store</a>
    </nav>
  );
}
