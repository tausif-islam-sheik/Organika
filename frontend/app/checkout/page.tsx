"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Banknote, CreditCard, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useCart, type CartLine } from "../../components/cart";
import { formatBDT, getCollection } from "../../lib/shop";
import { imgUrl } from "../../components/home";
import { CheckoutSkeleton } from "../../components/skeletons";

type Method = "COD" | "ONLINE" | "BKASH";
type Quote = { subtotal: number; delivery: number; discount: number; total: number };

const METHODS: { id: Method; label: string; icon: React.ReactNode; iconBg: string }[] = [
  { id: "COD", label: "Cash On Delivery", icon: <Banknote className="size-6" />, iconBg: "bg-emerald-100 text-emerald-700" },
  { id: "ONLINE", label: "Online Payment", icon: <CreditCard className="size-6" />, iconBg: "bg-blue-900 text-amber-400" },
  { id: "BKASH", label: "bKash", icon: <img src="/images/bkash-white.svg" alt="bKash" className="size-9 object-contain" />, iconBg: "bg-[#E2136E]" },
];

const DISTRICTS = ["Dhaka", "Chattogram"];
const THANAS: Record<string, string[]> = {
  Dhaka: ["Dhanmondi", "Mirpur", "Uttara"],
  Chattogram: ["GEC Circle"],
};

function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <span className="inline-block h-5 w-1 rounded-full bg-brand-600" />
        {children}
      </h2>
      {right}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-gray-400 focus:border-brand-600";

function PhoneInput({ name, required }: { name: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 transition focus-within:border-brand-600">
      <span className="flex shrink-0 items-center gap-1.5 border-r border-gray-200 py-3 pr-2.5">
        <img src="https://flagcdn.com/w80/bd.png" alt="Bangladesh" width={24} height={16} className="h-4 w-6 rounded-[2px] object-cover" />
        <span className="text-sm font-semibold text-gray-700">+880</span>
      </span>
      <input
        name={name}
        required={required}
        inputMode="numeric"
        pattern="1[3-9][0-9]{8}"
        title="Enter 10 digits starting with 1 (e.g. 1712345678)"
        placeholder="1XXXXXXXXX"
        className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-gray-400"
      />
    </div>
  );
}

