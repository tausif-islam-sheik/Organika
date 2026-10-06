"use client";
import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, MoreHorizontal, Plus } from "lucide-react";
import { AdminGate, api, API } from "../../../components/admin";
import { Page, PageHeader, EmptyState, StatCards } from "../../../components/admin/page";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { DataTable, SortableHeader } from "../../../components/ui/data-table";
import { Skeleton } from "../../../components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { toast } from "../../../components/ui/sonner";
import { imgUrl } from "../../../components/home";

const emptyForm = { name: "", nameBn: "", slug: "", image: "", sortOrder: "0" };

export default function AdminCategories() {
  const [items, setItems] = useState<any[] | null>(null);
  const [dialog, setDialog] = useState<null | { mode: "create" } | { mode: "edit"; c: any }>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<any | null>(null);

  const load = () => fetch(`${API}/categories`).then((r) => r.json()).then(setItems).catch(() => { setItems([]); toast.error("Failed to load categories"); });
  useEffect(() => { load(); }, []);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const openCreate = () => { setForm(emptyForm); setDialog({ mode: "create" }); };
  const openEdit = (c: any) => {
    setForm({ name: c.name ?? "", nameBn: c.nameBn ?? "", slug: c.slug ?? "", image: c.image ?? "", sortOrder: String(c.sortOrder ?? 0) });
    setDialog({ mode: "edit", c });
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), nameBn: form.nameBn.trim() || null, slug: form.slug.trim() || undefined, image: form.image.trim() || null, sortOrder: Number(form.sortOrder ?? 0) };
      if (dialog?.mode === "create") { await api("/admin/categories", { method: "POST", body: JSON.stringify(payload) }); toast.success("Category created"); }
      else if (dialog?.mode === "edit") { await api(`/admin/categories/${dialog.c.id}`, { method: "PATCH", body: JSON.stringify(payload) }); toast.success("Category updated"); }
      setDialog(null);
      load();
    } catch { toast.error("Save failed — slug must be unique"); }
    setSaving(false);
  };

  const remove = async () => {
    if (!del) return;
    try { await api(`/admin/categories/${del.id}`, { method: "DELETE" }); toast.success("Category deleted"); setDel(null); load(); }
    catch { toast.error("Delete failed — move its products first"); }
  };

  const move = async (c: any, dir: -1 | 1) => {
    const sorted = [...(items ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const i = sorted.findIndex((x) => x.id === c.id);
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    const a = sorted[i], b = sorted[j];
    try {
      await api("/admin/categories/reorder", { method: "POST", body: JSON.stringify({ items: [{ id: a.id, sortOrder: b.sortOrder ?? 0 }, { id: b.id, sortOrder: a.sortOrder ?? 0 }] }) });
      load();
    } catch { toast.error("Reorder failed"); }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader title="Category" column={column} />,
      cell: ({ row }) => {
        const c = row.original;
        const url = imgUrl(c.image);
        return (
          <span className="flex items-center gap-2">
            {url ? <img src={url} alt="" className="h-9 w-9 rounded object-cover" /> : (
              <span className="flex h-9 w-9 items-center justify-center rounded bg-muted font-bold">{c.name?.charAt(0)}</span>
            )}
            <span>
              <span className="block font-medium">{c.name}</span>
              <span className="block text-xs text-muted-foreground">{c.nameBn ?? ""} · /{c.slug}</span>
            </span>
          </span>
        );
      },
    },
    { accessorKey: "sortOrder", header: ({ column }) => <SortableHeader title="Order" column={column} />, cell: ({ row }) => <span className="font-semibold">{row.original.sortOrder}</span> },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => {
        const c = row.original;
        return (
          <span className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => move(c, -1)} title="Move up"><ArrowUp className="size-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => move(c, 1)} title="Move down"><ArrowDown className="size-4" /></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEdit(c)}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDel(c)} className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        );
      },
    },
  ];

  return (
    <AdminGate>
      <Page>
        <PageHeader title="Categories" sub="Storefront nav + homepage circles read from here" actions={<Button onClick={openCreate}><Plus /> Add category</Button>} />
        {!items ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : (
          <StatCards
            stats={[
              { label: "Total categories", value: String(items.length) },
              { label: "With image", value: String(items.filter((c) => c.image).length), hint: "Shown as circles on homepage" },
              { label: "With Bangla name", value: String(items.filter((c) => c.nameBn).length) },
              { label: "In storefront nav", value: String(items.length), hint: "Header + footer menus" },
            ]}
          />
        )}
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="p-0">
            {!items ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            : items.length === 0 ? <EmptyState title="No categories" hint="Add your first category." />
            : <DataTable columns={columns} data={[...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))} searchKey="name" searchPlaceholder="Search categories…" />}
          </CardContent>
        </Card>

        <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialog?.mode === "create" ? "Add category" : "Edit category"}</DialogTitle>
              <DialogDescription>Slug is used in URLs (/collections/slug).</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Honey" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Name (Bangla)</Label><Input value={form.nameBn} onChange={(e) => set("nameBn", e.target.value)} placeholder="মধু" /></div>
                <div className="space-y-1.5"><Label>Sort order</Label><Input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></div>
              </div>
              <div className="space-y-1.5"><Label>Slug (auto if empty)</Label><Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="honey" /></div>
              <div className="space-y-1.5"><Label>Image (URL or /uploads/… path)</Label><Textarea value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="/uploads/images/honey.jpg" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete “{del?.name}”?</DialogTitle>
              <DialogDescription>Only empty categories can be deleted.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDel(null)}>Cancel</Button>
              <Button variant="destructive" onClick={remove}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Page>
    </AdminGate>
  );
}
