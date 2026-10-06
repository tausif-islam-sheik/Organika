"use client";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">{children}</main>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="py-10 text-center">
        <p className="font-semibold">{title}</p>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export type Stat = { label: string; value: string; hint?: string };

export function StatCards({ stats }: { stats: Stat[] }) {
  if (!stats.length) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((c) => (
        <Card key={c.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{c.value}</div>
            {c.hint && <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
