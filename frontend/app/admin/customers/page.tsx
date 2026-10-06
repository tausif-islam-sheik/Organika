"use client";
import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { AdminGate, api } from "../../../components/admin";
import { Page, PageHeader, EmptyState, StatCards } from "../../../components/admin/page";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { DataTable, SortableHeader } from "../../../components/ui/data-table";
import { Skeleton } from "../../../components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../../components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Label } from "../../../components/ui/label";
import { Separator } from "../../../components/ui/separator";
import { toast } from "../../../components/ui/sonner";
import { formatBDT } from "../../../lib/shop";

export default function AdminCustomers() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [sel, setSel] = useState<any | null>(null);
  const [role, setRole] = useState("");

  const load = () => api("/admin/customers").then(setRows).catch(() => { setRows([]); toast.error("Failed to load customers"); });
  useEffect(() => { load(); }, []);

  const open = async (r: any) => {
    setSel({ ...r, _loading: true });
    try {
      const d = await api(`/admin/customers/${r.id}`);
      setSel(d);
      setRole(d.role);
    } catch { toast.error("Could not load customer"); setSel(null); }
  };

  const saveRole = async () => {
    if (!sel || !role) return;
    try {
      await api(`/admin/customers/${sel.id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
      toast.success(`Role → ${role}`);
      setSel({ ...sel, role });
      load();
    } catch { toast.error("Only ADMIN can change roles"); }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader title="Customer" column={column} />,
      cell: ({ row }) => {
        const c = row.original;
        return (
          <span>
            <span className="block font-medium">{c.name ?? c.phone ?? "Guest"}</span>
            <span className="block text-xs text-muted-foreground">{c.phone ?? ""} {c.email ? `· ${c.email}` : ""}</span>
          </span>
        );
      },
    },
    { accessorKey: "role", header: "Role", cell: ({ row }) => <Badge variant={row.original.role === "CUSTOMER" ? "secondary" : "default"}>{row.original.role}</Badge> },
    {
      accessorKey: "orders", header: ({ column }) => <SortableHeader title="Orders" column={column} />,
      cell: ({ row }) => <span className="font-semibold">{row.original._count?.orders ?? 0}</span>,
    },
    {
      accessorKey: "createdAt", header: ({ column }) => <SortableHeader title="Joined" column={column} />,
      cell: ({ row }) => <span className="text-xs">{new Date(row.original.createdAt).toLocaleDateString("en-BD")}</span>,
    },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => <Button size="sm" variant="outline" onClick={() => open(row.original)}><Eye /> View</Button>,
    },
  ];

  return (
    <AdminGate>
      <Page>
        <PageHeader title="Customers" sub="Order history, spend and staff roles" />
        {!rows ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : (
          <StatCards
            stats={[
              { label: "Total customers", value: String(rows.length) },
              { label: "With orders", value: String(rows.filter((c) => (c._count?.orders ?? 0) > 0).length), hint: "Have purchased" },
              {
                label: "New this month",
                value: String(rows.filter((c) => { const d = new Date(c.createdAt); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length),
              },
              { label: "Repeat buyers", value: String(rows.filter((c) => (c._count?.orders ?? 0) > 1).length), hint: "2+ orders" },
            ]}
          />
        )}
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="p-0">
            {!rows ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            : rows.length === 0 ? <EmptyState title="No customers yet" hint="Accounts appear after checkout or login." />
            : <DataTable columns={columns} data={rows} searchKey="name" searchPlaceholder="Search name, phone, email…" />}
          </CardContent>
        </Card>

        <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
          <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
            <SheetHeader><SheetTitle>{sel?.name ?? sel?.phone ?? "Customer"}</SheetTitle></SheetHeader>
            {sel && !sel._loading && (
              <div className="space-y-4 pb-6">
                <div className="text-sm text-muted-foreground">
                  <p>{sel.phone}</p><p>{sel.email}</p>
                  <p>Joined {new Date(sel.createdAt).toLocaleDateString("en-BD")} · {sel.orderCount} orders · {formatBDT(sel.totalSpent ?? 0)} lifetime</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Role (ADMIN only)</Label>
                  <div className="flex gap-2">
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{["CUSTOMER", "PACKER", "MANAGER", "ADMIN"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button size="sm" onClick={saveRole}>Save</Button>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-semibold">Orders</p>
                  <div className="mt-1.5 space-y-1.5">
                    {(sel.orders ?? []).map((o: any) => (
                      <div key={o.id} className="flex justify-between rounded-lg border p-2 text-sm">
                        <span className="font-medium">{o.orderNo} <Badge variant="secondary" className="ml-1">{o.status}</Badge></span>
                        <span className="font-semibold">{formatBDT(o.total)}</span>
                      </div>
                    ))}
                    {(sel.orders ?? []).length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
                  </div>
                </div>
                {sel.addresses?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold">Saved addresses</p>
                    <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-2 text-xs">{JSON.stringify(sel.addresses, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </Page>
    </AdminGate>
  );
}
