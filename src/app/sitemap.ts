import type { MetadataRoute } from "next";
import { getCategories, getProductSlugs } from "@/lib/catalog";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProductSlugs(), getCategories()]);
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/productos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/contacto`, changeFrequency: "monthly", priority: 0.5 },
    ...categories.map((c) => ({
      url: `${base}/productos?categoria=${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${base}/productos/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
