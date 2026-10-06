"use client";
import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AdminGate, api } from "../../../components/admin";
import { Page, PageHeader, EmptyState, StatCards } from "../../../components/admin/page";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { DataTable, SortableHeader } from "../../../components/ui/data-table";
import { Skeleton } from "../../../components/ui/skeleton";
import { toast } from "../../../components/ui/sonner";

export default function AdminReviews() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [filter, setFilter] = useState("");

  const load = () => {
    api(`/admin/reviews${filter === "pending" ? "?visible=0" : filter === "visible" ? "?visible=1" : ""}`)
      .then(setRows)
      .catch(() => { setRows([]); toast.error("Failed to load reviews"); });
  };
  useEffect(() => { load(); }, [filter]);

  const moderate = async (r: any, isVisible: boolean) => {
    try {
      await api(`/admin/reviews/${r.id}`, { method: "PATCH", body: JSON.stringify({ isVisible }) });
      toast.success(isVisible ? "Review published" : "Review hidden");
      load();
    } catch { toast.error("Update failed"); }
  };

  const remove = async (r: any) => {
    if (!confirm(`Delete review by ${r.name}?`)) return;
    try { await api(`/admin/reviews/${r.id}`, { method: "DELETE" }); toast.success("Review deleted"); load(); }
    catch { toast.error("Delete failed"); }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "product",
      header: ({ column }) => <SortableHeader title="Product" column={column} />,
      cell: ({ row }) => <span className="font-medium">{row.original.product?.nameEn ?? row.original.productId}</span>,
    },
    {
      accessorKey: "rating", header: "Rating",
      cell: ({ row }) => <span className="font-bold text-amber-600">{"★".repeat(row.original.rating)}{"☆".repeat(5 - row.original.rating)}</span>,
    },
    {
      accessorKey: "body", header: "Review", enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <span className="block max-w-80">
            <span className="block text-sm font-medium">{r.name} {r.title && `— ${r.title}`}</span>
            <span className="block truncate text-sm text-muted-foreground" title={r.body}>{r.body}</span>
          </span>
        );
      },
    },
    {
      accessorKey: "isVisible", header: "Status",
      cell: ({ row }) => row.original.isVisible ? <Badge>Published</Badge> : <Badge variant="secondary">Pending</Badge>,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader title="Date" column={column} />,
      cell: ({ row }) => <span className="text-xs">{new Date(row.original.createdAt).toLocaleDateString("en-BD")}</span>,
    },
    {
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <span className="flex gap-1">
            {r.isVisible
              ? <Button size="sm" variant="outline" onClick={() => moderate(r, false)}>Hide</Button>
              : <Button size="sm" onClick={() => moderate(r, true)}>Approve</Button>}
            <Button size="sm" variant="destructive" onClick={() => remove(r)}>Del</Button>
          </span>
        );
      },
    },
  ];

  return (
    <AdminGate>
      <Page>
        <PageHeader
          title="Reviews"
          sub="Approve customer reviews before they go live"
          actions={
            <>
              <Button size="sm" variant={filter === "" ? "secondary" : "ghost"} onClick={() => setFilter("")}>All</Button>
              <Button size="sm" variant={filter === "pending" ? "secondary" : "ghost"} onClick={() => setFilter("pending")}>Pending</Button>
              <Button size="sm" variant={filter === "visible" ? "secondary" : "ghost"} onClick={() => setFilter("visible")}>Published</Button>
            </>
          }
        />
        {!rows ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : (
          <StatCards
            stats={[
              { label: "Total reviews", value: String(rows.length) },
              { label: "Pending approval", value: String(rows.filter((r) => !r.isVisible).length), hint: "Need moderation" },
              { label: "Published", value: String(rows.filter((r) => r.isVisible).length), hint: "Live on products" },
              {
                label: "Avg rating",
                value: rows.length ? `${(rows.reduce((a, r) => a + (r.rating ?? 0), 0) / rows.length).toFixed(1)} ★` : "—",
              },
            ]}
          />
        )}
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="p-0">
            {!rows ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            : rows.length === 0 ? <EmptyState title="No reviews" hint="Submitted reviews will appear here for moderation." />
            : <DataTable columns={columns} data={rows} searchKey="body" searchPlaceholder="Search reviews…" />}
          </CardContent>
        </Card>
      </Page>
    </AdminGate>
  );
}
