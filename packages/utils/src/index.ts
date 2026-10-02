// Money stored as paisa Int — never floats.
export const toPaisa = (bdt: number) => Math.round(bdt * 100);
export const fromPaisa = (paisa: number) => paisa / 100;
export const formatBDT = (paisa: number) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
  })
    .format(fromPaisa(paisa))
    .replace("BDT", "৳")
    .trim();

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\u0980-\u09FF]+/g, "-").replace(/^-+|-+$/g, "");

export const isBdPhone = (p: string) => /^01[3-9]\d{8}$/.test(p);
