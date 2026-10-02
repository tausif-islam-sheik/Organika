"use client";
import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AdminGate, api } from "../../../components/admin";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { DataTable, SortableHeader } from "../../../components/ui/data-table";
import { Skeleton } from "../../../components/ui/skeleton";
import { formatBDT } from "../../../lib/shop";

const NEXT: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "FAILED"],
  DELIVERED: ["RETURNED"],
};

const statusVariant = (s: string) =>
  s === "DELIVERED" ? "default" : s === "CANCELLED" || s === "FAILED" ? "destructive" : "secondary";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[] | null>(null);
  const [filter, setFilter] = useState("");
  const load = () => api(`/admin/orders${filter ? `?status=${filter}` : ""}`).then(setOrders).catch(() => setOrders([]));
  useEffect(() => { load(); }, [filter]);

  const act = async (id: string, to: string) => {
    await api(`/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ to, note: `admin → ${to}` }) });
    load();
  };
  const ship = async (orderId: string) => {
    await api(`/admin/shipments`, { method: "POST", body: JSON.stringify({ orderId, courier: "STEADFAST" }) });
    load();
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "orderNo",
      header: ({ column }) => <SortableHeader title="Order" column={column} />,
      cell: ({ row }) => (
        <div className="font-medium">{row.original.orderNo}
          <div className="text-xs text-muted-foreground">{row.original.paymentMethod}/{row.original.paymentStatus}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant={statusVariant(row.original.status) as any}>{row.original.status}</Badge>,
    },
    {
      accessorKey: "items",
      header: "Items",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="max-w-60 text-xs text-muted-foreground">
          {row.original.items.map((i: any) => `${i.nameSnapshot} ×${i.quantity}`).join(" · ")}
        </div>
      ),
    },
    {
      accessorKey: "total",
      header: ({ column }) => <SortableHeader title="Total" column={column} />,
      cell: ({ row }) => <div className="text-right font-bold">{formatBDT(row.original.total)}</div>,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader title="Placed" column={column} />,
      cell: ({ row }) => <div className="text-xs">{new Date(row.original.createdAt).toLocaleString("en-BD")}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const o = row.original;
        return (
          <div className="flex flex-wrap gap-1">
            {(NEXT[o.status] ?? []).map((to) => (
              <Button key={to} size="sm" variant={to === "CANCELLED" ? "destructive" : "default"} onClick={() => act(o.id, to)}>→ {to}</Button>
            ))}
            {(o.status === "CONFIRMED" || o.status === "PROCESSING") && (
              <Button size="sm" variant="outline" onClick={() => ship(o.id)}>Send to courier</Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <AdminGate>
      <main className="mx-auto max-w-6xl p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <div className="ml-auto flex flex-wrap gap-1">
            <Button size="sm" variant={filter === "" ? "secondary" : "ghost"} onClick={() => setFilter("")}>All</Button>
            {Object.keys(NEXT).map((s) => (
              <Button key={s} size="sm" variant={filter === s ? "secondary" : "ghost"} onClick={() => setFilter(s)}>{s}</Button>
            ))}
          </div>
        </div>
        <Card className="mt-4">
          <CardHeader><CardTitle>Order list</CardTitle></CardHeader>
          <CardContent>
            {!orders ? (
              <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : (
              <DataTable columns={columns} data={orders} searchKey="orderNo" searchPlaceholder="Search order no…" />
            )}
          </CardContent>
        </Card>
      </main>
    </AdminGate>
  );
}
