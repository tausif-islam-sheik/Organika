"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, ShoppingCart, Clock, Users, ArrowRight } from "lucide-react";
import { AdminGate, api } from "../../components/admin";
import { Page, PageHeader } from "../../components/admin/page";
import { useNotifications, timeAgo, formatFull } from "../../components/admin/notifications";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import { formatBDT } from "../../lib/shop";

const PIE_COLORS = ["#1a7a36", "#eda200", "#3b82f6", "#8b5cf6", "#dc2626", "#737373", "#06b6d4", "#f472b6"];

const tk = (v: number) => `৳${v >= 1000 ? `${Math.round(v / 100) / 10}k` : v}`;

// Muted axis text that follows the theme (light + dark).
const AXIS_CLS = "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-axis-tick_text]:opacity-70";
const GRID_CLS = "[&_.recharts-cartesian-grid_line]:stroke-muted-foreground [&_.recharts-cartesian-grid_line]:opacity-20";

function ChartTip({ active, payload, label, format }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-popover/95 px-3.5 py-2.5 shadow-xl backdrop-blur">
      <p className="text-xs font-medium text-muted-foreground">{label ?? payload[0]?.name}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="mt-0.5 flex items-center gap-2 text-sm font-bold">
          <span className="size-2.5 rounded-full" style={{ background: p.color ?? p.payload?.fill ?? p.fill }} />
          {format ? format(p.value, p) : p.value}
        </p>
      ))}
    </div>
  );
}

