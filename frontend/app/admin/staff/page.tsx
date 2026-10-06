"use client";
import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AdminGate, api } from "../../../components/admin";
import { Page, PageHeader, EmptyState, StatCards } from "../../../components/admin/page";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { DataTable, SortableHeader } from "../../../components/ui/data-table";
import { Skeleton } from "../../../components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { toast } from "../../../components/ui/sonner";

export default function AdminStaff() {
  const [rows, setRows] = useState<any[] | null>(null);

  const load = () => api("/admin/customers").then((all: any[]) => setRows(all.filter((u) => u.role !== "CUSTOMER"))).catch(() => { setRows([]); toast.error("Failed to load staff"); });
  useEffect(() => { load(); }, []);

  const setRole = async (u: any, role: string) => {
    try {
      await api(`/admin/customers/${u.id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
      toast.success(`${u.name ?? u.phone} → ${role}`);
      load();
    } catch { toast.error("Only ADMIN can change roles"); }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader title="Staff" column={column} />,
      cell: ({ row }) => {
        const u = row.original;
        return (
          <span>
            <span className="block font-medium">{u.name ?? "—"}</span>
            <span className="block text-xs text-muted-foreground">{u.phone ?? ""} {u.email ? `· ${u.email}` : ""}</span>
          </span>
        );
      },
    },
    { accessorKey: "role", header: "Role", cell: ({ row }) => <Badge>{row.original.role}</Badge> },
    {
      id: "change", header: "Change role", enableSorting: false,
      cell: ({ row }) => {
        const u = row.original;
        return (
          <Select value={u.role} onValueChange={(r) => setRole(u, r)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["PACKER", "MANAGER", "ADMIN", "CUSTOMER"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      },
    },
  ];

  return (
    <AdminGate>
      <Page>
        <PageHeader title="Staff" sub="PACKER handles orders · MANAGER edits catalog · ADMIN has full access" />
        {!rows ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : (
          <StatCards
            stats={[
              { label: "Team size", value: String(rows.length) },
              { label: "Admins", value: String(rows.filter((u) => u.role === "ADMIN").length), hint: "Full access" },
              { label: "Managers", value: String(rows.filter((u) => u.role === "MANAGER").length), hint: "Catalog + orders" },
              { label: "Packers", value: String(rows.filter((u) => u.role === "PACKER").length), hint: "Orders only" },
            ]}
          />
        )}
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="p-0">
            {!rows ? <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            : rows.length === 0 ? <EmptyState title="No staff yet" hint="Promote a customer to PACKER / MANAGER from the Customers page." />
            : <DataTable columns={columns} data={rows} searchKey="name" searchPlaceholder="Search staff…" />}
          </CardContent>
        </Card>
      </Page>
    </AdminGate>
  );
}
