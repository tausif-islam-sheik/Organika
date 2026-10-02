// Fetch REAL product photos from Wikimedia Commons into uploads/images/.
// Falls back to generated label image when a query finds nothing usable.
import path from "path";
import fs from "fs";

const OUT = path.join(__dirname, "..", "uploads", "images");

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\u0980-\u09FF]+/g, "-").replace(/^-+|-+$/g, "");

const TARGETS: { name: string; q: string }[] = [
  { name: "Sundarban Wild Honey", q: "honey jar" },
  { name: "Sidr Honey", q: "honeycomb" },
  { name: "Black Seed Honey", q: "honey dipper" },
  { name: "Mustard Flower Honey", q: "mustard flowers field" },
  { name: "Khejur Gur", q: "jaggery" },
  { name: "Akher Gur", q: "sugarcane jaggery" },
  { name: "Mustard Oil", q: "mustard oil bottle" },
  { name: "Pure Cow Ghee", q: "ghee bowl" },
  { name: "Turmeric Powder", q: "turmeric powder" },
  { name: "Chili Powder", q: "chili powder" },
  { name: "Cumin Powder", q: "cumin seeds" },
  { name: "Coriander Powder", q: "coriander powder" },
  { name: "Chinigura Rice", q: "rice grains bowl" },
  { name: "Kalijira Rice", q: "rice paddy field" },
  { name: "Masoor Lentil", q: "red lentils" },
  { name: "Moong Lentil", q: "mung beans" },
  { name: "Chickpeas", q: "chickpeas bowl" },
  { name: "Peanuts", q: "peanuts" },
  { name: "Almonds", q: "shelled almonds white background" },
  { name: "Cashews", q: "cashew nuts white background" },
  { name: "Raisins", q: "raisins" },
  { name: "Black Seeds", q: "black cumin seeds" },
  { name: "Green Tea", q: "green tea cup" },
  { name: "Puffed Rice", q: "puffed rice" },
  { name: "Flattened Rice", q: "flattened rice poha" },
];

async function findUrl(q: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${q} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "5",
    prop: "imageinfo",
    iiprop: "url|size",
    iiurlwidth: "800",
    format: "json",
  });
  const r = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": "OrganikaSeed/1.0 (local dev)" },
  });
  const j: any = await r.json();
  const pages = Object.values((j?.query?.pages ?? {}) as any) as any[];
  for (const p of pages) {
    const info = p?.imageinfo?.[0];
    const url = info?.thumburl ?? info?.url;
    if (url && (info?.width ?? 800) >= 400) return url;
  }
  return null;
}

async function main() {
  const only = process.argv.slice(2).map((a) => a.toLowerCase());
  const list = only.length ? TARGETS.filter((t) => only.some((o) => slugify(t.name).includes(o))) : TARGETS;
  let ok = 0;
  for (const t of list) {
    const slug = slugify(t.name);
    try {
      const url = await findUrl(t.q);
      if (!url) {
        console.log(`SKIP ${slug} (no result, keeping generated)`);
        continue;
      }
      const img = await fetch(url, { headers: { "User-Agent": "OrganikaSeed/1.0 (local dev)" } });
      const buf = Buffer.from(await img.arrayBuffer());
      if (buf.length < 8000) {
        console.log(`SKIP ${slug} (too small, keeping generated)`);
        continue;
      }
      fs.writeFileSync(path.join(OUT, `${slug}.jpg`), buf);
      ok++;
      console.log(`OK ${slug} (${Math.round(buf.length / 1024)}KB)`);
    } catch (e: any) {
      console.log(`SKIP ${slug} (${e.message}, keeping generated)`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.log(`done: ${ok}/${TARGETS.length} real photos`);
}

main();
