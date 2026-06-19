import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { BlogFormClient, type PostFull } from "../blog-form-client";

export const dynamic = "force-dynamic";

export default async function EditarPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const [postRes, catsRes] = await Promise.all([
    supabase.from("blog_posts").select("*").eq("id", id).maybeSingle(),
    supabase.from("blog_categories").select("id, nombre").order("orden"),
  ]);
  const p = postRes.data;
  if (!p) notFound();

  const post: PostFull = {
    id: p.id,
    titulo: p.titulo,
    slug: p.slug,
    excerpt: p.excerpt,
    contenido_html: p.contenido_html,
    category_id: p.category_id,
    tags: p.tags ?? [],
    meta_title: p.meta_title,
    meta_description: p.meta_description,
    target_keyword: p.target_keyword,
    secondary_keywords: p.secondary_keywords ?? [],
    featured_image_url: p.featured_image_url,
    featured_image_alt: p.featured_image_alt,
    status: p.status,
    scheduled_at: p.scheduled_at,
    ai_brief: (p.ai_brief as { topic?: string } | null) ?? null,
  };

  // key con updated_at: tras generar/guardar, router.refresh() trae props frescos
  // y el cambio de key remonta el formulario con el contenido actualizado.
  return <BlogFormClient key={p.updated_at} post={post} categorias={catsRes.data ?? []} />;
}
