"use client";
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";

export default function StaffLoginPage() {
  const [msg, setMsg] = useState("");
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg("");
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
    }
  };

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Staff Login</CardTitle>
          <CardDescription>Admins, managers and packers only.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-2">
            <Input name="email" type="email" required placeholder="Staff email" />
            <Input name="password" type="password" required placeholder="Password" />
            <Button className="w-full">Login to Dashboard</Button>
          </form>
          {msg && <p className="mt-3 rounded-md bg-destructive/10 p-2 text-sm text-destructive">{msg}</p>}
        </CardContent>
      </Card>
    </main>
  );
}
