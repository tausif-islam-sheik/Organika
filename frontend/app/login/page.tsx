"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2, Leaf, ArrowLeft, CheckCircle2 } from "lucide-react";

const inputCls =
  "w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-gray-400";

function Field({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 transition focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/15">
      <span className="shrink-0 text-gray-400">{icon}</span>
      {children}
    </label>
  );
}

type Mode = "login" | "register" | "forgot" | "reset";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [msg, setMsg] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [devToken, setDevToken] = useState("");
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const isLogin = mode === "login";

  // If URL has ?token=..., open the reset-password form directly
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    if (t) {
      setResetToken(t);
      setMode("reset");
    }
  }, []);

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

  const submitForgot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg("");
    setInfo("");
    setDevToken("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const r = await fetch(`${api}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fd.get("email") }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.message ?? "Failed");
      setInfo("If an account exists for this email, a reset link was sent. It expires in 1 hour.");
      // Dev mode: backend returns the raw token so the flow can be completed without email
      if (j.resetToken) setDevToken(j.resetToken);
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg("");
    setInfo("");
    const fd = new FormData(e.currentTarget);
    const pw = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    if (pw.length < 8) {
      setMsg("Password must be at least 8 characters.");
      return;
    }
    if (pw !== confirm) {
      setMsg("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`${api}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password: pw }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.message ?? "Failed");
      setInfo("Password changed successfully. You can now login.");
      setResetToken("");
      window.history.replaceState(null, "", "/login");
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setMsg("");
    setInfo("");
    setDevToken("");
    setShowPw(false);
  };

  const title =
    mode === "login"
      ? "Welcome back, login to continue."
      : mode === "register"
        ? "Create your account."
        : mode === "forgot"
          ? "Reset your password."
          : "Choose a new password.";

  return (
    <main className="bg-brand-50/60 px-4 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Leaf className="size-5" />
            </span>
            <div>
              <div className="text-lg font-extrabold text-gray-900">
                Organika<span className="text-brand-600">.</span>
              </div>
              <p className="text-sm text-gray-500">{title}</p>
            </div>
          </div>

          {(mode === "login" || mode === "register") && (
            <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 text-sm font-semibold">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`rounded-md py-2 capitalize transition ${
                    mode === m
                      ? "bg-white text-brand-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {m === "login" ? "Login" : "Register"}
                </button>
              ))}
            </div>
          )}

          {(mode === "login" || mode === "register") && (
            <form onSubmit={submit} className="mt-5 space-y-3">
              {mode === "register" && (
                <>
                  <Field icon={<User className="size-4" />}>
                    <input name="name" required placeholder="Full name" autoComplete="name" className={inputCls} />
                  </Field>
                  <Field icon={<Phone className="size-4" />}>
                    <input
                      name="phone"
                      inputMode="numeric"
                      pattern="01[3-9][0-9]{8}"
                      title="11 digits starting with 01 (e.g. 01712345678)"
                      placeholder="Phone 01XXXXXXXXX (optional)"
                      autoComplete="tel"
                      className={inputCls}
                    />
                  </Field>
                </>
              )}

              <Field icon={<Mail className="size-4" />}>
                <input name="email" type="email" required placeholder="Email address" autoComplete="email" className={inputCls} />
              </Field>

              <Field icon={<Lock className="size-4" />}>
                <input
                  name="password"
                  type={showPw ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder={isLogin ? "Password" : "Password (min 8 characters)"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className={`${inputCls} pr-1`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="shrink-0 rounded p-1 text-gray-400 hover:text-brand-700"
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
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {msg && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{msg}</p>
              )}

              <button
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                {busy ? "Please wait…" : isLogin ? "Login" : "Create account"}
              </button>

              {mode === "register" && (
                <p className="text-center text-xs leading-relaxed text-gray-500">
                  By registering you agree to our Terms, Privacy Policy & Refund Policy.
                </p>
              )}
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={submitForgot} className="mt-5 space-y-3">
              <Field icon={<Mail className="size-4" />}>
                <input name="email" type="email" required placeholder="Enter your account email" autoComplete="email" className={inputCls} />
              </Field>

              {msg && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{msg}</p>
              )}
              {info && (
                <p className="flex items-start gap-2 rounded-lg border border-brand-600/20 bg-brand-50 px-3 py-2 text-sm text-brand-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  {info}
                </p>
              )}
              {devToken && (
                <Link
                  href={`/login?token=${devToken}`}
                  onClick={() => {
                    setResetToken(devToken);
                    switchMode("reset");
                  }}
                  className="block rounded-lg border border-dashed border-brand-600/40 bg-white px-3 py-2 text-center text-sm font-semibold text-brand-700 hover:bg-brand-50"
                >
                  Continue to reset password (dev — no email configured)
                </Link>
              )}

              <button
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                {busy ? "Sending…" : "Send reset link"}
              </button>

              <button
                type="button"
                onClick={() => switchMode("login")}
                className="flex w-full items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-brand-700"
              >
                <ArrowLeft className="size-4" /> Back to login
              </button>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={submitReset} className="mt-5 space-y-3">
              <Field icon={<Lock className="size-4" />}>
                <input
                  name="password"
                  type={showPw ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="New password (min 8 characters)"
                  autoComplete="new-password"
                  className={`${inputCls} pr-1`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="shrink-0 rounded p-1 text-gray-400 hover:text-brand-700"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </Field>
              <Field icon={<Lock className="size-4" />}>
                <input
                  name="confirm"
                  type={showPw ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  className={inputCls}
                />
              </Field>

              {msg && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{msg}</p>
              )}
              {info && (
                <p className="flex items-start gap-2 rounded-lg border border-brand-600/20 bg-brand-50 px-3 py-2 text-sm text-brand-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  {info}
                </p>
              )}

              {info ? (
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
                >
                  Back to login
                </button>
              ) : (
                <button
                  disabled={busy || !resetToken}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  {busy ? "Saving…" : "Set new password"}
                </button>
              )}
              {!resetToken && !info && (
                <p className="text-center text-xs text-gray-500">
                  Missing or expired link?{" "}
                  <button type="button" onClick={() => switchMode("forgot")} className="font-semibold text-brand-700 hover:underline">
                    Request a new one
                  </button>
                </p>
              )}
            </form>
          )}
        </div>

        {(mode === "login" || mode === "register") && (
          <button
            onClick={() => switchMode(isLogin ? "register" : "login")}
            className="mt-4 w-full text-center text-sm text-gray-600"
          >
            {isLogin ? (
              <>New here? <span className="font-semibold text-brand-700 hover:underline">Create an account</span></>
            ) : (
              <>Have an account? <span className="font-semibold text-brand-700 hover:underline">Login</span></>
            )}
          </button>
        )}
        <Link href="/" className="mt-2 block text-center text-sm text-gray-500 hover:text-brand-700 hover:underline">
          Back to home
        </Link>
      </div>
    </main>
  );
}
