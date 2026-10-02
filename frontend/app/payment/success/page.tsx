export default async function PaySuccess({ searchParams }: { searchParams: Promise<{ tran?: string }> }) {
  const { tran } = await searchParams;
  return (
    <main className="mx-auto max-w-xl px-4 py-10 text-center">
      <div className="text-5xl">✓</div>
      <h1 className="mt-2 text-2xl font-extrabold">Payment received</h1>
      <p className="mt-2 text-sm text-gray-600">Transaction {tran ?? ""} — we confirm by server IPN, not this page.</p>
      <a href="/track-order" className="mt-4 inline-block rounded-full bg-brand-600 px-6 py-2 font-semibold text-white">Track Order</a>
    </main>
  );
}
