"use client";
import { useState } from "react";

const STAGES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function TrackPage() {
  const [no, setNo] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [err, setErr] = useState("");
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const stage = order ? STAGES.indexOf(order.status) : null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setOrder(null);
    try {
      const r = await fetch(`${api}/orders/track/${no.trim()}`);
      const j = await r.json();
      if (!r.ok || !j) throw new Error("Order not found");
      setOrder(j);
    } catch (e: any) {
      setErr(e.message);
    }
  };
  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-2xl font-extrabold">Track Order</h1>
      <form className="mt-4 flex gap-2" onSubmit={submit}>
        <input value={no} onChange={(e) => setNo(e.target.value)} placeholder="Order no (e.g. GB-260001)" className="flex-1 rounded border px-3 py-2 text-sm" />
        <button className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white">Track</button>
      </form>
      {err && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{err}</p>}
      {stage !== null && order && (
        <div className="mt-6">
          <div className="text-sm font-semibold">Order {order.orderNo} · {order.status}</div>
          <div className="mt-3 flex">
            {STAGES.map((s, i) => (
              <div key={s} className="flex-1 text-center">
                <div className={`mx-auto h-4 w-4 rounded-full ${i <= stage ? "bg-brand-600" : "bg-gray-300"}`} />
                <div className="mt-1 text-[10px]">{s}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">Live status from our system. Courier tracking connects in Phase 4.</p>
        </div>
      )}
    </main>
  );
}