export default function AdminDash() {
  const [s, setS] = useState<any>(null);
  const [days, setDays] = useState(14);
  const [revenue, setRevenue] = useState<any[] | null>(null);
  const [orders, setOrders] = useState<any[] | null>(null);
  const { notes, count } = useNotifications();

  useEffect(() => {
    api("/admin/stats").then(setS).catch(() => setS({ empty: true }));
  }, []);
  useEffect(() => {
    setRevenue(null);
    setOrders(null);
    api(`/admin/sales-series?days=${days}`).then(setRevenue).catch(() => setRevenue([]));
    api(`/admin/orders-series?days=${days}`).then(setOrders).catch(() => setOrders([]));
  }, [days]);

  const pie = (s?.byStatus ?? []).map((x: any) => ({ name: x.status, value: x._count }));
  const revTotal = (revenue ?? []).reduce((a, p) => a + (p.total ?? 0), 0);
  const ordTotal = (orders ?? []).reduce((a, p) => a + (p.count ?? 0), 0);

  const stats = s && !s.empty ? [
    { icon: TrendingUp, label: "Today's sales", value: `${formatBDT(s.today._sum.total ?? 0)}`, hint: `${s.today._count} orders today` },
    { icon: ShoppingCart, label: "This month", value: formatBDT(s.month._sum.total ?? 0), hint: `${s.month._count} orders · AOV ${formatBDT(s.avgOrderValue ?? 0)}` },
    { icon: Clock, label: "Pending orders", value: String(s.pendingOrders), hint: "Need confirmation", href: "/admin/orders" },
    { icon: Users, label: "Customers", value: String(s.totalCustomers ?? 0), hint: `${count} unread alerts`, href: "/admin/customers" },
  ] : [];

  return (
    <AdminGate>
      <Page>
        <PageHeader
          title="Dashboard"
          sub={revTotal ? `${formatBDT(revTotal)} revenue · ${ordTotal} orders in last ${days} days` : "Store overview"}
          actions={[7, 14, 30].map((d) => (
            <Button key={d} size="sm" variant={days === d ? "secondary" : "ghost"} onClick={() => setDays(d)}>{d}d</Button>
          ))}
        />

        {!s ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
        ) : s.empty ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Could not load stats. Is the backend running?</CardContent></Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((c) => (
                <Card key={c.label}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                    <c.icon className="size-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{c.value}</div>
                    {c.href ? (
                      <Link href={c.href} className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">{c.hint} <ArrowRight className="size-3" /></Link>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="overflow-hidden lg:col-span-2">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Revenue — last {days} days</CardTitle>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight">{formatBDT(revTotal)}</p>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">BDT</Badge>
                </CardHeader>
                <CardContent>
                  {!revenue ? <Skeleton className="h-64" /> : (
                    <div className={`h-64 ${AXIS_CLS} ${GRID_CLS}`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenue.map((p) => ({ ...p, bdt: p.total / 100 }))} margin={{ left: -8, right: 8 }}>
                          <defs>
                            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#1a7a36" stopOpacity={0.45} />
                              <stop offset="60%" stopColor="#1a7a36" stopOpacity={0.12} />
                              <stop offset="100%" stopColor="#1a7a36" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 6" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(d: string) => d.slice(5)} />
                          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={tk} width={56} />
                          <Tooltip content={<ChartTip format={(v: any) => `৳${Number(v).toLocaleString()}`} />} cursor={{ stroke: "#1a7a36", strokeDasharray: "4 4", opacity: 0.5 }} />
                          <Area type="monotone" dataKey="bdt" name="Revenue" stroke="#22a355" strokeWidth={2.5} fill="url(#revFill)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Orders by status</CardTitle>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight">{pie.reduce((a: number, p: any) => a + p.value, 0)} <span className="text-sm font-medium text-muted-foreground">total</span></p>
                </CardHeader>
                <CardContent>
                  {pie.length === 0 ? <p className="py-2 text-sm text-muted-foreground">No orders yet.</p> : (
                    <>
                      <div className="relative mx-auto h-52 max-w-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <defs>
                              {pie.map((_: any, i: number) => {
                                const c = PIE_COLORS[i % PIE_COLORS.length];
                                return (
                                  <radialGradient key={i} id={`pieGrad${i}`}>
                                    <stop offset="0%" stopColor={c} stopOpacity={1} />
                                    <stop offset="100%" stopColor={c} stopOpacity={0.75} />
                                  </radialGradient>
                                );
                              })}
                            </defs>
                            <Pie data={pie} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="92%" paddingAngle={3} cornerRadius={6} strokeWidth={0}>
                              {pie.map((_: any, i: number) => <Cell key={i} fill={`url(#pieGrad${i})`} />)}
                            </Pie>
                            <Tooltip content={<ChartTip format={(v: any, p: any) => `${v} order${v === 1 ? "" : "s"} · ${p.name}`} />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-extrabold tracking-tight">{pie.reduce((a: number, p: any) => a + p.value, 0)}</span>
                          <span className="text-xs font-medium text-muted-foreground">orders</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                        {pie.map((p: any, i: number) => (
                          <span key={p.name} className="flex items-center gap-1.5 text-xs font-medium">
                            <span className="size-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            {p.name}
                            <span className="font-bold">{p.value}</span>
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="overflow-hidden lg:col-span-2">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Orders per day — last {days} days</CardTitle>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight">{ordTotal} <span className="text-sm font-medium text-muted-foreground">orders</span></p>
                  </div>
                  <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 dark:text-amber-400">{days}d</Badge>
                </CardHeader>
                <CardContent>
                  {!orders ? <Skeleton className="h-52" /> : (
                    <div className={`h-52 ${AXIS_CLS} ${GRID_CLS}`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={orders} margin={{ left: -18, right: 8 }} barCategoryGap="28%">
                          <defs>
                            <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f5b301" stopOpacity={1} />
                              <stop offset="100%" stopColor="#eda200" stopOpacity={0.55} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 6" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(d: string) => d.slice(5)} />
                          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip content={<ChartTip format={(v: any) => `${v} order${v === 1 ? "" : "s"}`} />} cursor={{ fill: "#eda200", opacity: 0.12 }} />
                          <Bar dataKey="count" name="Orders" fill="url(#barFill)" radius={[7, 7, 2, 2]} maxBarSize={46} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Latest alerts</CardTitle>
                  <Button asChild variant="ghost" size="sm"><Link href="/admin/notifications">View all</Link></Button>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {notes.length === 0 && <p className="text-sm text-muted-foreground">No alerts — new orders and low stock will appear here.</p>}
                  {notes.slice(0, 5).map((n) => (
                    <div key={n.id} className="flex items-start gap-2 text-sm">
                      {!n.readAt && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(n.createdAt)} · {formatFull(n.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-0 shadow-none">
                <CardHeader><CardTitle>Top products</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Sold</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {(s.topProducts ?? []).map((t: any) => (
                        <TableRow key={t.variantId}><TableCell>{t.nameSnapshot}</TableCell><TableCell className="text-right font-bold">{t._sum.quantity}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {(s.topProducts ?? []).length === 0 && <p className="py-2 text-sm text-muted-foreground">No sales yet.</p>}
                </CardContent>
              </Card>
              <Card className="border-0 shadow-none">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Low stock (≤ 5)</CardTitle>
                  <Button asChild variant="ghost" size="sm"><Link href="/admin/products">Manage</Link></Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Stock</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {(s.lowStock ?? []).map((v: any) => (
                        <TableRow key={v.id}>
                          <TableCell>{v.product.nameEn} ({v.label})</TableCell>
                          <TableCell className="text-right"><Badge variant="destructive">{v.stock}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {(s.lowStock ?? []).length === 0 && <p className="py-2 text-sm text-muted-foreground">All stocked.</p>}
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent orders</CardTitle>
                <Button asChild variant="ghost" size="sm"><Link href="/admin/orders">All orders <ArrowRight className="size-3" /></Link></Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Placed</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(s.recentOrders ?? []).map((o: any) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium"><Link href={`/admin/orders?focus=${o.id}`} className="hover:underline">{o.orderNo}</Link></TableCell>
                        <TableCell><Badge variant="secondary">{o.status}</Badge></TableCell>
                        <TableCell className="text-right font-bold">{formatBDT(o.total)}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("en-BD")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </Page>
    </AdminGate>
  );
}
