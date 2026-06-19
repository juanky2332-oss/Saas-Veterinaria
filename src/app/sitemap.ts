import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/server";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://clinicomatic.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const estaticas: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/precios`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const supabase = createPublicClient();
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(500);
    const articulos: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at ?? p.published_at ?? now),
      changeFrequency: "monthly",
      priority: 0.7,
    }));
    return [...estaticas, ...articulos];
  } catch {
    return estaticas;
  }
}
