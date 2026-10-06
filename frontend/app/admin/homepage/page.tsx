"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminGate, api } from "../../../components/admin";
import { Page, PageHeader } from "../../../components/admin/page";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Switch } from "../../../components/ui/switch";
import { Textarea } from "../../../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Skeleton } from "../../../components/ui/skeleton";
import { Separator } from "../../../components/ui/separator";
import { toast } from "../../../components/ui/sonner";
import type { HomepageConfig } from "../../../lib/shop";

const SOURCES = ["best", "new", "keyword:Honey", "keyword:Gur,Jaggery", "keyword:Oil,Ghee", "keyword:Turmeric,Chili,Cumin", "keyword:Rice,Lentil", "keyword:Almond,Cashew,Raisin"];

export default function AdminHomepage() {
  const [cfg, setCfg] = useState<HomepageConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/admin/settings/homepage").then(setCfg).catch(() => { setCfg(null); toast.error("Failed to load homepage config"); });
  }, []);

  const patch = (p: Partial<HomepageConfig>) => setCfg((c) => (c ? { ...c, ...p } : c));

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    try {
      await api("/admin/settings/homepage", { method: "PATCH", body: JSON.stringify({ value: cfg }) });
      toast.success("Homepage published — storefront updates within a minute");
    } catch { toast.error("Publish failed"); }
    setSaving(false);
  };

  const reload = async () => {
    try { setCfg(await api("/admin/settings/homepage")); toast.success("Reloaded — unsaved edits discarded"); }
    catch { toast.error("Reload failed"); }
  };

  return (
    <AdminGate>
      <Page>
        <PageHeader
          title="Homepage"
          sub="Every storefront section is editable — toggle, reorder content, publish"
          actions={
            <>
              <Button variant="outline" size="sm" onClick={reload}>Discard edits</Button>
              <Button size="sm" onClick={save} disabled={saving || !cfg}>{saving ? "Publishing…" : "Publish"}</Button>
            </>
          }
        />
        {!cfg ? <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-48" />)}</div> : (
          <Tabs defaultValue="hero">
            <TabsList>
              <TabsTrigger value="hero">Hero</TabsTrigger>
              <TabsTrigger value="featured">Categories</TabsTrigger>
              <TabsTrigger value="rails">Product rails</TabsTrigger>
              <TabsTrigger value="offers">Banners</TabsTrigger>
              <TabsTrigger value="trust">Trust</TabsTrigger>
              <TabsTrigger value="reviews">Testimonials</TabsTrigger>
            </TabsList>

            <TabsContent value="hero">
              <Card>
                <CardHeader><CardTitle>Announcement + hero slides</CardTitle><CardDescription>The top strip and the rotating banners.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5"><Label>Announcement bar</Label><Input value={cfg.announcement} onChange={(e) => patch({ announcement: e.target.value })} /></div>
                  <Separator />
                  {cfg.hero.map((h, i) => (
                    <div key={i} className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">Slide {i + 1}</span>
                        <span className="ml-auto flex items-center gap-2">
                          <Switch checked={h.enabled} onCheckedChange={(v) => { const hero = [...cfg.hero]; hero[i] = { ...hero[i], enabled: v }; patch({ hero }); }} />
                          <Button variant="ghost" size="icon" onClick={() => patch({ hero: cfg.hero.filter((_, k) => k !== i) })}><Trash2 className="size-4" /></Button>
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1.5"><Label>Title</Label><Input value={h.title} onChange={(e) => { const hero = [...cfg.hero]; hero[i] = { ...hero[i], title: e.target.value }; patch({ hero }); }} /></div>
                        <div className="space-y-1.5"><Label>CTA link</Label><Input value={h.href} onChange={(e) => { const hero = [...cfg.hero]; hero[i] = { ...hero[i], href: e.target.value }; patch({ hero }); }} /></div>
                        <div className="space-y-1.5 sm:col-span-2"><Label>Subtitle</Label><Input value={h.subtitle} onChange={(e) => { const hero = [...cfg.hero]; hero[i] = { ...hero[i], subtitle: e.target.value }; patch({ hero }); }} /></div>
                        <div className="space-y-1.5"><Label>Button text</Label><Input value={h.cta} onChange={(e) => { const hero = [...cfg.hero]; hero[i] = { ...hero[i], cta: e.target.value }; patch({ hero }); }} /></div>
                        <div className="space-y-1.5"><Label>Gradient (tailwind)</Label><Input value={h.gradient} onChange={(e) => { const hero = [...cfg.hero]; hero[i] = { ...hero[i], gradient: e.target.value }; patch({ hero }); }} /></div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => patch({ hero: [...cfg.hero, { title: "New headline", subtitle: "Short supporting line.", cta: "Shop Now", href: "/collections/all", gradient: "from-brand-700 to-brand-500", enabled: true }] })}>
                    <Plus /> Add slide
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="featured">
              <Card>
                <CardHeader><CardTitle>Featured categories</CardTitle><CardDescription>Circle row under the hero.</CardDescription></CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label>Title</Label><Input value={cfg.featuredCategories.title} onChange={(e) => patch({ featuredCategories: { ...cfg.featuredCategories, title: e.target.value } })} /></div>
                  <div className="space-y-1.5"><Label>Subtitle</Label><Input value={cfg.featuredCategories.sub} onChange={(e) => patch({ featuredCategories: { ...cfg.featuredCategories, sub: e.target.value } })} /></div>
                  <div className="space-y-1.5"><Label>Max shown</Label><Input type="number" value={cfg.featuredCategories.limit} onChange={(e) => patch({ featuredCategories: { ...cfg.featuredCategories, limit: Number(e.target.value) } })} /></div>
                  <div className="flex items-center gap-2"><Switch checked={cfg.featuredCategories.enabled} onCheckedChange={(v) => patch({ featuredCategories: { ...cfg.featuredCategories, enabled: v } })} /><Label>Section visible</Label></div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rails">
              <Card>
                <CardHeader><CardTitle>Product rails</CardTitle><CardDescription>Sources: best = top sellers, new = new arrivals, keyword:X = name match.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {cfg.rails.map((r, i) => (
                    <div key={r.id} className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{r.title || `Rail ${i + 1}`}</span>
                        <span className="ml-auto flex items-center gap-2">
                          <Switch checked={r.enabled} onCheckedChange={(v) => { const rails = [...cfg.rails]; rails[i] = { ...rails[i], enabled: v }; patch({ rails }); }} />
                          <Button variant="ghost" size="icon" onClick={() => patch({ rails: cfg.rails.filter((_, k) => k !== i) })}><Trash2 className="size-4" /></Button>
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1.5"><Label>Title</Label><Input value={r.title} onChange={(e) => { const rails = [...cfg.rails]; rails[i] = { ...rails[i], title: e.target.value }; patch({ rails }); }} /></div>
                        <div className="space-y-1.5"><Label>Subtitle</Label><Input value={r.sub} onChange={(e) => { const rails = [...cfg.rails]; rails[i] = { ...rails[i], sub: e.target.value }; patch({ rails }); }} /></div>
                        <div className="space-y-1.5"><Label>Source</Label><Input list="rail-sources" value={r.source} onChange={(e) => { const rails = [...cfg.rails]; rails[i] = { ...rails[i], source: e.target.value }; patch({ rails }); }} /></div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5"><Label>See-all link</Label><Input value={r.href} onChange={(e) => { const rails = [...cfg.rails]; rails[i] = { ...rails[i], href: e.target.value }; patch({ rails }); }} /></div>
                          <div className="space-y-1.5"><Label>Limit</Label><Input type="number" value={r.limit} onChange={(e) => { const rails = [...cfg.rails]; rails[i] = { ...rails[i], limit: Number(e.target.value) }; patch({ rails }); }} /></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <datalist id="rail-sources">{SOURCES.map((s) => <option key={s} value={s} />)}</datalist>
                  <Button variant="outline" size="sm" onClick={() => patch({ rails: [...cfg.rails, { id: `rail-${Date.now()}`, title: "New rail", sub: "", source: "best", href: "/collections/all", limit: 10, enabled: true }] })}>
                    <Plus /> Add rail
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="offers">
              <Card>
                <CardHeader><CardTitle>Offer banners</CardTitle><CardDescription>Banner 1 sits after the first rail; banner 2 shows trust badges below it.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {cfg.offerBanners.map((b, i) => (
                    <div key={i} className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">Banner {i + 1}</span>
                        <span className="ml-auto flex items-center gap-2">
                          <Switch checked={b.enabled} onCheckedChange={(v) => { const offerBanners = [...cfg.offerBanners]; offerBanners[i] = { ...offerBanners[i], enabled: v }; patch({ offerBanners }); }} />
                          <Button variant="ghost" size="icon" onClick={() => patch({ offerBanners: cfg.offerBanners.filter((_, k) => k !== i) })}><Trash2 className="size-4" /></Button>
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1.5"><Label>Kicker</Label><Input value={b.kicker} onChange={(e) => { const offerBanners = [...cfg.offerBanners]; offerBanners[i] = { ...offerBanners[i], kicker: e.target.value }; patch({ offerBanners }); }} /></div>
                        <div className="space-y-1.5"><Label>Link</Label><Input value={b.href} onChange={(e) => { const offerBanners = [...cfg.offerBanners]; offerBanners[i] = { ...offerBanners[i], href: e.target.value }; patch({ offerBanners }); }} /></div>
                        <div className="space-y-1.5 sm:col-span-2"><Label>Title</Label><Input value={b.title} onChange={(e) => { const offerBanners = [...cfg.offerBanners]; offerBanners[i] = { ...offerBanners[i], title: e.target.value }; patch({ offerBanners }); }} /></div>
                        <div className="space-y-1.5"><Label>Button</Label><Input value={b.cta} onChange={(e) => { const offerBanners = [...cfg.offerBanners]; offerBanners[i] = { ...offerBanners[i], cta: e.target.value }; patch({ offerBanners }); }} /></div>
                        <div className="space-y-1.5"><Label>Gradient</Label><Input value={b.gradient} onChange={(e) => { const offerBanners = [...cfg.offerBanners]; offerBanners[i] = { ...offerBanners[i], gradient: e.target.value }; patch({ offerBanners }); }} /></div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => patch({ offerBanners: [...cfg.offerBanners, { kicker: "Offer", title: "New offer", cta: "Shop now", href: "/collections/all", gradient: "from-brand-700 to-brand-500", enabled: true }] })}>
                    <Plus /> Add banner
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trust">
              <Card>
                <CardHeader><CardTitle>Trust badges</CardTitle><CardDescription>Shown inside banner 2, or as a grid when banner 2 is off.</CardDescription></CardHeader>
                <CardContent className="space-y-2">
                  {cfg.trustBadges.map((t, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
                      <Input className="min-w-32 flex-1" value={t.title} onChange={(e) => { const trustBadges = [...cfg.trustBadges]; trustBadges[i] = { ...trustBadges[i], title: e.target.value }; patch({ trustBadges }); }} />
                      <Input className="min-w-40 flex-1" value={t.sub} onChange={(e) => { const trustBadges = [...cfg.trustBadges]; trustBadges[i] = { ...trustBadges[i], sub: e.target.value }; patch({ trustBadges }); }} />
                      <Switch checked={t.enabled} onCheckedChange={(v) => { const trustBadges = [...cfg.trustBadges]; trustBadges[i] = { ...trustBadges[i], enabled: v }; patch({ trustBadges }); }} />
                      <Button variant="ghost" size="icon" onClick={() => patch({ trustBadges: cfg.trustBadges.filter((_, k) => k !== i) })}><Trash2 className="size-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => patch({ trustBadges: [...cfg.trustBadges, { title: "New badge", sub: "Short line", enabled: true }] })}><Plus /> Add badge</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <Card>
                <CardHeader><CardTitle>Testimonials</CardTitle><CardDescription>Static quotes on the homepage (product reviews are moderated separately).</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {cfg.testimonials.map((t, i) => (
                    <div key={i} className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{t.name || `Quote ${i + 1}`}</span>
                        <span className="ml-auto flex items-center gap-2">
                          <Switch checked={t.enabled} onCheckedChange={(v) => { const testimonials = [...cfg.testimonials]; testimonials[i] = { ...testimonials[i], enabled: v }; patch({ testimonials }); }} />
                          <Button variant="ghost" size="icon" onClick={() => patch({ testimonials: cfg.testimonials.filter((_, k) => k !== i) })}><Trash2 className="size-4" /></Button>
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="space-y-1.5"><Label>Name</Label><Input value={t.name} onChange={(e) => { const testimonials = [...cfg.testimonials]; testimonials[i] = { ...testimonials[i], name: e.target.value }; patch({ testimonials }); }} /></div>
                        <div className="space-y-1.5"><Label>Role</Label><Input value={t.role} onChange={(e) => { const testimonials = [...cfg.testimonials]; testimonials[i] = { ...testimonials[i], role: e.target.value }; patch({ testimonials }); }} /></div>
                        <div className="space-y-1.5"><Label>Area</Label><Input value={t.area} onChange={(e) => { const testimonials = [...cfg.testimonials]; testimonials[i] = { ...testimonials[i], area: e.target.value }; patch({ testimonials }); }} /></div>
                      </div>
                      <div className="space-y-1.5"><Label>Quote</Label><Textarea value={t.text} onChange={(e) => { const testimonials = [...cfg.testimonials]; testimonials[i] = { ...testimonials[i], text: e.target.value }; patch({ testimonials }); }} /></div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => patch({ testimonials: [...cfg.testimonials, { name: "New customer", role: "", area: "Dhaka", text: "", enabled: true }] })}><Plus /> Add quote</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </Page>
    </AdminGate>
  );
}
