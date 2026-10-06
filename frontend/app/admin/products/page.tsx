"use client";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus } from "lucide-react";
import { AdminGate, api, API } from "../../../components/admin";
import { Page, PageHeader, EmptyState, StatCards } from "../../../components/admin/page";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { DataTable, SortableHeader } from "../../../components/ui/data-table";
import { Skeleton } from "../../../components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Switch } from "../../../components/ui/switch";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { toast } from "../../../components/ui/sonner";
import { formatBDT } from "../../../lib/shop";
import { imgUrl } from "../../../components/home";

type Product = any;

const emptyForm = { nameEn: "", nameBn: "", slug: "", categoryId: "", brandId: "", description: "", badges: "", images: "", isActive: true };

export default function AdminProducts() {
  const [items, setItems] = useState<Product[] | null>(null);
  const [cats, setCats] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [dialog, setDialog] = useState<null | { mode: "create" } | { mode: "edit"; p: Product }>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [variantsFor, setVariantsFor] = useState<Product | null>(null);
  const [del, setDel] = useState<Product | null>(null);

  const load = () => {
    api("/admin/products").then(setItems).catch(() => { setItems([]); toast.error("Failed to load products"); });
  };
  useEffect(() => {
    load();
    fetch(`${API}/categories`).then((r) => r.json()).then(setCats).catch(() => {});
    fetch(`${API}/brands`).then((r) => r.json()).then(setBrands).catch(() => {});
  }, []);

  const openCreate = () => { setForm(emptyForm); setDialog({ mode: "create" }); };
  const openEdit = (p: Product) => {
    setForm({
      nameEn: p.nameEn ?? "", nameBn: p.nameBn ?? "", slug: p.slug ?? "",
      categoryId: p.categoryId ?? "", brandId: p.brandId ?? "",
      description: p.description ?? "", badges: (p.badges ?? []).join(", "),
      images: (p.images ?? []).join(", "), isActive: p.isActive ?? true,
    });
    setDialog({ mode: "edit", p });
  };

  const save = async () => {
    if (!form.nameEn.trim()) return toast.error("Name (English) is required");
    setSaving(true);
    try {
      const payload: any = {
        nameEn: form.nameEn.trim(),
        nameBn: form.nameBn.trim() || null,
        description: form.description.trim() || null,
        badges: form.badges.split(",").map((s) => s.trim()).filter(Boolean),
        images: form.images.split(",").map((s) => s.trim()).filter(Boolean),
        isActive: form.isActive,
      };
      if (form.slug.trim()) payload.slug = form.slug.trim();
      if (form.categoryId && form.categoryId !== "none") payload.categoryId = form.categoryId;
      if (form.brandId && form.brandId !== "none") payload.brandId = form.brandId;
      if (dialog?.mode === "create") {
        await api("/admin/products", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Product created");
      } else if (dialog?.mode === "edit") {
        await api(`/admin/products/${dialog.p.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Product updated");
      }
      setDialog(null);
      load();
    } catch { toast.error("Save failed"); }
    setSaving(false);
  };

  const toggleActive = async (p: Product) => {
    try {
      await api(`/admin/products/${p.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !p.isActive }) });
      toast.success(p.isActive ? "Product hidden" : "Product published");
      load();
    } catch { toast.error("Update failed"); }
  };

  const remove = async () => {
    if (!del) return;
    try {
      await api(`/admin/products/${del.id}`, { method: "DELETE" });
      toast.success("Product deleted");
      setDel(null);
      load();
    } catch { toast.error("Delete failed — product may have orders"); }
  };

  const rows = useMemo(() => (items ?? []).map((p) => ({ ...p, _low: (p.variants ?? []).reduce((a: number, v: any) => Math.min(a, v.stock ?? 99), 99) })), [items]);

  const stats = useMemo(() => {
    if (!items) return [];
    const live = items.filter((p) => p.isActive);
    const variants = items.flatMap((p) => p.variants ?? []);
    const low = variants.filter((v: any) => (v.stock ?? 0) <= 5).length;
    const stock = variants.reduce((a: number, v: any) => a + (v.stock ?? 0), 0);
    return [
      { label: "Total products", value: String(items.length), hint: `${variants.length} variants` },
      { label: "Live on store", value: String(live.length), hint: `${items.length - live.length} hidden` },
      { label: "Low-stock variants", value: String(low), hint: "≤ 5 units left" },
      { label: "Units in stock", value: stock.toLocaleString() },
    ];
  }, [items]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "nameEn",
      header: ({ column }) => <SortableHeader title="Product" column={column} />,
      cell: ({ row }) => {
        const p = row.original;
        const url = imgUrl(p.images?.[0]);
        return (
          <span className="flex items-center gap-2">
            {url ? <img src={url} alt="" className="h-9 w-9 rounded object-cover" /> : (
              <span className="flex h-9 w-9 items-center justify-center rounded bg-muted font-bold">{p.nameEn?.charAt(0)}</span>
            )}
            <span>
              <span className="block font-medium">{p.nameEn}</span>
              <span className="block text-xs text-muted-foreground">{p.category?.name ?? p.categoryId ?? "—"} · {(p.variants ?? []).length} variants</span>
            </span>
          </span>
        );
      },
    },
    {
      accessorKey: "price",
      header: "From",
      cell: ({ row }) => {
        const vs = row.original.variants ?? [];
        const min = vs.length ? Math.min(...vs.map((v: any) => v.price)) : 0;
        return <span className="font-semibold">{formatBDT(min)}</span>;
      },
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const vs = row.original.variants ?? [];
        const total = vs.reduce((a: number, v: any) => a + (v.stock ?? 0), 0);
        const low = vs.some((v: any) => (v.stock ?? 0) <= 5);
        return low ? <Badge variant="destructive">{total} ⚠</Badge> : <span className="font-semibold">{total}</span>;
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => row.original.isActive ? <Badge>Live</Badge> : <Badge variant="secondary">Hidden</Badge>,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(p)}>Edit details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setVariantsFor(p)}>Manage variants ({(p.variants ?? []).length})</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleActive(p)}>{p.isActive ? "Hide from store" : "Publish to store"}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDel(p)} className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <AdminGate>
      <Page>
        <PageHeader
          title="Products"
          sub={`${items?.length ?? "…"} products · click ⋯ for variants, publish, delete`}
          actions={<Button onClick={openCreate}><Plus /> Add product</Button>}
        />
        {!items ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : (
          <StatCards stats={stats} />
        )}
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="p-0">
            {!items ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            : items.length === 0 ? <EmptyState title="No products yet" hint="Click Add product to create your first one." />
            : <DataTable columns={columns} data={rows} searchKey="nameEn" searchPlaceholder="Search products…" pageSize={12} />}
          </CardContent>
        </Card>

        {/* Create / edit dialog */}
        <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{dialog?.mode === "create" ? "Add product" : "Edit product"}</DialogTitle>
              <DialogDescription>Details shown on the storefront. Variants are managed separately.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Name (English) *</Label><Input value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} placeholder="Sundarban Wild Honey 500g" /></div>
              <div className="space-y-1.5"><Label>Name (Bangla)</Label><Input value={form.nameBn} onChange={(e) => set("nameBn", e.target.value)} placeholder="সুন্দরবনের খাঁটি মধু" /></div>
              <div className="space-y-1.5"><Label>Slug (auto if empty)</Label><Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="sundarban-wild-honey-500g" /></div>
              <div className="space-y-1.5"><Label>Badges (comma separated)</Label><Input value={form.badges} onChange={(e) => set("badges", e.target.value)} placeholder="Best Selling, Offer" /></div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.categoryId || "none"} onValueChange={(v) => set("categoryId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Brand</Label>
                <Select value={form.brandId || "none"} onValueChange={(v) => set("brandId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No brand</SelectItem>
                    {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Pure organic product from trusted farms…" /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Images (comma separated URLs or /uploads/… paths)</Label><Textarea value={form.images} onChange={(e) => set("images", e.target.value)} placeholder="/uploads/images/honey.jpg, …" /></div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
                <Label>Visible on storefront</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : dialog?.mode === "create" ? "Create" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <Dialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete “{del?.nameEn}”?</DialogTitle>
              <DialogDescription>This removes the product and its variants. Orders referencing it keep their snapshots.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDel(null)}>Cancel</Button>
              <Button variant="destructive" onClick={remove}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {variantsFor && <VariantManager p={variantsFor} onClose={() => { setVariantsFor(null); load(); }} />}
      </Page>
    </AdminGate>
  );
}

function VariantManager({ p, onClose }: { p: Product; onClose: () => void }) {
  const [vs, setVs] = useState<any[]>(p.variants ?? []);
  const [draft, setDraft] = useState({ label: "", sku: "", price: "", comparePrice: "", stock: "20", weightGrams: "" });
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const list: any[] = await api("/admin/products");
    const found = list.find((x) => x.id === p.id);
    if (found) setVs(found.variants ?? []);
  };

  const toPaisa = (n: any) => {
    const num = Number(n);
    if (!num) return 0;
    return num < 10000 ? Math.round(num * 100) : Math.round(num); // taka → paisa heuristic
  };

  const add = async () => {
    if (!draft.label.trim() || !draft.sku.trim() || !draft.price) return toast.error("Label, SKU and price are required");
    setBusy(true);
    try {
      await api(`/admin/products/${p.id}/variants`, { method: "POST", body: JSON.stringify({
        label: draft.label.trim(), sku: draft.sku.trim(),
        price: toPaisa(draft.price),
        comparePrice: draft.comparePrice ? toPaisa(draft.comparePrice) : null,
        stock: Number(draft.stock ?? 0),
        weightGrams: draft.weightGrams ? Number(draft.weightGrams) : null,
      }) });
      toast.success("Variant added");
      setDraft({ label: "", sku: "", price: "", comparePrice: "", stock: "20", weightGrams: "" });
      refresh();
    } catch { toast.error("Add failed — SKU must be unique"); }
    setBusy(false);
  };

  const saveRow = async (v: any) => {
    try {
      await api(`/admin/variants/${v.id}`, { method: "PATCH", body: JSON.stringify({ label: v.label, sku: v.sku, price: Number(v.price), comparePrice: v.comparePrice ? Number(v.comparePrice) : null, stock: Number(v.stock), weightGrams: v.weightGrams ? Number(v.weightGrams) : null }) });
      toast.success("Variant saved");
      refresh();
    } catch { toast.error("Save failed"); }
  };

  const adj = async (v: any, delta: number) => {
    try {
      await api(`/admin/variants/${v.id}/stock`, { method: "PATCH", body: JSON.stringify({ delta }) });
      refresh();
    } catch { toast.error("Stock update failed"); }
  };

  const del = async (v: any) => {
    if (!confirm(`Delete variant ${v.label}?`)) return;
    try { await api(`/admin/variants/${v.id}`, { method: "DELETE" }); toast.success("Variant deleted"); refresh(); }
    catch { toast.error("Delete failed"); }
  };

  const edit = (id: string, k: string, val: any) => setVs((arr) => arr.map((v) => (v.id === id ? { ...v, [k]: val } : v)));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Variants — {p.nameEn}</DialogTitle>
          <DialogDescription>Existing rows show prices in paisa (55000 = ৳550). The add-form below accepts taka.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {vs.map((v) => (
            <div key={v.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
              <Input className="w-20" value={v.label} onChange={(e) => edit(v.id, "label", e.target.value)} title="Label" />
              <Input className="w-28" value={v.sku} onChange={(e) => edit(v.id, "sku", e.target.value)} title="SKU" />
              <Input className="w-24" type="number" value={v.price} onChange={(e) => edit(v.id, "price", e.target.value)} title="Price (paisa)" />
              <Input className="w-20" type="number" value={v.stock} onChange={(e) => edit(v.id, "stock", e.target.value)} title="Stock" />
              <Button size="sm" variant="outline" onClick={() => adj(v, 10)}>+10</Button>
              <Button size="sm" variant="outline" onClick={() => adj(v, -1)}>-1</Button>
              <Button size="sm" onClick={() => saveRow(v)}>Save</Button>
              <Button size="sm" variant="destructive" onClick={() => del(v)}>Del</Button>
            </div>
          ))}
          {vs.length === 0 && <p className="text-sm text-muted-foreground">No variants yet — add one below.</p>}
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="mb-2 text-sm font-semibold">Add variant</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Input placeholder="Label (500g)" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
            <Input placeholder="SKU" value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
            <Input placeholder="Price (taka)" type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
            <Input placeholder="Compare price" type="number" value={draft.comparePrice} onChange={(e) => setDraft({ ...draft, comparePrice: e.target.value })} />
            <Input placeholder="Stock" type="number" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} />
            <Input placeholder="Weight (g)" type="number" value={draft.weightGrams} onChange={(e) => setDraft({ ...draft, weightGrams: e.target.value })} />
          </div>
          <Button className="mt-2" size="sm" onClick={add} disabled={busy}>{busy ? "Adding…" : "Add variant"}</Button>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