export default function CheckoutPage() {
  const { lines, setQty, remove, clear } = useCart();
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [method, setMethod] = useState<Method>("COD");
  const [err, setErr] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [billingOpen, setBillingOpen] = useState(false);
  const [shipDistrict, setShipDistrict] = useState("");
  const [billDistrict, setBillDistrict] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [plan, setPlan] = useState<50 | 75 | 100>(50);
  // Direct "Buy Now" flow: /checkout?buy=<variantId>&qty=<n>
  const [buyId, setBuyId] = useState<string | null>(null);
  const [buyQty, setBuyQty] = useState(1);
  const [buyLine, setBuyLine] = useState<CartLine | null>(null);
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const b = sp.get("buy");
    if (b) {
      setBuyId(b);
      setBuyQty(Math.max(1, parseInt(sp.get("qty") ?? "1", 10) || 1));
    }
  }, []);

  useEffect(() => {
    if (!buyId) return;
    const inCart = lines.find((l) => l.variantId === buyId);
    if (inCart) {
      setBuyLine({ ...inCart });
      return;
    }
    let live = true;
    getCollection("organic").then((all) => {
      if (!live) return;
      for (const p of all) {
        const v = p.variants.find((x) => x.id === buyId);
        if (v) {
          setBuyLine({ productSlug: p.slug, name: p.nameEn, image: p.images?.[0], variantId: v.id, label: v.label, price: v.price, qty: 1 });
          return;
        }
      }
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyId]);

  // Buy-Now item takes over the checkout; otherwise the full cart is used.
  const effLines = buyId && buyLine ? [{ ...buyLine, qty: buyQty }] : buyId ? [] : lines;
  const effSubtotal = effLines.reduce((a, l) => a + l.qty * l.price, 0);

  const items = effLines.map((l) => ({ variantId: l.variantId, quantity: l.qty }));

  // Live totals (real delivery + coupon discount), fallback to local calc offline.
  const itemsKey = JSON.stringify(items);
  useEffect(() => {
    if (!items.length) {
      setQuote(null);
      return;
    }
    let live = true;
    fetch(`${api}/checkout/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, ...(appliedCoupon ? { couponCode: appliedCoupon } : {}) }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((q) => {
        // Reset on failure so totals never go stale — falls back to local calc below.
        if (live) setQuote(q ? { subtotal: q.subtotal, delivery: q.delivery, discount: q.discount ?? 0, total: q.total } : null);
      })
      .catch(() => {
        if (live) setQuote(null);
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, appliedCoupon]);

  const delivery = quote?.delivery ?? (effSubtotal >= 200000 || effSubtotal === 0 ? 0 : 6000);
  const discount = quote?.discount ?? 0;
  const quotedSubtotal = quote?.subtotal ?? effSubtotal;
  const total = (quote?.total ?? quotedSubtotal + delivery - discount);
  const isOnline = method !== "COD";
  const partial = Math.round((total * plan) / 100);
  const due = total - partial;
  const money = (paisa: number) => `${(paisa / 100).toLocaleString("en-BD", { minimumFractionDigits: 2 })} BDT`;

  const applyCoupon = async () => {
    setCouponMsg("");
    const code = coupon.trim();
    if (!code) return;
    try {
      const r = await fetch(`${api}/checkout/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, couponCode: code }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message ?? "Invalid coupon");
      setQuote({ subtotal: j.subtotal, delivery: j.delivery, discount: j.discount ?? 0, total: j.total });
      setAppliedCoupon(code);
      setCouponMsg(`Coupon applied — you save ${formatBDT(j.discount ?? 0)}`);
    } catch (e: any) {
      setCouponMsg(e.message ?? "Invalid coupon");
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    setPlacing(true);
    const fd = new FormData(e.currentTarget);
    try {
      const address: Record<string, unknown> = {
        name: fd.get("name"),
        phone: `880${fd.get("phone")}`,
        email: fd.get("email") || undefined,
        division: "Dhaka",
        district: fd.get("district"),
        upazila: fd.get("upazila") || undefined,
        line1: fd.get("line1"),
        note: notes || undefined,
      };
      if (billingOpen) {
        address.billing = {
          name: fd.get("b_name"),
          phone: `880${fd.get("b_phone")}`,
          email: fd.get("b_email") || undefined,
          country: fd.get("b_country") || "Bangladesh",
          district: fd.get("b_district"),
          upazila: fd.get("b_upazila") || undefined,
          line1: fd.get("b_line1"),
        };
      }
      const r = await fetch(`${api}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          address,
          paymentMethod: method === "COD" ? "COD" : "SSLCOMMERZ",
          ...(appliedCoupon ? { couponCode: appliedCoupon } : {}),
          ...(isOnline ? { advancePercent: plan } : {}),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message ?? "Order failed");
      if (method !== "COD") {
        const init = await (
          await fetch(`${api}/payments/ssl/init`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: j.id }),
          })
        ).json();
        if (init.gatewayUrl) {
          window.location.href = init.gatewayUrl;
          return;
        }
        if (!buyId) clear();
        setOrderNo(`${j.orderNo} (pay demo tran ${init.tranId} on success page)`);
        return;
      }
      if (!buyId) clear();
      setOrderNo(j.orderNo);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setPlacing(false);
    }
  };

  if (orderNo) {
    return (
      <main className="min-h-screen bg-[#eef2f7] px-4 py-10 text-center">
        <div className="mx-auto max-w-xl rounded-2xl border bg-white p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</div>
          <h1 className="mt-3 text-2xl font-extrabold">Order placed!</h1>
          <p className="mt-2 text-sm">Order no: <b>{orderNo}</b></p>
          <p className="mt-1 text-sm text-gray-600">Our team will call to confirm. Pay on delivery.</p>
          <Link href="/track-order" className="mt-4 inline-block rounded-full bg-brand-600 px-6 py-2 font-semibold text-white">Track Order</Link>
        </div>
      </main>
    );
  }

  if (buyId && !buyLine) {
    return <CheckoutSkeleton />;
  }

  if (!effLines.length) {
    return (
      <main className="min-h-screen bg-[#eef2f7] px-4 py-10 text-center">
        <div className="mx-auto max-w-xl rounded-2xl border bg-white p-8">
          <h1 className="text-2xl font-extrabold">Your cart is empty</h1>
          <p className="mt-2 text-sm text-gray-600">Add some products before checking out.</p>
          <Link href="/collections/all" className="mt-4 inline-block rounded-full bg-brand-600 px-6 py-2 font-semibold text-white">Continue Shopping</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef2f7]">
      <div className="mx-auto max-w-[1280px] px-4 py-4">
        {/* login banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white px-4 py-3">
          <p className="text-sm font-medium sm:text-base">Have any account? please login or register</p>
          <div className="flex gap-2">
            <Link href="/login" className="rounded-md border border-brand-600 px-6 py-1.5 text-sm font-semibold text-gray-800">Login</Link>
            <Link href="/login" className="rounded-md bg-brand-600 px-6 py-1.5 text-sm font-semibold text-white">Register</Link>
          </div>
        </div>

        <form onSubmit={submit} className="mt-4 grid items-start gap-4 lg:grid-cols-12">
          {/* ---------- left ---------- */}
          <div className="space-y-4 lg:col-span-7">
            {/* order review */}
            <section className="rounded-2xl border bg-white p-5">
              <SectionTitle>Order review</SectionTitle>
              <div className="mt-4 space-y-4">
                {effLines.map((l) => (
                  <div key={l.variantId} className="flex flex-wrap items-center gap-3">
                    {imgUrl(l.image) ? (
                      <img src={imgUrl(l.image)!} alt="" className="h-16 w-16 shrink-0 rounded-lg border object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xl font-bold text-brand-600">{l.name.charAt(0)}</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{l.name} <span className="text-gray-500">· {l.label}</span></div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3">
                        <span className="text-sm text-gray-600">Qty:</span>
                        <span className="inline-flex items-center rounded-full border">
                          <button type="button" onClick={() => (buyId ? setBuyQty(Math.max(1, buyQty - 1)) : setQty(l.variantId, l.qty - 1))} className="px-3 py-1 text-lg leading-none text-brand-600" aria-label="Decrease">-</button>
                          <span className="w-6 text-center text-sm font-semibold">{l.qty}</span>
                          <button type="button" onClick={() => (buyId ? setBuyQty(Math.min(99, buyQty + 1)) : setQty(l.variantId, Math.min(99, l.qty + 1)))} className="px-3 py-1 text-lg leading-none text-brand-600" aria-label="Increase">+</button>
                        </span>
                        <span className="text-sm font-bold">{formatBDT(l.price * l.qty)}</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => (buyId ? setBuyId(null) : remove(l.variantId))} aria-label="Remove item" className="rounded-md bg-red-500 p-1.5 text-white">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* shipping address */}
            <section className="rounded-2xl border bg-white p-5">
              <SectionTitle>Shipping Address</SectionTitle>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input name="name" required placeholder="Your Full Name *" className={inputCls} />
                <PhoneInput name="phone" required />
              </div>
              <input name="email" type="email" placeholder="example@gmail.com (Optional)" className={`${inputCls} mt-3`} />
              <input name="line1" required minLength={5} placeholder="ex: House no. / building / street / area" className={`${inputCls} mt-3`} />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <select name="district" required value={shipDistrict} onChange={(e) => setShipDistrict(e.target.value)} className={`${inputCls} appearance-none text-gray-600`}>
                  <option value="">Select District</option>
                  {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
                <select name="upazila" className={`${inputCls} appearance-none text-gray-600`}>
                  <option value="">Select Thana (Optional)</option>
                  {(THANAS[shipDistrict] ?? Object.values(THANAS).flat()).map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </section>

            {/* billing address */}
            <section className="rounded-2xl border bg-white p-5">
              <button type="button" onClick={() => setBillingOpen((v) => !v)} className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2 text-lg font-bold">
                  <span className="inline-block h-5 w-1 rounded-full bg-brand-600" />
                  Billing Address
                </span>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${billingOpen ? "border-brand-600 bg-brand-600 text-white" : "border-brand-600 text-transparent"}`}>
                  <svg viewBox="0 0 12 12" className="size-3 fill-none stroke-current stroke-2"><path d="M2 6.5 4.8 9 10 3.5" /></svg>
                </span>
              </button>
              <div className={`grid transition-all duration-300 ease-in-out ${billingOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <div className="mt-4 border-t pt-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input name="b_name" required={billingOpen} placeholder="Your Full Name *" className={inputCls} />
                    <PhoneInput name="b_phone" required={billingOpen} />
                  </div>
                  <input name="b_email" type="email" placeholder="example@gmail.com (Optional)" className={`${inputCls} mt-3`} />
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <select name="b_country" className={`${inputCls} appearance-none text-gray-600`} defaultValue="Bangladesh">
                      <option>Select Country</option>
                      <option>Bangladesh</option>
                    </select>
                    <select name="b_district" required={billingOpen} value={billDistrict} onChange={(e) => setBillDistrict(e.target.value)} className={`${inputCls} appearance-none text-gray-600`}>
                      <option value="">Select District</option>
                      {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                    <select name="b_upazila" className={`${inputCls} appearance-none text-gray-600`}>
                      <option value="">Select Thana (Optional)</option>
                      {(THANAS[billDistrict] ?? Object.values(THANAS).flat()).map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <input name="b_line1" required={billingOpen} minLength={5} placeholder="ex: House no. / building / street / area" className={`${inputCls} mt-3`} />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ---------- right ---------- */}
          <div className="space-y-4 lg:col-span-5">
            {/* payment */}
            <section className="rounded-2xl border bg-white p-5">
              <SectionTitle>Payment method</SectionTitle>
              <div className="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
                {METHODS.map((m) => {
                  const active = method === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`relative flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-medium transition ${active ? "border-brand-600 bg-brand-50" : "border-gray-300 bg-white hover:border-gray-400"}`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${m.iconBg}`}>{m.icon}</span>
                      {m.label}
                      <span className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full ${active ? "bg-brand-600 text-white" : "border border-gray-300 text-transparent"}`}>
                        <svg viewBox="0 0 12 12" className="size-3 fill-none stroke-current stroke-2"><path d="M2 6.5 4.8 9 10 3.5" /></svg>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* coupon */}
            <section className="rounded-2xl border bg-white p-5">
              <button type="button" onClick={() => setCouponOpen((v) => !v)} className="flex w-full items-center justify-between font-medium">
                Have any coupon or gift voucher?
                {couponOpen ? <ChevronUp className="size-4 text-brand-600" /> : <ChevronDown className="size-4 text-brand-600" />}
              </button>
              <div className={`grid transition-all duration-300 ease-in-out ${couponOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <div className="mt-3 flex gap-2 border-t pt-3">
                    <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Enter Coupon" className={`${inputCls} flex-1`} />
                    <button type="button" onClick={applyCoupon} className="shrink-0 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white">Apply coupon</button>
                  </div>
                </div>
              </div>
              {couponMsg && <p className={`mt-2 text-sm ${appliedCoupon ? "text-emerald-600" : "text-red-600"}`}>{couponMsg}</p>}
            </section>

            {/* totals */}
            <section className="rounded-2xl border bg-white p-5 text-[15px]">
              <div className="flex justify-between text-gray-500"><span>Sub total</span><span className="text-gray-800">{money(quotedSubtotal)}</span></div>
              <div className="mt-2 flex justify-between text-gray-500"><span>Delivery cost</span><span className="text-gray-800">{delivery === 0 ? "0 BDT" : money(delivery)}</span></div>
              {discount > 0 && <div className="mt-2 flex justify-between text-emerald-600"><span>Coupon discount</span><span>-{money(discount)}</span></div>}
              {isOnline && (
                <>
                  <div className="mt-2 flex justify-between text-gray-500"><span>Payment Plan Discount</span><span className="text-gray-800">{money(0)}</span></div>
                  <div className="mt-2 flex justify-between text-gray-500"><span>Partial Amount</span><span className="text-gray-800">{money(partial)}</span></div>
                  <div className="mt-2 flex justify-between text-gray-500"><span>Due Amount</span><span className="text-gray-800">{money(due)}</span></div>
                </>
              )}
              <div className="mt-3 flex justify-between border-t pt-3 font-bold"><span>{isOnline ? "Total (After Discount)" : "Total"}</span><span>{money(total)}</span></div>
            </section>

            {/* payment plan */}
            {isOnline && (
              <section className="overflow-hidden rounded-2xl border bg-white">
                <h2 className="bg-gray-100 px-5 py-2.5 font-bold">Choose Payment Plan</h2>
                <div className="space-y-4 p-5">
                  {[
                    { v: 50 as const, label: "50% advance payment is required to confirm your order." },
                    { v: 75 as const, label: "75% advance payment is required to confirm your order." },
                    { v: 100 as const, label: "Full payment advance" },
                  ].map((o) => (
                    <button key={o.v} type="button" onClick={() => setPlan(o.v)} className="flex w-full items-center gap-3 text-left">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${plan === o.v ? "border-brand-600" : "border-gray-300"}`}>
                        {plan === o.v && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
                      </span>
                      <span className="text-[15px] text-gray-700">{o.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* notes */}
            <section className="rounded-2xl border bg-white p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <span className="inline-block h-5 w-1 rounded-full bg-brand-600" />
                Special notes <span className="text-sm font-normal">(Optional)</span>
              </h2>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 90))} rows={3} className={`${inputCls} mt-3 resize-y`} />
              <div className="mt-1 text-xs text-gray-500">{notes.length} / 90 characters</div>
            </section>

            <label className="flex cursor-pointer items-start gap-2 px-1 text-sm">
              <input type="checkbox" required className="mt-0.5 size-5 shrink-0 accent-brand-600" defaultChecked />
              <span>
                I have read and agree to the <Link href="#" className="text-brand-700 hover:underline">Terms and Conditions</Link>, <Link href="#" className="text-brand-700 hover:underline">Privacy Policy</Link> & <Link href="#" className="text-brand-700 hover:underline">Refund and Return Policy</Link>.
              </span>
            </label>

            <button type="submit" disabled={placing} className="w-full rounded-md bg-brand-600 py-3.5 font-bold uppercase tracking-wide text-white transition hover:bg-brand-500 disabled:opacity-60">
              {placing ? "Placing order…" : "Place Order"}
            </button>
            {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
          </div>
        </form>
      </div>
    </main>
  );
}
