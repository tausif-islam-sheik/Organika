// Storefront skeleton loaders — shimmer placeholders shown while data loads.
// Works on mobile / tablet / desktop (fluid widths, responsive grids).
function Pulse({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <Pulse className="h-52 rounded-none sm:h-60" />
      <div className="space-y-2 p-3">
        <Pulse className="h-4 w-3/4" />
        <Pulse className="h-4 w-1/2" />
        <Pulse className="h-9 w-full rounded-lg!" />
      </div>
    </div>
  );
}

export function ProductRailSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="no-scrollbar flex snap-x gap-3 overflow-hidden pb-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-60 shrink-0 snap-start sm:w-72">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <main className="pb-4">
      <div className="mx-auto mt-4 max-w-[1440px] px-4">
        <Pulse className="min-h-[280px] rounded-2xl! sm:min-h-[380px]" />
      </div>
      {[0, 1, 2].map((s) => (
        <section key={s} className="mx-auto mt-10 max-w-[1440px] px-4">
          <Pulse className="h-7 w-56" />
          <Pulse className="mt-2 h-4 w-40" />
          <div className="mt-4">
            <ProductRailSkeleton />
          </div>
        </section>
      ))}
    </main>
  );
}

export function CollectionSkeleton() {
  return (
    <main className="mx-auto max-w-[1440px] px-4 py-3">
      <Pulse className="h-8 w-48" />
      <div className="mt-3 flex gap-6">
        <aside className="hidden w-60 shrink-0 md:block">
          <Pulse className="h-96 rounded-xl!" />
        </aside>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}

export function ProductDetailSkeleton() {
  return (
    <main className="mx-auto max-w-[1440px] px-4 py-4">
      <Pulse className="h-4 w-64" />
      <div className="mt-3 grid items-center gap-6 md:grid-cols-2">
        <div className="flex gap-3">
          <div className="flex w-16 shrink-0 flex-col gap-2 sm:w-20">
            {[0, 1, 2].map((i) => (
              <Pulse key={i} className="aspect-square w-full" />
            ))}
          </div>
          <Pulse className="min-h-80 flex-1 rounded-2xl!" />
        </div>
        <div className="flex flex-col gap-5 py-4">
          <Pulse className="h-6 w-40" />
          <Pulse className="h-9 w-3/4" />
          <Pulse className="h-8 w-40" />
          <Pulse className="h-4 w-full" />
          <Pulse className="h-4 w-2/3" />
          <Pulse className="h-12 w-full rounded-full!" />
          <Pulse className="h-12 w-full rounded-full!" />
        </div>
      </div>
    </main>
  );
}

export function SearchSkeleton() {
  return (
    <main className="mx-auto max-w-[1440px] px-4 py-6">
      <Pulse className="h-4 w-32" />
      <Pulse className="mt-2 h-8 w-72" />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}

export function PageSkeleton() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Pulse className="h-8 w-48" />
      <div className="mt-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <Pulse key={i} className="h-20 rounded-xl!" />
        ))}
      </div>
    </main>
  );
}

export function CheckoutSkeleton() {
  return (
    <main className="min-h-screen bg-[#eef2f7]">
      <div className="mx-auto max-w-[1280px] px-4 py-4">
        <Pulse className="h-14 rounded-xl! bg-white!" />
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <Pulse className="h-40 rounded-2xl! bg-white!" />
            <Pulse className="h-72 rounded-2xl! bg-white!" />
          </div>
          <div className="space-y-4 lg:col-span-5">
            <Pulse className="h-44 rounded-2xl! bg-white!" />
            <Pulse className="h-32 rounded-2xl! bg-white!" />
          </div>
        </div>
      </div>
    </main>
  );
}
