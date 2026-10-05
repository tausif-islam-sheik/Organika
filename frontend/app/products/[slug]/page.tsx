"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCollection, getProduct } from "../../../lib/shop";
import { Badge, DiscountBadge, GBCard, SlideRow, imgUrl } from "../../../components/home";
import { ProductDetailSkeleton } from "../../../components/skeletons";
import { useCart } from "../../../components/cart";
import { formatBDT } from "../../../lib/shop";
import type { Product } from "../../../lib/shop";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { add } = useCart();
  const [p, setP] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [vi, setVi] = useState(0);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [tab, setTab] = useState<"desc" | "rev">("desc");
  const [revMsg, setRevMsg] = useState("");
  const [rating, setRating] = useState("5");
  const [photos, setPhotos] = useState<string[]>([]);

  const addPhotos = (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/")).slice(0, Math.max(0, 3 - photos.length));
    setPhotos((p) => [...p, ...imgs.map((f) => URL.createObjectURL(f))].slice(0, 3));
  };

  useEffect(() => {
    params.then(({ slug }) => {
      getProduct(slug).then((prod) => {
        setP(prod);
        setVi(0);
        setQty(1);
        setImg(0);
        if (prod) {
          getCollection("organic").then((all) =>
            setRelated(all.filter((x) => x.id !== prod.id).slice(0, 10)),
          );
        }
      });
    });
  }, [params]);

  if (!p) return <ProductDetailSkeleton />;
  const v = p.variants[vi] ?? p.variants[0];
  const off = v?.comparePrice ? Math.round((1 - v.price / v.comparePrice) * 100) : 0;
  const gallery = p.images?.length ? p.images : [null];

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-4">
      <section className="flex min-h-[calc(100svh-220px)] flex-col justify-center">
      <div className="text-xs text-gray-500"><Link href="/">Home</Link> / <Link href="/collections/all">Products</Link> / {p.nameEn}</div>

      <div className="mt-3 grid items-center gap-6 md:grid-cols-2">
        <div className="flex gap-3">
          <div className="flex w-16 shrink-0 flex-col gap-2 sm:w-20">
            {gallery.map((g, k) => (
              <button key={k} onClick={() => setImg(k)} className={`overflow-hidden rounded-lg border-2 bg-white ${k === img ? "border-brand-600" : "border-gray-200"}`}>
                {imgUrl(g) ? (
                  <img src={imgUrl(g)!} alt="" className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-brand-50 text-2xl font-extrabold text-brand-600">{p.nameEn.charAt(0)}</div>
                )}
              </button>
            ))}
          </div>
          <div className="min-w-0 flex-1 self-stretch overflow-hidden rounded-2xl border bg-white">
            {imgUrl(gallery[img]) ? (
              <img src={imgUrl(gallery[img])!} alt={p.nameEn} className="h-full max-h-[calc(100svh-260px)] min-h-80 w-full object-cover" />
            ) : (
              <div className="flex h-full max-h-[calc(100svh-260px)] min-h-80 items-center justify-center bg-brand-50 text-7xl font-extrabold text-brand-600">{p.nameEn.charAt(0)}</div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-5 py-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {p.badges.map((b) => <Badge key={b} label={b} />)}
            {off > 0 && <DiscountBadge text={`Save ${off}%`} />}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">{p.nameEn}</h1>
            {p.nameBn && <div className="mt-1 text-gray-600">{p.nameBn}</div>}
            <div className="mt-2 text-sm text-gray-500">★★★★★ <span className="font-semibold text-gray-700">5.0</span> · Brand: Organika</div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-brand-700">{v && formatBDT(v.price)}</span>
            {v?.comparePrice && <span className="text-base text-gray-400 line-through">{formatBDT(v.comparePrice)}</span>}
          </div>
          <p className="text-sm leading-relaxed text-gray-600">{p.description ?? "Pure organic product from trusted Bangladeshi farms."}</p>

          {p.variants.length > 1 && (
            <div>
              <div className="text-sm font-semibold">Size</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.variants.map((vv, k) => (
                  <button key={vv.id} onClick={() => setVi(k)} className={`rounded-full border px-4 py-1.5 text-sm ${k === vi ? "border-brand-600 bg-brand-50 font-semibold" : ""}`}>
                    {vv.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Quantity:</span>
            <div className="flex items-center rounded-full border">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-1.5 text-lg">-</button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty(Math.min(99, qty + 1))} className="px-3 py-1.5 text-lg">+</button>
            </div>
            <span className="text-xs text-gray-500">{v?.stock} in stock</span>
          </div>

          <div className="flex gap-2 text-sm sm:text-base">
            {v && <button onClick={() => add(p, v, qty)} className="flex-1 rounded-full bg-brand-600 py-3 font-semibold text-white">Add to Cart</button>}
            {v && <Link href={`/checkout?buy=${v.id}&qty=${qty}`} className="flex-1 rounded-full border-2 border-brand-600 py-3 text-center font-semibold text-brand-700">Buy Now</Link>}
          </div>
          <div className="flex gap-2 text-sm sm:text-base">
            <a href="https://wa.me/8801XXXXXXXXX" className="flex-1 rounded-full border border-green-500 py-3 text-center font-semibold text-green-700">Order on WhatsApp</a>
            <a href="tel:09611000000" className="flex-1 rounded-full border border-gray-300 py-3 text-center font-semibold">Call for order</a>
          </div>
        </div>
      </div>
      </section>

      <div className="mt-8 rounded-xl border bg-white p-2">
        <div className="flex gap-2">
          <button onClick={() => setTab("desc")} className={`rounded-lg px-5 py-2.5 text-sm font-bold ${tab === "desc" ? "bg-brand-600 text-white" : "bg-[#f3e7d3] text-gray-600"}`}>Description</button>
          <button onClick={() => setTab("rev")} className={`rounded-lg px-5 py-2.5 text-sm font-bold ${tab === "rev" ? "bg-brand-600 text-white" : "bg-[#f3e7d3] text-gray-600"}`}>Customer Reviews (0)</button>
        </div>
      </div>
      <div className="mt-4 rounded-xl border bg-white p-5">
      {tab === "desc" ? (
        <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="font-bold">Product Details</h3>
          <div className="mt-1 h-1 w-12 rounded-full bg-brand-600" />
            <p className="mt-2 text-sm text-gray-600">{p.description ?? "Pure organic product from trusted Bangladeshi farms."}</p>
            <h3 className="mt-4 font-bold">Key Features</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
              <li>100% Natural & chemical-free, no preservatives</li>
              <li>Hygienically packed, farm-direct sourcing</li>
              <li>Lab-checked quality you can trust</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold">Delivery & Return</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
              <li>Inside Dhaka ৳60 · Outside Dhaka ৳130 · Free over ৳2,000 (Dhaka)</li>
              <li>Cash on Delivery available all over Bangladesh</li>
              <li>Happy Return within 7 days of delivery</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="text-5xl font-extrabold">0.0</div>
              <div>
                <div className="font-semibold">Average Rating</div>
                <div className="text-sm text-gray-400">☆☆☆☆☆ <span className="text-xs">(0 Reviews)</span></div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="text-2xl font-extrabold">0%</div>
              <div className="text-sm text-gray-500">Recommended</div>
            </div>
            <div className="mt-3 space-y-1.5">
              {[5, 4, 3, 2, 1].map((s) => (
                <div key={s} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-8 shrink-0">{s} ★</span>
                  <div className="h-2 flex-1 rounded-full bg-gray-200">
                    <div className="h-2 rounded-full bg-accent-500" style={{ width: "0%" }} />
                  </div>
                  <span className="w-8 shrink-0 text-right">0%</span>
                </div>
              ))}
            </div>
          </div>
          <form className="rounded-xl border bg-white p-4" onSubmit={(e) => { e.preventDefault(); setPhotos([]); setRevMsg("Thanks! Your review was submitted."); }}>
            <h3 className="font-bold">Submit Your Review</h3>
            <input required placeholder="Your name" className="mt-2 w-full rounded border px-3 py-2 text-sm" />
            <Select value={rating} onValueChange={setRating}>
              <SelectTrigger className="mt-2 w-full rounded border bg-white px-3 py-2 text-sm shadow-none">
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Perfect (5)</SelectItem>
                <SelectItem value="4">Good (4)</SelectItem>
                <SelectItem value="3">Average (3)</SelectItem>
                <SelectItem value="2">Not that bad (2)</SelectItem>
                <SelectItem value="1">Very poor (1)</SelectItem>
              </SelectContent>
            </Select>
            <textarea required placeholder="Write your opinion about the product" className="mt-2 w-full rounded border px-3 py-2 text-sm" rows={3} />
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) addPhotos(Array.from(e.dataTransfer.files)); }}
              onClick={() => document.getElementById("rev-photos")?.click()}
              className="mt-2 cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-500"
            >
              Drag & Drop Images Here<br />or click to browse files (3 max)
              <input
                id="rev-photos" type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => { if (e.target.files?.length) addPhotos(Array.from(e.target.files)); e.target.value = ""; }}
              />
            </div>
            {photos.length > 0 && (
              <div className="mt-2 flex gap-2">
                {photos.map((url, k) => (
                  <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setPhotos(photos.filter((_, x) => x !== k))} className="absolute right-0.5 top-0.5 rounded-full bg-black/60 px-1.5 text-xs text-white">×</button>
                  </div>
                ))}
              </div>
            )}
            <button className="mt-2 rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white">Submit Review</button>
            {revMsg && <p className="mt-2 text-sm text-brand-700">{revMsg}</p>}
          </form>
        </div>
      )}
      </div>

      {related.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-bold sm:text-xl">Related Products</h2>
          <SlideRow>
            {related.map((r) => (
              <div key={r.id} className="w-60 shrink-0 snap-start sm:w-72">
                <GBCard p={r} />
              </div>
            ))}
          </SlideRow>
        </section>
      )}
      <div className="pb-4" />
    </main>
  );
}
