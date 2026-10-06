"use client";
import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus } from "lucide-react";
import { AdminGate, api } from "../../../components/admin";
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
import { formatBDT } from "../../../lib/shop";

const emptyForm = { name: "", charge: "", freeOver: "", sortOrder: "0", isActive: true };

export default function AdminDelivery() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [dialog, setDialog] = useState<null | { mode: "create" } | { mode: "edit"; z: any }>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<any | null>(null);

  const load = () => api("/admin/delivery-zones").then(setRows).catch(() => { setRows([]); toast.error("Failed to load zones"); });
  useEffect(() => { load(); }, []);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const openCreate = () => { setForm(emptyForm); setDialog({ mode: "create" }); };
  const openEdit = (z: any) => {
    setForm({
      name: z.name ?? "", charge: String(Math.round((z.charge ?? 0) / 100)),
      freeOver: z.freeOver ? String(Math.round(z.freeOver / 100)) : "",
      sortOrder: String(z.sortOrder ?? 0), isActive: z.isActive ?? true,
    });
    setDialog({ mode: "edit", z });
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        charge: Math.round(Number(form.charge || 0) * 100),
        freeOver: form.freeOver ? Math.round(Number(form.freeOver) * 100) : null,
        sortOrder: Number(form.sortOrder ?? 0),
        isActive: form.isActive,
      };
      if (dialog?.mode === "create") { await api("/admin/delivery-zones", { method: "POST", body: JSON.stringify(payload) }); toast.success("Zone created"); }
      else if (dialog?.mode === "edit") { await api(`/admin/delivery-zones/${dialog.z.id}`, { method: "PATCH", body: JSON.stringify(payload) }); toast.success("Zone updated"); }
      setDialog(null);
      load();
    } catch { toast.error("Save failed — name must be unique"); }
    setSaving(false);
  };

  const remove = async () => {
    if (!del) return;
    try { await api(`/admin/delivery-zones/${del.id}`, { method: "DELETE" }); toast.success("Zone deleted"); setDel(null); load(); }
    catch { toast.error("Delete failed"); }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader title="Zone" column={column} />,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    { accessorKey: "charge", header: "Charge", cell: ({ row }) => <span className="font-semibold">{formatBDT(row.original.charge)}</span> },
    {
      accessorKey: "freeOver", header: "Free over",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.freeOver ? formatBDT(row.original.freeOver) : "—"}</span>,
    },
    { accessorKey: "isActive", header: "Status", cell: ({ row }) => row.original.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Off</Badge> },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => {
        const z = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(z)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDel(z)} className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <AdminGate>
      <Page>
        <PageHeader title="Delivery zones" sub="Charges quoted at checkout" actions={<Button onClick={openCreate}><Plus /> Add zone</Button>} />
        {!rows ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : (
          <StatCards
            stats={[
              { label: "Total zones", value: String(rows.length) },
              { label: "Active", value: String(rows.filter((z) => z.isActive).length), hint: "Quoted at checkout" },
              { label: "Cheapest charge", value: rows.length ? formatBDT(Math.min(...rows.map((z) => z.charge ?? 0))) : formatBDT(0) },
              { label: "Free-shipping zones", value: String(rows.filter((z) => z.freeOver).length), hint: "Free over threshold" },
            ]}
          />
        )}
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="p-0">
            {!rows ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            : rows.length === 0 ? <EmptyState title="No zones" hint="Add a delivery zone." />
            : <DataTable columns={columns} data={rows} searchKey="name" searchPlaceholder="Search zones…" />}
          </CardContent>
        </Card>

        <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialog?.mode === "create" ? "Add zone" : "Edit zone"}</DialogTitle>
              <DialogDescription>Amounts are in taka.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Inside Dhaka" /></div>
              <div className="space-y-1.5"><Label>Charge (taka) *</Label><Input type="number" value={form.charge} onChange={(e) => set("charge", e.target.value)} placeholder="60" /></div>
              <div className="space-y-1.5"><Label>Free over (taka, blank = never)</Label><Input type="number" value={form.freeOver} onChange={(e) => set("freeOver", e.target.value)} placeholder="2000" /></div>
              <div className="space-y-1.5"><Label>Sort order</Label><Input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></div>
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
            <DialogHeader><DialogTitle>Delete “{del?.name}”?</DialogTitle></DialogHeader>
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
