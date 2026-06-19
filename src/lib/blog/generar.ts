import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { geminiAdapter } from "@/lib/adapters/gemini";
import { readingTime, htmlToText, sanitizeHtml } from "@/lib/blog/utils";

/**
 * Genera el contenido de un artículo con IA y lo guarda. Sin guard de auth: lo
 * usan tanto la acción de superadmin (que ya valida) como el cron (que valida
 * con CRON_SECRET). Devuelve {error} o {ok}.
 */
export async function generarContenidoPost(id: string, opts?: { publicar?: boolean }): Promise<{ error?: string; ok?: boolean }> {
  const supabase = createServiceClient();

  const { data: post } = await supabase.from("blog_posts").select("*, blog_categories(nombre)").eq("id", id).maybeSingle();
  if (!post) return { error: "Artículo no encontrado." };

  const brief = (post.ai_brief as { topic?: string } | null)?.topic;
  const tema = brief || post.target_keyword || post.titulo;
  if (!tema) return { error: "Sin tema, keyword o título para generar." };

  try {
    const art = await geminiAdapter.generarArticuloBlog({
      titulo: post.titulo,
      tema,
      keyword: post.target_keyword ?? undefined,
      keywordsSecundarias: post.secondary_keywords ?? undefined,
      categoria: (post.blog_categories as { nombre?: string } | null)?.nombre,
    });
    art.contenidoHtml = sanitizeHtml(art.contenidoHtml);

    // Imagen de portada con IA (si no hay una ya y estamos en modo live).
    // Degradación elegante: si falla, el artículo se guarda igualmente sin imagen.
    let featured_image_url = post.featured_image_url;
    let featured_image_alt = post.featured_image_alt;
    if (!featured_image_url && process.env.GEMINI_MODE === "live" && art.imagenBrief) {
      try {
        const img = await geminiAdapter.generarImagen(art.imagenBrief);
        if (img?.data) {
          const ext = (img.mimeType.split("/")[1] || "png").replace("jpeg", "jpg");
          const path = `${new Date().getFullYear()}/ai/${post.slug}-${Date.now()}.${ext}`;
          const buffer = Buffer.from(img.data, "base64");
          const { error: upErr } = await supabase.storage.from("blog-images").upload(path, buffer, { contentType: img.mimeType, upsert: false });
          if (!upErr) {
            featured_image_url = supabase.storage.from("blog-images").getPublicUrl(path).data.publicUrl;
            featured_image_alt = art.imagenAlt || post.titulo;
          }
        }
      } catch (imgErr) {
        console.error("[BLOG GEN] imagen falló (se continúa sin portada):", imgErr instanceof Error ? imgErr.message : imgErr);
      }
    }

    // Tras generar con éxito: si se pide publicar → published; si ya estaba
    // publicado, se mantiene; en cualquier otro caso (borrador, programado,
    // fallido) queda en borrador para revisar.
    const status = opts?.publicar ? "published" : (post.status === "published" ? "published" : "draft");
    const { error } = await supabase.from("blog_posts").update({
      titulo: art.titulo || post.titulo,
      excerpt: art.excerpt || htmlToText(art.contenidoHtml),
      contenido_html: art.contenidoHtml,
      reading_time_min: readingTime(art.contenidoHtml),
      meta_title: art.metaTitle || post.meta_title,
      meta_description: art.metaDescription || post.meta_description,
      tags: art.tags.length ? art.tags : post.tags,
      featured_image_url,
      featured_image_alt,
      ai_generated: true,
      ai_model: process.env.GEMINI_MODE === "live" ? "gemini-2.5-flash" : "mock",
      status,
      ...(status === "published" ? { published_at: new Date().toISOString(), scheduled_at: null } : {}),
    }).eq("id", id);
    if (error) return { error: "Generado, pero no se pudo guardar." };
    return { ok: true };
  } catch (e) {
    console.error("[BLOG GEN] modo:", process.env.GEMINI_MODE, "error:", e instanceof Error ? e.message : e);
    await supabase.from("blog_posts").update({ status: "generation_failed" }).eq("id", id);
    return { error: `Falló la generación con IA: ${e instanceof Error ? e.message : "error"}` };
  }
}
