import { createServiceClient } from "@/lib/supabase/server";
import { PageTitle } from "../_components/ui";
import { BlogListClient, type PostRow } from "./blog-list-client";

export const dynamic = "force-dynamic";

export default async function BlogAdminPage() {
  const supabase = createServiceClient();
  const [postsRes, catsRes] = await Promise.all([
    supabase.from("blog_posts").select("id, titulo, slug, status, category_id, scheduled_at, published_at, updated_at, ai_generated, reading_time_min").order("updated_at", { ascending: false }).limit(300),
    supabase.from("blog_categories").select("id, nombre").order("orden"),
  ]);

  const catName = new Map((catsRes.data ?? []).map((c) => [c.id, c.nombre]));
  const rows: PostRow[] = (postsRes.data ?? []).map((p) => ({
    id: p.id,
    titulo: p.titulo,
    slug: p.slug,
    status: p.status,
    categoria: p.category_id ? catName.get(p.category_id) ?? "—" : "—",
    scheduled_at: p.scheduled_at,
    published_at: p.published_at,
    updated_at: p.updated_at,
    ai_generated: p.ai_generated,
    reading_time_min: p.reading_time_min,
  }));

  return (
    <div>
      <PageTitle title="Blog" subtitle={`${rows.length} artículos · CMS y calendario editorial con IA.`} />
      <BlogListClient rows={rows} />
    </div>
  );
}
