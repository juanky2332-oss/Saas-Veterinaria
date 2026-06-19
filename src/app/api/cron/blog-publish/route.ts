import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generarContenidoPost } from "@/lib/blog/generar";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron de publicación del blog. Busca artículos programados cuya fecha ya venció,
 * genera el contenido con IA (si falta) y los publica. Protegido por CRON_SECRET.
 * Configurado en vercel.json (cada 5 min).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const ahora = new Date().toISOString();

  const { data: pendientes } = await supabase
    .from("blog_posts")
    .select("id, titulo, contenido_html")
    .eq("status", "scheduled")
    .lte("scheduled_at", ahora)
    .limit(5);

  const resultados: { id: string; titulo: string; ok: boolean; error?: string }[] = [];
  for (const post of pendientes ?? []) {
    // Lock optimista: pasa a draft solo si sigue scheduled (evita doble proceso).
    const { data: locked } = await supabase
      .from("blog_posts")
      .update({ status: "draft" })
      .eq("id", post.id)
      .eq("status", "scheduled")
      .select("id")
      .maybeSingle();
    if (!locked) continue;

    // Si ya tiene contenido, solo publica; si no, genera y publica.
    if (post.contenido_html && post.contenido_html.trim().length > 50) {
      const { error } = await supabase.from("blog_posts").update({ status: "published", published_at: ahora, scheduled_at: null }).eq("id", post.id);
      resultados.push({ id: post.id, titulo: post.titulo, ok: !error, error: error?.message });
    } else {
      const res = await generarContenidoPost(post.id, { publicar: true });
      resultados.push({ id: post.id, titulo: post.titulo, ok: !res.error, error: res.error });
    }
  }

  return NextResponse.json({ procesados: resultados.length, resultados, at: ahora });
}
