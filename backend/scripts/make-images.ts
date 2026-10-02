import sharp from "sharp";
import path from "path";
import fs from "fs";

const OUT = path.join(__dirname, "..", "uploads", "images");

const COLORS: Record<string, string> = {
  honey: "#d99a00", gur: "#8a4b00", oil: "#5c7a00", ghee: "#e0a800",
  spice: "#b33c00", rice: "#7a9e43", lentil: "#c77b00", nut: "#7a4a21",
  tea: "#2f7a3d", default: "#1a7a36",
};

export function themeFor(name: string) {
  const n = name.toLowerCase();
  if (n.includes("honey")) return COLORS.honey;
  if (n.includes("gur")) return COLORS.gur;
  if (n.includes("oil") || n.includes("ghee")) return COLORS.oil;
  if (n.includes("turmeric") || n.includes("chili") || n.includes("cumin") || n.includes("coriander")) return COLORS.spice;
  if (n.includes("rice")) return COLORS.rice;
  if (n.includes("lentil") || n.includes("chickpea")) return COLORS.lentil;
  if (n.includes("peanut") || n.includes("almond") || n.includes("cashew") || n.includes("raisin") || n.includes("seed")) return COLORS.nut;
  if (n.includes("tea")) return COLORS.tea;
  return COLORS.default;
}

export async function makeImage(slug: string, title: string, accent: string) {
  const out = path.join(OUT, `${slug}.jpg`);
  if (fs.existsSync(out)) return; // never overwrite real photos
  const short = title.length > 22 ? title.slice(0, 22) : title;
  const svg = `
  <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="800" fill="#faf6ef"/>
    <circle cx="400" cy="330" r="215" fill="${accent}" opacity="0.16"/>
    <circle cx="400" cy="330" r="150" fill="${accent}"/>
    <circle cx="400" cy="330" r="150" fill="none" stroke="#ffffff" stroke-width="10" opacity="0.85"/>
    <text x="400" y="372" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="#ffffff" text-anchor="middle">${title.charAt(0)}</text>
    <rect x="0" y="560" width="800" height="240" fill="#ffffff"/>
    <rect x="0" y="560" width="800" height="10" fill="${accent}"/>
    <text x="400" y="640" font-family="Arial, sans-serif" font-size="44" font-weight="bold" fill="#1c1c1c" text-anchor="middle">${short}</text>
    <text x="400" y="700" font-family="Arial, sans-serif" font-size="28" fill="#6b6b6b" text-anchor="middle">ORGANIKA • 100% ORGANIC</text>
  </svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(path.join(OUT, `${slug}.jpg`));
}

// Extra gallery views derived from the main photo: detail zoom + smart crop
export async function makeGalleryViews(slug: string) {
  const src = path.join(OUT, `${slug}.jpg`);
  if (!fs.existsSync(src)) return;
  const meta = await sharp(src).metadata();
  const w = meta.width ?? 800;
  const h = meta.height ?? 800;
  const side = Math.floor(Math.min(w, h) * 0.62);
  await sharp(src)
    .extract({ left: Math.floor((w - side) / 2), top: Math.floor((h - side) / 2), width: side, height: side })
    .resize(800, 800)
    .jpeg({ quality: 82 })
    .toFile(path.join(OUT, `${slug}-2.jpg`));
  await sharp(src)
    .resize(800, 800, { fit: "cover", position: "entropy" })
    .jpeg({ quality: 82 })
    .toFile(path.join(OUT, `${slug}-3.jpg`));
}

if (require.main === module) {
  (async () => {
    await makeImage("test-honey", "Sundarban Wild Honey", themeFor("honey"));
    console.log("test image ok");
  })();
}
