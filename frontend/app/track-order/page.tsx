"use client";
import { useEffect, useState } from "react";
import { Search, Loader2, PackageSearch } from "lucide-react";
import { formatBDT } from "../../lib/shop";

const STAGES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

const PILL: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-violet-100 text-violet-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
  FAILED: "bg-red-100 text-red-800",
  RETURNED: "bg-gray-200 text-gray-700",
};

const RECENT_KEY = "organika-track-recent";

export default function TrackPage() {
  const [no, setNo] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const stage = order ? STAGES.indexOf(order.status) : -1;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  const remember = (orderNo: string) => {
    setRecent((rs) => {
      const next = [orderNo, ...rs.filter((x) => x !== orderNo)].slice(0, 5);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setOrder(null);
    setBusy(true);
    try {
      const r = await fetch(`${api}/orders/track/${no.trim()}`);
      const j = await r.json();
      if (!r.ok || !j) throw new Error("Order not found");
      setOrder(j);
      remember(j.orderNo);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <PackageSearch className="size-5" />
          </span>
          Track Order
        </h1>
      <form className="mt-4 flex gap-2" onSubmit={submit}>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 shadow-sm transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-600/10">
          <Search className="size-4 shrink-0 text-gray-400" />
          <input
            value={no}
            onChange={(e) => setNo(e.target.value)}
            placeholder="Order no (e.g. ORG-000123)"
            className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-gray-400"
          />
        </div>
        <button
          disabled={busy}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-brand-600/25 transition hover:brightness-110 disabled:opacity-60"
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy ? "Tracking" : "Track"}
        </button>
      </form>
      <p className="mt-2 text-xs text-gray-400">Find your order number in your confirmation message or SMS.</p>
      {recent.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-gray-400">Recent:</span>
          {recent.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setNo(r)}
              className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 font-semibold text-gray-600 transition hover:border-brand-500 hover:text-brand-700"
            >
              {r}
            </button>
          ))}
        </div>
      )}
      {err && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{err}</p>}

      {order && (
        <div className="mt-4 rounded-xl bg-gray-50 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Order <b>{order.orderNo}</b></span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${PILL[order.status] ?? "bg-gray-200 text-gray-700"}`}>
              {order.status}
            </span>
            <span className="ml-auto text-xs text-gray-500">
              {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" }) : ""}
              {order.paymentMethod ? ` · ${order.paymentMethod === "COD" ? "COD" : "Online"}` : ""}
            </span>
          </div>
          {stage >= 0 ? (
            <div className="mt-4 flex overflow-x-auto">
              {STAGES.map((s, i) => (
                <div key={s} className="min-w-14 flex-1 text-center">
                  <div className={`mx-auto h-4 w-4 rounded-full ${i <= stage ? "bg-brand-600" : "bg-gray-300"}`} />
                  <div className="mt-1 text-[10px]">{s}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-600">This order was {order.status.toLowerCase()}.</p>
          )}
          <div className="mt-4 space-y-1 border-t border-gray-200 pt-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Items</span>
              <span>{order.items?.reduce((a: number, i: any) => a + i.quantity, 0) ?? 0}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatBDT(order.total ?? 0)}</span>
            </div>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}
