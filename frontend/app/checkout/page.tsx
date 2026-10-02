"use client";
import { useState } from "react";
import { useCart } from "../../components/cart";
import { formatBDT } from "../../lib/shop";
import { imgUrl } from "../../components/home";

export default function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [method, setMethod] = useState("COD");
  const [err, setErr] = useState("");
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    const fd = new FormData(e.currentTarget);
    try {
      const r = await fetch(`${api}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ variantId: l.variantId, quantity: l.qty })),
          address: { name: fd.get("name"), phone: fd.get("phone"), division: fd.get("division"), district: fd.get("district"), upazila: fd.get("upazila"), line1: fd.get("line1") },
          paymentMethod: method === "COD" ? "COD" : "SSLCOMMERZ",
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message ?? "Order failed");
      if (method !== "COD") {
        const init = await (await fetch(`${api}/payments/ssl/init`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: j.id }),
        })).json();
        if (init.gatewayUrl) {
          window.location.href = init.gatewayUrl;
          return;
        }
        clear();
        setOrderNo(`${j.orderNo} (pay demo tran ${init.tranId} on success page)`);
        return;
      }
      clear();
      setOrderNo(j.orderNo);
    } catch (e: any) {
      setErr(e.message);
    }
  };
  const delivery = subtotal >= 200000 || subtotal === 0 ? 0 : 6000;

  if (orderNo) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10 text-center">
        <div className="text-5xl">✓</div>
        <h1 className="mt-2 text-2xl font-extrabold">Order placed!</h1>
        <p className="mt-2 text-sm">Order no: <b>{orderNo}</b></p>
        <p className="mt-1 text-sm text-gray-600">Our team will call to confirm. Pay on delivery.</p>
        <a href="/track-order" className="mt-4 inline-block rounded-full bg-brand-600 px-6 py-2 font-semibold text-white">Track Order</a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-extrabold">Checkout</h1>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <form id="checkout-form" className="rounded-xl border bg-white p-4" onSubmit={submit}>
          <h2 className="font-bold">Delivery address</h2>
          {[
            ["name", "Full name"], ["phone", "Phone (01XXXXXXXXX)"],
          ].map(([n, ph]) => (
            <input key={n} name={n} required pattern={n === "phone" ? "01[3-9][0-9]{8}" : undefined} placeholder={ph} className="mt-2 w-full rounded border px-3 py-2 text-sm" />
          ))}
          <div className="mt-2 grid grid-cols-3 gap-2">
            <select name="division" required className="rounded border px-2 py-2 text-sm"><option value="">Division</option><option>Dhaka</option><option>Chattogram</option></select>
            <select name="district" required className="rounded border px-2 py-2 text-sm"><option value="">District</option><option>Dhaka</option><option>Chattogram</option></select>
            <select name="upazila" required className="rounded border px-2 py-2 text-sm"><option value="">Upazila</option><option>Dhanmondi</option><option>Mirpur</option><option>Uttara</option></select>
          </div>
          <input name="line1" required minLength={5} placeholder="House / Road / Area" className="mt-2 w-full rounded border px-3 py-2 text-sm" />
        </form>
        <div className="h-fit rounded-xl border bg-white p-4">
          <h2 className="font-bold">Summary ({lines.length})</h2>
          {lines.map((l) => (
            <div key={l.variantId} className="mt-2 flex items-center gap-2 text-sm">
              {imgUrl(l.image) ? (
                <img src={imgUrl(l.image)!} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-brand-50 font-bold text-brand-600">{l.name.charAt(0)}</div>
              )}
              <span className="flex-1">{l.name} × {l.qty}</span><span>{formatBDT(l.price * l.qty)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between text-sm"><span>Delivery</span><span>{delivery === 0 ? "FREE" : formatBDT(delivery)}</span></div>
          <div className="mt-2 flex justify-between font-bold"><span>Total</span><span>{formatBDT(subtotal + delivery)}</span></div>
          <h2 className="mt-4 font-bold">Payment</h2>
          <label className="mt-2 flex cursor-pointer items-center gap-2 rounded border p-2 text-sm">
            <input type="radio" checked={method === "COD"} onChange={() => setMethod("COD")} /> Cash on Delivery
          </label>
          <label className="mt-2 flex cursor-pointer items-center gap-2 rounded border p-2 text-sm">
            <input type="radio" checked={method === "SSL"} onChange={() => setMethod("SSL")} /> Online (bKash / Nagad via SSLCommerz)
          </label>
          <label className="mt-2 flex cursor-pointer items-center gap-2 rounded border p-2 text-sm">
            <input type="radio" checked={method === "CARD"} onChange={() => setMethod("CARD")} /> Debit / Credit Card
          </label>
          <button form="checkout-form" className="mt-4 w-full rounded-full bg-brand-600 py-3 font-semibold text-white">
            Place Order · {formatBDT(subtotal + delivery)}
          </button>
          {err && <p className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">{err}</p>}
        </div>
      </div>
    </main>
  );
}
