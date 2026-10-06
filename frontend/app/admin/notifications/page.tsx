"use client";
import { CalendarDays, Clock } from "lucide-react";
import { AdminGate } from "../../../components/admin";
import { Page, PageHeader, EmptyState } from "../../../components/admin/page";
import { useNotifications, timeAgo, formatFull, noteMeta, type Note } from "../../../components/admin/notifications";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { cn } from "../../../lib/utils";
import { useRouter } from "next/navigation";

const TYPE_LABEL: Record<string, string> = {
  ORDER_NEW: "New order",
  ORDER_STATUS: "Status",
  STOCK_LOW: "Low stock",
  PAYMENT: "Payment",
  REVIEW: "Review",
};

export default function AdminNotifications() {
  const { notes, count, refresh, markRead, markAllRead } = useNotifications();
  const router = useRouter();
  const loaded = notes !== undefined;

  const open = async (n: Note) => {
    if (!n.readAt) await markRead(n.id);
    if (n.link) router.push(n.link);
  };

  return (
    <AdminGate>
      <Page>
        <PageHeader
          title="Notifications"
          sub={count > 0 ? `${count} unread` : "You're all caught up"}
          actions={
            <>
              <Button size="sm" variant="outline" onClick={() => refresh()}>Refresh</Button>
              {count > 0 && <Button size="sm" onClick={markAllRead}>Mark all read</Button>}
            </>
          }
        />
        <Card>
          <CardHeader><CardTitle>Inbox</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {!loaded ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)
            : notes.length === 0 ? <EmptyState title="No notifications" hint="New orders, payments, low stock and reviews will land here." />
            : notes.map((n) => {
              const meta = noteMeta(n.type);
              const Icon = meta.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => open(n)}
                  className={cn(
                    "flex w-full items-start gap-3.5 rounded-xl border p-3.5 text-left transition hover:bg-muted/50 hover:shadow-sm",
                    !n.readAt && "border-primary/40 bg-primary/5",
                  )}
                >
                  <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", meta.chip)}>
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={cn("text-sm", !n.readAt && "font-bold")}>{n.title}</span>
                      <Badge variant={n.type === "STOCK_LOW" ? "destructive" : "secondary"} className="text-[11px]">
                        {TYPE_LABEL[n.type] ?? n.type}
                      </Badge>
                    </span>
                    {n.body && <span className="mt-0.5 block truncate text-sm text-muted-foreground">{n.body}</span>}
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                        <Clock className="size-3.5" />{timeAgo(n.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5" />{formatFull(n.createdAt)}
                      </span>
                      {n.link && <span className="truncate opacity-70">{n.link}</span>}
                    </span>
                  </span>
                  {!n.readAt && <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" />}
                </button>
              );
            })}
          </CardContent>
        </Card>
      </Page>
    </AdminGate>
  );
}
