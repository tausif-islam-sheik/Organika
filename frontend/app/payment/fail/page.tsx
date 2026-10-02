export default function PayFail() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10 text-center">
      <h1 className="mt-2 text-2xl font-extrabold">Payment failed / cancelled</h1>
      <p className="mt-2 text-sm text-gray-600">Your COD order (if placed) is safe — or try online payment again.</p>
      <a href="/cart" className="mt-4 inline-block rounded-full bg-brand-600 px-6 py-2 font-semibold text-white">Back to cart</a>
    </main>
  );
}
