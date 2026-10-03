"use client";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";

export default function AdminLoginPage() {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const r = await fetch(`${api}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.message ?? "Login failed");
      window.location.href = "/admin";
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-sm items-center px-4 py-10">
      <Card className="w-full overflow-hidden p-0 shadow-xl">
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-6 pb-6 pt-7 text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
            <ShieldCheck className="size-6" />
          </span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Admin Login</h1>
          <p className="mt-0.5 text-sm text-white/85">Store administrators only.</p>
        </div>
        <CardContent className="pt-5">
          <form onSubmit={submit} className="space-y-2.5">
            <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-600/10">
              <Mail className="size-4 shrink-0 text-gray-400" />
              <Input name="email" type="email" required placeholder="Admin email" className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50/60 px-3.5 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-600/10">
              <Lock className="size-4 shrink-0 text-gray-400" />
              <Input name="password" type={showPw ? "text" : "password"} required placeholder="Password" className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="shrink-0 rounded p-1 text-gray-400 hover:text-brand-600"
              >
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <Button className="w-full bg-gradient-to-r from-brand-700 to-brand-500 py-5 font-bold shadow-lg shadow-brand-600/25 hover:brightness-110" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {busy ? "Logging in…" : "Login to Dashboard"}
            </Button>
          </form>
          {msg && <p className="mt-3 rounded-md bg-destructive/10 p-2 text-sm text-destructive">{msg}</p>}
        </CardContent>
      </Card>
    </main>
  );
}
