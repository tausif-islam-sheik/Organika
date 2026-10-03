"use client";
import Link from "next/link";
import { useState } from "react";
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2, Leaf, ArrowLeft } from "lucide-react";

function Field({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="group flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-600/10">
      <span className="shrink-0 text-gray-400 transition group-focus-within:text-brand-600">{icon}</span>
      {children}
    </label>
  );
}

const fieldInput =
  "w-full bg-transparent py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const isLogin = mode === "login";

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const r = await fetch(`${api}/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          password: fd.get("password"),
          phone: fd.get("phone") || undefined,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.message ?? "Failed");
      window.location.href = "/";
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setMsg("");
    setShowPw(false);
  };

  return (
    <main className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-amber-50 px-4 py-10 sm:py-14">
      {/* decorative blobs */}
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-2xl shadow-brand-700/10 backdrop-blur">
          {/* brand header */}
          <div className="relative bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-7 pb-7 pt-8 text-white">
            <div aria-hidden className="absolute -right-8 -top-10 text-[120px] leading-none opacity-15">
              <Leaf className="size-28" />
            </div>
            <Link href="/" className="text-3xl font-extrabold tracking-tight">
              Organika<span className="text-accent-400">.</span>
            </Link>
            <p className="mt-1 text-sm text-white/85">
              {isLogin ? "Welcome back — fresh picks are waiting." : "Join Organika for faster checkout & offers."}
            </p>
            {/* segmented switch */}
            <div className="mt-5 grid grid-cols-2 rounded-full bg-black/20 p-1 text-sm font-semibold">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`rounded-full py-2 capitalize transition ${mode === m ? "bg-white text-brand-700 shadow" : "text-white/80 hover:text-white"}`}
                >
                  {m === "login" ? "Login" : "Register"}
                </button>
              ))}
            </div>
          </div>

          {/* form */}
          <form onSubmit={submit} className="space-y-3 px-7 py-7">
            <h1 className="text-xl font-extrabold text-gray-900">
              {isLogin ? "Login to your account" : "Create your account"}
            </h1>

            {!isLogin && (
              <>
                <Field icon={<User className="size-4" />}>
                  <input name="name" required placeholder="Full name" autoComplete="name" className={fieldInput} />
                </Field>
                <Field icon={<Phone className="size-4" />}>
                  <input
                    name="phone"
                    inputMode="numeric"
                    pattern="01[3-9][0-9]{8}"
                    title="11 digits starting with 01 (e.g. 01712345678)"
                    placeholder="Phone 01XXXXXXXXX (optional)"
                    autoComplete="tel"
                    className={fieldInput}
                  />
                </Field>
              </>
            )}

            <Field icon={<Mail className="size-4" />}>
              <input name="email" type="email" required placeholder="Email address" autoComplete="email" className={fieldInput} />
            </Field>

            <Field icon={<Lock className="size-4" />}>
              <input
                name="password"
                type={showPw ? "text" : "password"}
                required
                minLength={8}
                placeholder={isLogin ? "Password" : "Password (min 8 characters)"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className={`${fieldInput} pr-1`}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="shrink-0 rounded p-1 text-gray-400 hover:text-brand-600"
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </Field>

            {isLogin && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex cursor-pointer items-center gap-1.5 text-gray-500">
                  <input type="checkbox" defaultChecked className="size-3.5 accent-brand-600" />
                  Remember me
                </label>
                <span className="cursor-pointer font-semibold text-brand-700 hover:underline">Forgot password?</span>
              </div>
            )}

            {msg && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{msg}</p>
            )}

            <button
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-700 to-brand-500 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:brightness-110 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {busy ? "Please wait…" : isLogin ? "Login" : "Create account"}
            </button>

            {!isLogin && (
              <p className="text-center text-xs leading-relaxed text-gray-500">
                By registering you agree to our Terms, Privacy Policy & Refund Policy.
              </p>
            )}
          </form>
        </div>

        <button
          onClick={() => switchMode(isLogin ? "register" : "login")}
          className="mt-4 w-full text-center text-sm text-gray-600"
        >
          {isLogin ? (
            <>New here? <span className="font-bold text-brand-700 hover:underline">Create an account</span></>
          ) : (
            <>Have an account? <span className="font-bold text-brand-700 hover:underline">Login</span></>
          )}
        </button>
        <Link href="/" className="mt-3 flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-brand-700">
          <ArrowLeft className="size-4" /> Back to shopping
        </Link>
      </div>
    </main>
  );
}
