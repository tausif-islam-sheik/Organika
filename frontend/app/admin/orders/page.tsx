"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { AdminGate, api } from "../../../components/admin";
import { Page, PageHeader, StatCards } from "../../../components/admin/page";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { DataTable, SortableHeader } from "../../../components/ui/data-table";
import { Skeleton } from "../../../components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../../components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Separator } from "../../../components/ui/separator";
import { toast } from "../../../components/ui/sonner";
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

function OrdersBody() {
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");
  const q = searchParams.get("q");
  const [orders, setOrders] = useState<any[] | null>(null);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [courier, setCourier] = useState("STEADFAST");
  const [payStatus, setPayStatus] = useState("");

  const load = useCallback(() => {
    api(`/admin/orders${filter ? `?status=${filter}` : ""}`)
      .then(setOrders)
      .catch(() => { setOrders([]); toast.error("Failed to load orders"); });
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  // Deep-link: ?focus=<id> opens the drawer (from dashboard/notifications)
  useEffect(() => {
    if (focus) openDetail({ id: focus });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  const openDetail = async (o: any) => {
    setSelected({ ...o, _loading: true });
    setLoadingDetail(true);
    try {
      const d = await api(`/admin/orders/${o.id}`);
      setSelected(d);
      setPayStatus(d.paymentStatus ?? "");
    } catch {
      toast.error("Could not load order detail");
      setSelected(null);
    }
    setLoadingDetail(false);
  };

  const act = async (id: string, to: string) => {
    try {
      const updated = await api(`/admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ to, note: `admin → ${to}` }) });
      toast.success(`Order → ${to}`);
      setSelected(updated);
      load();
    } catch { toast.error("Transition not allowed"); }
  };

  const savePayment = async () => {
    if (!selected || !payStatus) return;
    try {
      await api(`/admin/orders/${selected.id}/payment`, { method: "PATCH", body: JSON.stringify({ status: payStatus }) });
      toast.success(`Payment → ${payStatus}`);
      setSelected({ ...selected, paymentStatus: payStatus });
      load();
    } catch { toast.error("Payment update failed"); }
  };

  const ship = async () => {
    if (!selected) return;
    try {
      await api(`/admin/shipments`, { method: "POST", body: JSON.stringify({ orderId: selected.id, courier }) });
      toast.success(`Handed to ${courier}`);
      openDetail(selected);
      load();
    } catch (e: any) { toast.error("Shipment failed — confirm order first"); }
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
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant={statusVariant(row.original.status) as any}>{row.original.status}</Badge> },
    {
      accessorKey: "items", header: "Items", enableSorting: false,
      cell: ({ row }) => (
        <div className="max-w-60 truncate text-xs text-muted-foreground">
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
      id: "actions", header: "", enableSorting: false,
      cell: ({ row }) => <Button size="sm" variant="outline" onClick={() => openDetail(row.original)}><Eye /> View</Button>,
    },
  ];

  const filtered = q && orders
    ? orders.filter((o) => `${o.orderNo} ${o.items?.map((i: any) => i.nameSnapshot).join(" ")}`.toLowerCase().includes(q.toLowerCase()))
    : orders;

  const scope = filter || "all";
  const stats = !filtered ? [] : [
    { label: `Orders (${scope})`, value: String(filtered.length) },
    { label: "Revenue in view", value: formatBDT(filtered.reduce((a, o) => a + (o.total ?? 0), 0)) },
    { label: "Pending in view", value: String(filtered.filter((o) => o.status === "PENDING").length), hint: "Need confirmation" },
    { label: "Avg order value", value: filtered.length ? formatBDT(Math.round(filtered.reduce((a, o) => a + (o.total ?? 0), 0) / filtered.length)) : formatBDT(0) },
  ];

  return (
    <Page>
      <PageHeader
        title="Orders"
        sub={q ? `Highlighting “${q}” from notification` : "Confirm, dispatch and track"}
        actions={
          <>
            <Button size="sm" variant={filter === "" ? "secondary" : "ghost"} onClick={() => setFilter("")}>All</Button>
            {Object.keys(NEXT).map((s) => (
              <Button key={s} size="sm" variant={filter === s ? "secondary" : "ghost"} onClick={() => setFilter(s)}>{s}</Button>
            ))}
          </>
        }
      />
      {!filtered ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <StatCards stats={stats} />
      )}
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="p-0">
          {!filtered ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          : <DataTable columns={columns} data={filtered} searchKey="orderNo" searchPlaceholder="Search order no…" pageSize={12} />}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle>Order {selected?.orderNo}</SheetTitle></SheetHeader>
          {(!selected || selected._loading || loadingDetail) && !selected?.items ? (
            <div className="space-y-2"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
          ) : selected && (
            <div className="space-y-4 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(selected.status) as any}>{selected.status}</Badge>
                <Badge variant="outline">{selected.paymentMethod} · {selected.paymentStatus}</Badge>
                <span className="ml-auto text-lg font-extrabold">{formatBDT(selected.total)}</span>
              </div>

              <div>
                <p className="text-sm font-semibold">Next step</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(NEXT[selected.status] ?? []).length === 0 && <span className="text-xs text-muted-foreground">Terminal state — no further transitions.</span>}
                  {(NEXT[selected.status] ?? []).map((to: string) => (
                    <Button key={to} size="sm" variant={to === "CANCELLED" ? "destructive" : "default"} onClick={() => act(selected.id, to)}>→ {to}</Button>
                  ))}
                </div>
              </div>

              <Separator />
              <div>
                <p className="text-sm font-semibold">Items</p>
                <div className="mt-1.5 space-y-1.5">
                  {(selected.items ?? []).map((i: any) => (
                    <div key={i.id} className="flex justify-between gap-2 rounded-lg border p-2 text-sm">
                      <span>{i.nameSnapshot} <span className="text-muted-foreground">×{i.quantity}</span></span>
                      <span className="font-semibold">{formatBDT(i.lineTotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 space-y-0.5 text-sm">
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatBDT(selected.subtotal)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>{formatBDT(selected.delivery)}</span></div>
                  {selected.discount > 0 && <div className="flex justify-between text-muted-foreground"><span>Discount</span><span>−{formatBDT(selected.discount)}</span></div>}
                  <div className="flex justify-between font-bold"><span>Total</span><span>{formatBDT(selected.total)}</span></div>
                </div>
              </div>

              <Separator />
              <div className="space-y-1.5">
                <Label>Payment status</Label>
                <div className="flex gap-2">
                  <Select value={payStatus} onValueChange={setPayStatus}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["UNPAID", "PAID", "PARTIAL", "REFUNDED"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={savePayment}>Save</Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Shipment</Label>
                {selected.shipment ? (
                  <p className="rounded-lg bg-muted p-2 text-xs">
                    {selected.shipment.courier} · {selected.shipment.consignmentId} · {selected.shipment.status}
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <Input value={courier} onChange={(e) => setCourier(e.target.value.toUpperCase())} className="flex-1" />
                    <Button size="sm" variant="outline" onClick={ship}>Send to courier</Button>
                  </div>
                )}
              </div>

              <Separator />
              <div>
                <p className="text-sm font-semibold">Delivery address</p>
                <pre className="mt-1 overflow-x-auto rounded-lg bg-muted p-2 text-xs">{JSON.stringify(selected.address, null, 2)}</pre>
              </div>

              <div>
                <p className="text-sm font-semibold">Timeline</p>
                <div className="mt-1.5 space-y-1.5">
                  {(selected.history ?? []).map((h: any) => (
                    <div key={h.id} className="flex gap-2 text-xs">
                      <Badge variant="outline" className="shrink-0">{h.from ?? "—"} → {h.to}</Badge>
                      <span className="text-muted-foreground">{h.note ?? ""} · {new Date(h.createdAt).toLocaleString("en-BD")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Page>
  );
}

export default function AdminOrders() {
  return (
    <AdminGate>
      <Suspense fallback={<Page><Skeleton className="h-64" /></Page>}>
        <OrdersBody />
      </Suspense>
    </AdminGate>
  );
}
