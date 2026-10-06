"use client";
import { useEffect, useState } from "react";
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
import { toast } from "../../../components/ui/sonner";

const emptyForm = { name: "", slug: "", logo: "", isActive: true };

export default function AdminBrands() {
  const [items, setItems] = useState<any[] | null>(null);
  const [dialog, setDialog] = useState<null | { mode: "create" } | { mode: "edit"; b: any }>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<any | null>(null);

  const load = () => fetch(`${API}/brands`).then((r) => r.json()).then(setItems).catch(() => { setItems([]); toast.error("Failed to load brands"); });
  useEffect(() => { load(); }, []);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const openCreate = () => { setForm(emptyForm); setDialog({ mode: "create" }); };
  const openEdit = (b: any) => {
    setForm({ name: b.name ?? "", slug: b.slug ?? "", logo: b.logo ?? "", isActive: b.isActive ?? true });
    setDialog({ mode: "edit", b });
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), slug: form.slug.trim() || undefined, logo: form.logo.trim() || null, isActive: form.isActive };
      if (dialog?.mode === "create") { await api("/admin/brands", { method: "POST", body: JSON.stringify(payload) }); toast.success("Brand created"); }
      else if (dialog?.mode === "edit") { await api(`/admin/brands/${dialog.b.id}`, { method: "PATCH", body: JSON.stringify(payload) }); toast.success("Brand updated"); }
      setDialog(null);
      load();
    } catch { toast.error("Save failed — slug must be unique"); }
    setSaving(false);
  };

  const remove = async () => {
    if (!del) return;
    try { await api(`/admin/brands/${del.id}`, { method: "DELETE" }); toast.success("Brand deleted"); setDel(null); load(); }
    catch { toast.error("Delete failed — products may use this brand"); }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader title="Brand" column={column} />,
      cell: ({ row }) => {
        const b = row.original;
        return (
          <span className="flex items-center gap-2">
            {b.logo ? <img src={b.logo} alt="" className="h-8 w-8 rounded object-contain" /> : (
              <span className="flex h-8 w-8 items-center justify-center rounded bg-muted font-bold">{b.name?.charAt(0)}</span>
            )}
            <span className="font-medium">{b.name}</span>
          </span>
        );
      },
    },
    { accessorKey: "slug", header: "Slug", cell: ({ row }) => <span className="text-sm text-muted-foreground">/{row.original.slug}</span> },
    { accessorKey: "isActive", header: "Status", cell: ({ row }) => row.original.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge> },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => {
        const b = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(b)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDel(b)} className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <AdminGate>
      <Page>
        <PageHeader title="Brands" sub="Attach brands to products" actions={<Button onClick={openCreate}><Plus /> Add brand</Button>} />
        {!items ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : (
          <StatCards
            stats={[
              { label: "Total brands", value: String(items.length) },
              { label: "Active", value: String(items.filter((b) => b.isActive).length), hint: "Usable on products" },
              { label: "Inactive", value: String(items.filter((b) => !b.isActive).length) },
            ]}
          />
        )}
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="p-0">
            {!items ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            : items.length === 0 ? <EmptyState title="No brands" hint="Add your first brand." />
            : <DataTable columns={columns} data={items} searchKey="name" searchPlaceholder="Search brands…" />}
          </CardContent>
        </Card>

        <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialog?.mode === "create" ? "Add brand" : "Edit brand"}</DialogTitle>
              <DialogDescription>Brands group products (e.g. Organika).</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Organika" /></div>
              <div className="space-y-1.5"><Label>Slug (auto if empty)</Label><Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="organika" /></div>
              <div className="space-y-1.5"><Label>Logo URL</Label><Input value={form.logo} onChange={(e) => set("logo", e.target.value)} placeholder="https://… or /uploads/…" /></div>
              <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} /><Label>Active</Label></div>
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
              <DialogDescription>Brands with products cannot be deleted.</DialogDescription>
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
