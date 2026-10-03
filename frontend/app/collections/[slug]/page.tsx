import { getCollection, getCategories, DEMO_CATEGORIES } from "../../../lib/shop";
import { CollectionView } from "../../../components/collection-view";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Full pool — CollectionView filters it by the checked categories (multi-select).
  const [pool, cats] = await Promise.all([getCollection("all"), getCategories()]);
  const cat = cats.find((c) => c.slug === slug) ?? DEMO_CATEGORIES.find((c) => c.slug === slug);
  const liveSlugs = new Set(cats.map((c) => c.slug));
  const allCats = [...cats, ...DEMO_CATEGORIES.filter((c) => !liveSlugs.has(c.slug))];
  return <CollectionView products={pool} cats={allCats} slug={slug} title={cat?.name ?? "All Products"} />;
}
