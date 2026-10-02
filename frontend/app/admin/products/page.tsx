"use client";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AdminGate, api, API } from "../../../components/admin";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { DataTable, SortableHeader } from "../../../components/ui/data-table";
import { Skeleton } from "../../../components/ui/skeleton";
import { formatBDT } from "../../../lib/shop";
import { imgUrl } from "../../../components/home";

type Row = { id: string; product: string; image?: string; label: string; price: number; stock: number };

export default function AdminProducts() {
  const [items, setItems] = useState<any[] | null>(null);
  const load = () =>
    fetch(`${API}/collections/all`).then((r) => r.json()).then(setItems).catch(() => setItems([]));
  useEffect(() => { load(); }, []);
  const adj = async (id: string, delta: number) => {
    await api(`/admin/variants/${id}/stock`, { method: "PATCH", body: JSON.stringify({ delta }) });
    load();
  };

  const rows: Row[] = useMemo(
    () =>
      (items ?? []).flatMap((p: any) =>
        (p.variants ?? []).map((v: any) => ({ id: v.id, product: p.nameEn, image: p.images?.[0], label: v.label, price: v.price, stock: v.stock })),
      ),
    [items],
  );

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "product",
      header: ({ column }) => <SortableHeader title="Product" column={column} />,
      cell: ({ row }) => (
        <span className="flex items-center gap-2 font-medium">
          {row.original.image && <img src={imgUrl(row.original.image) ?? ""} alt="" className="h-8 w-8 rounded object-cover" />}
          {row.original.product}
        </span>
      ),
    },
    { accessorKey: "label", header: "Variant" },
    {
      accessorKey: "price",
      header: ({ column }) => <SortableHeader title="Price" column={column} />,
      cell: ({ row }) => <div className="text-right">{formatBDT(row.original.price)}</div>,
    },
    {
      accessorKey: "stock",
      header: ({ column }) => <SortableHeader title="Stock" column={column} />,
      cell: ({ row }) => <div className="text-right font-bold">{row.original.stock}</div>,
    },
    {
      id: "actions",
      header: "Adjust",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => adj(row.original.id, 10)}>+10</Button>
          <Button size="sm" variant="outline" onClick={() => adj(row.original.id, -1)}>-1</Button>
        </div>
      ),
    },
  ];

  return (
    <AdminGate>
      <main className="mx-auto max-w-6xl p-4 md:p-6">
        <h1 className="text-2xl font-bold tracking-tight">Products & stock</h1>
        <Card className="mt-4">
          <CardHeader><CardTitle>Variants</CardTitle></CardHeader>
          <CardContent>
            {!items ? (
              <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : (
              <DataTable columns={columns} data={rows} searchKey="product" searchPlaceholder="Search product…" />
            )}
          </CardContent>
        </Card>
      </main>
    </AdminGate>
  );
}
