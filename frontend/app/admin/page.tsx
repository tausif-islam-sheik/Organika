"use client";
import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { AdminGate, api } from "../../components/admin";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import { formatBDT } from "../../lib/shop";

const PIE_COLORS = ["#1a7a36", "#eda200", "#3b82f6", "#8b5cf6", "#dc2626", "#737373"];

export default function AdminDash() {
  const [s, setS] = useState<any>(null);
  const [days, setDays] = useState(14);
  const [series, setSeries] = useState<any[] | null>(null);

  useEffect(() => {
    api("/admin/stats").then(setS).catch(() => {});
  }, []);
  useEffect(() => {
    setSeries(null);
    api(`/admin/sales-series?days=${days}`).then(setSeries).catch(() => setSeries([]));
  }, [days]);

  const pie = (s?.byStatus ?? []).map((x: any) => ({ name: x.status, value: x._count }));

  return (
    <AdminGate>
      <main className="mx-auto max-w-6xl p-4 md:p-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        {!s ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                ["Today's sales", `${formatBDT(s.today._sum.total ?? 0)} · ${s.today._count} orders`],
                ["This month", `${formatBDT(s.month._sum.total ?? 0)} · ${s.month._count} orders`],
                ["Pending orders", String(s.pendingOrders)],
              ].map(([t, v]) => (
                <Card key={t}>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t}</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{v}</div></CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Revenue — last {days} days</CardTitle>
                <div className="flex gap-1">
                  {[7, 14, 30].map((d) => (
                    <Button key={d} size="sm" variant={days === d ? "secondary" : "ghost"} onClick={() => setDays(d)}>{d}d</Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {!series ? (
                  <Skeleton className="h-64" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={series.map((p) => ({ ...p, bdt: p.total / 100 }))}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `৳${v >= 1000 ? `${Math.round(v / 100) / 10}k` : v}`} />
                        <Tooltip formatter={(v: any) => [`৳${Number(v).toLocaleString()}`, "Revenue"]} />
                        <Area type="monotone" dataKey="bdt" stroke="#1a7a36" fill="#1a7a36" fillOpacity={0.25} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Orders by status</CardTitle></CardHeader>
                <CardContent>
                  {pie.length === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground">No orders yet.</p>
                  ) : (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pie} dataKey="value" nameKey="name" outerRadius={80} label>
                            {pie.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Top products</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Sold</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {s.topProducts.map((t: any) => (
                        <TableRow key={t.variantId}><TableCell>{t.nameSnapshot}</TableCell><TableCell className="text-right font-bold">{t._sum.quantity}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Low stock (≤ 5)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Stock</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {s.lowStock.map((v: any) => (
                      <TableRow key={v.id}><TableCell>{v.product.nameEn} ({v.label})</TableCell><TableCell className="text-right font-bold">{v.stock}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
                {s.lowStock.length === 0 && <p className="py-2 text-sm text-muted-foreground">All stocked.</p>}
              </CardContent>
            </Card>
            </div>
          </>
        )}
      </main>
    </AdminGate>
  );
}
