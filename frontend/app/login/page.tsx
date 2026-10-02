"use client";
import { useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [msg, setMsg] = useState("");
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg("");
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
    }
  };

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-2xl font-extrabold">{mode === "login" ? "Login" : "Create account"}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {mode === "login" ? "Welcome back to Organika." : "Join Organika for faster checkout."}
      </p>
      <form onSubmit={submit} className="mt-4 space-y-2">
        {mode === "register" && (
          <>
            <input name="name" required placeholder="Full name" className="w-full rounded border px-3 py-2 text-sm" />
            <input name="phone" pattern="01[3-9][0-9]{8}" placeholder="Phone 01XXXXXXXXX (optional)" className="w-full rounded border px-3 py-2 text-sm" />
          </>
        )}
        <input name="email" type="email" required placeholder="Email address" className="w-full rounded border px-3 py-2 text-sm" />
        <input name="password" type="password" required minLength={8} placeholder="Password (min 8 chars)" className="w-full rounded border px-3 py-2 text-sm" />
        <button className="w-full rounded-full bg-brand-600 py-2.5 font-semibold text-white">
          {mode === "login" ? "Login" : "Register"}
        </button>
      </form>
      <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setMsg(""); }} className="mt-3 w-full text-center text-sm underline">
        {mode === "login" ? "New here? Create an account" : "Have an account? Login"}
      </button>
      {msg && <p className="mt-3 rounded bg-brand-50 p-2 text-sm">{msg}</p>}
    </main>
  );
}
