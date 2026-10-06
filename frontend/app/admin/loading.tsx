import { Skeleton } from "../../components/ui/skeleton";

// Admin-segment loader: without this, Next.js falls back to app/loading.tsx
// (the storefront hero skeleton) on every /admin refresh or navigation.
export default function AdminLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-1.5 h-4 w-64" />
        </div>
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-8 w-12" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </main>
  );
}
