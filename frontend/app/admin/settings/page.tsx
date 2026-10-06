"use client";
import { useEffect, useState } from "react";
import { AdminGate, api } from "../../../components/admin";
import { Page, PageHeader } from "../../../components/admin/page";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Skeleton } from "../../../components/ui/skeleton";
import { Separator } from "../../../components/ui/separator";
import { toast } from "../../../components/ui/sonner";

export default function AdminSettings() {
  const [store, setStore] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/admin/settings/store").then(setStore).catch(() => { setStore(null); toast.error("Failed to load settings"); });
  }, []);

  const set = (k: string, v: any) => setStore((s: any) => ({ ...s, [k]: v }));

  const save = async () => {
    if (!store) return;
    setSaving(true);
    try {
      const payload = {
        ...store,
        freeShipDhakaOver: Number(store.freeShipDhakaOver ?? 0),
        insideDhakaCharge: Number(store.insideDhakaCharge ?? 0),
        outsideDhakaCharge: Number(store.outsideDhakaCharge ?? 0),
      };
      await api("/admin/settings/store", { method: "PATCH", body: JSON.stringify({ value: payload }) });
      toast.success("Store settings saved — header updates within a minute");
    } catch { toast.error("Save failed"); }
    setSaving(false);
  };

  return (
    <AdminGate>
      <Page>
        <PageHeader title="Settings" sub="Store info shown in the header, footer and checkout" actions={<Button onClick={save} disabled={saving || !store}>{saving ? "Saving…" : "Save settings"}</Button>} />
        {!store ? <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-40" />)}</div> : (
          <>
            <Card>
              <CardHeader><CardTitle>Contact</CardTitle><CardDescription>Hotline and WhatsApp appear in the header, footer and floating buttons.</CardDescription></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Hotline</Label><Input value={store.hotline ?? ""} onChange={(e) => set("hotline", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>WhatsApp</Label><Input value={store.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Announcement bar (COD text)</Label><Input value={store.codText ?? ""} onChange={(e) => set("codText", e.target.value)} /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Shipping defaults</CardTitle><CardDescription>Reference values in paisa — the Delivery page controls actual checkout quotes.</CardDescription></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5"><Label>Inside Dhaka (paisa)</Label><Input type="number" value={store.insideDhakaCharge ?? 0} onChange={(e) => set("insideDhakaCharge", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Outside Dhaka (paisa)</Label><Input type="number" value={store.outsideDhakaCharge ?? 0} onChange={(e) => set("outsideDhakaCharge", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Free over in Dhaka (paisa)</Label><Input type="number" value={store.freeShipDhakaOver ?? 0} onChange={(e) => set("freeShipDhakaOver", e.target.value)} /></div>
              </CardContent>
            </Card>
            <Separator />
            <p className="text-xs text-muted-foreground">Homepage sections are edited on the Homepage page. Staff roles live on the Staff page.</p>
          </>
        )}
      </Page>
    </AdminGate>
  );
}
