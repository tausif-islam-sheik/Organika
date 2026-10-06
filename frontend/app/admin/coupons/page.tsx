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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { toast } from "../../../components/ui/sonner";
import { formatBDT } from "../../../lib/shop";

const emptyForm = { code: "", type: "FLAT", value: "", minOrder: "0", usageLimit: "", expiresAt: "", isActive: true };

export default function AdminCoupons() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [dialog, setDialog] = useState<null | { mode: "create" } | { mode: "edit"; c: any }>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<any | null>(null);

  const load = () => api("/admin/coupons").then(setRows).catch(() => { setRows([]); toast.error("Failed to load coupons"); });
  useEffect(() => { load(); }, []);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const openCreate = () => { setForm(emptyForm); setDialog({ mode: "create" }); };
  const openEdit = (c: any) => {
    setForm({
      code: c.code ?? "", type: c.type ?? "FLAT", value: c.type === "PERCENT" ? String(c.value) : String(Math.round((c.value ?? 0) / 100)),
      minOrder: String(Math.round((c.minOrder ?? 0) / 100)), usageLimit: c.usageLimit ? String(c.usageLimit) : "",
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "", isActive: c.isActive ?? true,
    });
    setDialog({ mode: "edit", c });
  };

  const toPaisa = (taka: string) => Math.round(Number(taka || 0) * 100);

  const save = async () => {
    if (!form.code.trim()) return toast.error("Code is required");
    if (!form.value) return toast.error("Value is required");
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: form.type === "PERCENT" ? Number(form.value) : toPaisa(form.value),
        minOrder: toPaisa(form.minOrder),
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        expiresAt: form.expiresAt || null,
        isActive: form.isActive,
      };
      if (dialog?.mode === "create") { await api("/admin/coupons", { method: "POST", body: JSON.stringify(payload) }); toast.success("Coupon created"); }
      else if (dialog?.mode === "edit") { await api(`/admin/coupons/${dialog.c.id}`, { method: "PATCH", body: JSON.stringify(payload) }); toast.success("Coupon updated"); }
      setDialog(null);
      load();
    } catch { toast.error("Save failed — code must be unique"); }
    setSaving(false);
  };

  const remove = async () => {
    if (!del) return;
    try { await api(`/admin/coupons/${del.id}`, { method: "DELETE" }); toast.success("Coupon deleted"); setDel(null); load(); }
    catch { toast.error("Delete failed — coupon may be used by orders"); }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "code",
      header: ({ column }) => <SortableHeader title="Code" column={column} />,
      cell: ({ row }) => <span className="font-mono font-bold">{row.original.code}</span>,
    },
    {
      accessorKey: "value", header: "Discount",
      cell: ({ row }) => {
        const c = row.original;
        return <span className="font-semibold">{c.type === "PERCENT" ? `${c.value}%` : formatBDT(c.value)}</span>;
      },
    },
    {
      accessorKey: "minOrder", header: "Min order",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatBDT(row.original.minOrder ?? 0)}</span>,
    },
    {
      accessorKey: "usedCount", header: "Used",
      cell: ({ row }) => <span>{row.original.usedCount}{row.original.usageLimit ? ` / ${row.original.usageLimit}` : ""}</span>,
    },
    {
      accessorKey: "isActive", header: "Status",
      cell: ({ row }) => row.original.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Off</Badge>,
    },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => {
        const c = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(c)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDel(c)} className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <AdminGate>
      <Page>
        <PageHeader title="Coupons" sub="Discount codes applied at checkout" actions={<Button onClick={openCreate}><Plus /> Add coupon</Button>} />
        {!rows ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : (
          <StatCards
            stats={[
              { label: "Total coupons", value: String(rows.length) },
              { label: "Active", value: String(rows.filter((c) => c.isActive && (!c.expiresAt || new Date(c.expiresAt) > new Date())).length), hint: "Usable now" },
              { label: "Expired", value: String(rows.filter((c) => c.expiresAt && new Date(c.expiresAt) <= new Date()).length) },
              { label: "Total redemptions", value: String(rows.reduce((a, c) => a + (c.usedCount ?? 0), 0)) },
            ]}
          />
        )}
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="p-0">
            {!rows ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            : rows.length === 0 ? <EmptyState title="No coupons" hint="Create a discount code to boost sales." />
            : <DataTable columns={columns} data={rows} searchKey="code" searchPlaceholder="Search codes…" />}
          </CardContent>
        </Card>

        <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialog?.mode === "create" ? "Add coupon" : "Edit coupon"}</DialogTitle>
              <DialogDescription>FLAT values are in taka. PERCENT is 1–100.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Code *</Label><Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="WINTER20" className="font-mono" /></div>
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="FLAT">FLAT (taka off)</SelectItem><SelectItem value="PERCENT">PERCENT (% off)</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>{form.type === "PERCENT" ? "Percent (1–100) *" : "Amount (taka) *"}</Label><Input type="number" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder={form.type === "PERCENT" ? "20" : "100"} /></div>
              <div className="space-y-1.5"><Label>Min order (taka)</Label><Input type="number" value={form.minOrder} onChange={(e) => set("minOrder", e.target.value)} placeholder="0" /></div>
              <div className="space-y-1.5"><Label>Usage limit (blank = unlimited)</Label><Input type="number" value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} placeholder="100" /></div>
              <div className="space-y-1.5"><Label>Expires (blank = never)</Label><Input type="date" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} /></div>
              <div className="flex items-center gap-2 sm:col-span-2"><Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} /><Label>Active</Label></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete “{del?.code}”?</DialogTitle>
              <DialogDescription>Coupons used by orders cannot be deleted.</DialogDescription>
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
