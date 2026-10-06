"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell, ShoppingCart, RefreshCw, TriangleAlert, CreditCard, Star, Info,
  type LucideIcon,
} from "lucide-react";
import { api } from "../admin";
import { toast } from "../ui/sonner";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";

export type Note = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
};

const TYPE_META: Record<string, { icon: LucideIcon; chip: string }> = {
  ORDER_NEW: { icon: ShoppingCart, chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  ORDER_STATUS: { icon: RefreshCw, chip: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  STOCK_LOW: { icon: TriangleAlert, chip: "bg-red-500/15 text-red-600 dark:text-red-400" },
  PAYMENT: { icon: CreditCard, chip: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  REVIEW: { icon: Star, chip: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
};

const FALLBACK_META = { icon: Info, chip: "bg-muted text-muted-foreground" };

export const noteMeta = (type: string) => TYPE_META[type] ?? FALLBACK_META;

// Only these types pop a toast — and only once per notification, ever.
const TOAST_TYPES = new Set(["ORDER_NEW", "STOCK_LOW"]);

const SEEN_KEY = "organika-note-seen";
const SYNC_EVENT = "admin-notes-sync";

// Shared across all hook instances on the page (bell + dashboard + inbox)
// so concurrent mounts never double-fetch or double-toast.
let sharedSeen: Set<string> | null = null;
let sharedBaseline = 0; // first successful fetch timestamp — older items never toast
let sharedFetch: Promise<{ list: Note[]; count: number }> | null = null;

function getSeen(): Set<string> {
  if (!sharedSeen) {
    sharedSeen = new Set();
    try {
      const raw = localStorage.getItem(SEEN_KEY);
      if (raw) for (const id of JSON.parse(raw)) sharedSeen.add(id);
    } catch {}
  }
  return sharedSeen;
}

function persistSeen() {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...getSeen()].slice(-300)));
  } catch {}
}

function fetchAll(): Promise<{ list: Note[]; count: number }> {
  if (!sharedFetch) {
    sharedFetch = Promise.all([
      api("/admin/notifications?take=20"),
      api("/admin/notifications/unread-count"),
    ])
      .then(([list, c]) => ({ list: list as Note[], count: c.count ?? 0 }))
      .finally(() => { sharedFetch = null; });
  }
  return sharedFetch;
}

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `Just now`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return formatFull(iso);
}

// Full timestamp with date + year: "06 Oct 2026 · 07:22 PM"
export function formatFull(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${date} · ${time}`;
}

export function useNotifications(pollMs = 30000) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [count, setCount] = useState(0);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const { list, count: c } = await fetchAll();
      if (!mounted.current) return;
      const seen = getSeen();
      const firstRun = sharedBaseline === 0;
      if (firstRun) sharedBaseline = Date.now();
      // Toast only genuinely NEW arrivals: created after baseline, never seen, right type.
      if (!firstRun) {
        for (const n of list) {
          if (!n.readAt && TOAST_TYPES.has(n.type) && !seen.has(n.id) && new Date(n.createdAt).getTime() > sharedBaseline) {
            if (n.type === "ORDER_NEW") toast.success(n.title, { description: n.body ?? undefined, id: `note-${n.id}` });
            else toast.warning(n.title, { description: n.body ?? undefined, id: `note-${n.id}` });
          }
          seen.add(n.id);
        }
        persistSeen();
      } else {
        for (const n of list) seen.add(n.id);
        persistSeen();
      }
      setNotes(list);
      setCount(c);
    } catch {}
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const t = setInterval(refresh, pollMs);
    // Instant cross-component sync: any mark-read refreshes every instance now.
    const onSync = () => refresh();
    window.addEventListener(SYNC_EVENT, onSync);
    return () => {
      mounted.current = false;
      clearInterval(t);
      window.removeEventListener(SYNC_EVENT, onSync);
    };
  }, [refresh, pollMs]);

  const syncOthers = () => window.dispatchEvent(new Event(SYNC_EVENT));

  const markRead = useCallback(async (id: string) => {
    try {
      await api(`/admin/notifications/${id}/read`, { method: "PATCH" });
      setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
      setCount((c) => Math.max(0, c - 1));
      syncOthers();
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api(`/admin/notifications/read-all`, { method: "PATCH" });
      setNotes((ns) => ns.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      setCount(0);
      syncOthers();
    } catch {}
  }, []);

  return { notes, count, refresh, markRead, markAllRead };
}

export function NotificationBell() {
  const { notes, count, markRead, markAllRead } = useNotifications();
  const router = useRouter();

  const open = (n: Note) => {
    if (!n.readAt) markRead(n.id);
    if (n.link) router.push(n.link);
    else router.push("/admin/notifications");
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-md" aria-label="Notifications">
          <Bell className="size-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-destructive-foreground">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications {count > 0 && `(${count} unread)`}</span>
          {count > 0 && (
            <button onClick={markAllRead} className="text-xs font-medium text-primary hover:underline">
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notes.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">No notifications yet.</p>
        )}
        {notes.slice(0, 8).map((n) => {
          const meta = TYPE_META[n.type] ?? FALLBACK_META;
          const Icon = meta.icon;
          return (
            <DropdownMenuItem key={n.id} onClick={() => open(n)} className="items-start gap-2.5 py-2.5">
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", meta.chip)}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-sm", !n.readAt && "font-bold")}>{n.title}</span>
                {n.body && <span className="block truncate text-xs text-muted-foreground">{n.body}</span>}
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {timeAgo(n.createdAt)} <span className="opacity-60">·</span> {formatFull(n.createdAt)}
                </span>
              </span>
              {!n.readAt && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/notifications" className="justify-center font-semibold text-primary">
            View all
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
