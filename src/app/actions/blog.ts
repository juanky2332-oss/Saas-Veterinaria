"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isCurrentUserSuperadmin } from "@/lib/auth/superadmin";
import { slugify, readingTime, htmlToText, sanitizeHtml } from "@/lib/blog/utils";
import { generarContenidoPost } from "@/lib/blog/generar";
import type { Database } from "@/lib/database.types";

type PostUpdate = Database["public"]["Tables"]["blog_posts"]["Update"];

async function guard(): Promise<boolean> {
  return isCurrentUserSuperadmin();
}

/** Genera un slug único en blog_posts (sufijo -2, -3… si colisiona). */
async function slugUnico(base: string, excluirId?: string): Promise<string> {
  const supabase = createServiceClient();
  const raíz = slugify(base);
  let slug = raíz;
  for (let i = 2; i < 50; i++) {
    const { data } = await supabase.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
    if (!data || data.id === excluirId) return slug;
    slug = `${raíz}-${i}`;
  }
  return `${raíz}-${Math.floor(Date.now() / 1000)}`;
}

const postSchema = z.object({
  titulo: z.string().min(1, "El título es obligatorio."),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  contenido_html: z.string().optional(),
  category_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  target_keyword: z.string().optional(),
  secondary_keywords: z.array(z.string()).optional(),
  featured_image_url: z.string().optional(),
  featured_image_alt: z.string().optional(),
  status: z.enum(["draft", "scheduled", "published", "archived"]).optional(),
  scheduled_at: z.string().nullable().optional(),
  ai_brief: z.record(z.string(), z.unknown()).nullable().optional(),
});
export type PostInput = z.infer<typeof postSchema>;

function normalizaFecha(status: string | undefined, scheduled: string | null | undefined): { published_at?: string | null; scheduled_at?: string | null } {
  const out: { published_at?: string | null; scheduled_at?: string | null } = {};
  if (status === "published") out.published_at = new Date().toISOString();
  if (status === "scheduled") out.scheduled_at = scheduled || null;
  else if (status && status !== "scheduled") out.scheduled_at = null;
  return out;
}

export async function crearPost(input: PostInput): Promise<{ error?: string; id?: string }> {
  if (!(await guard())) return { error: "No autorizado." };
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const d = parsed.data;

  const supabase = createServiceClient();
  const { data: { user } } = await (await createClient()).auth.getUser();
  const slug = await slugUnico(d.slug || d.titulo);

  const { data, error } = await supabase.from("blog_posts").insert({
    titulo: d.titulo,
    slug,
    excerpt: d.excerpt || (d.contenido_html ? htmlToText(d.contenido_html) : null),
    contenido_html: d.contenido_html ? sanitizeHtml(d.contenido_html) : null,
    reading_time_min: readingTime(d.contenido_html ?? ""),
    category_id: d.category_id ?? null,
    tags: d.tags ?? [],
    meta_title: d.meta_title || null,
    meta_description: d.meta_description || null,
    target_keyword: d.target_keyword || null,
    secondary_keywords: d.secondary_keywords ?? [],
    featured_image_url: d.featured_image_url || null,
    featured_image_alt: d.featured_image_alt || null,
    status: d.status ?? "draft",
    ai_brief: (d.ai_brief ?? null) as Database["public"]["Tables"]["blog_posts"]["Insert"]["ai_brief"],
    created_by: user?.id ?? null,
    ...normalizaFecha(d.status, d.scheduled_at),
  }).select("id").single();
  if (error || !data) return { error: "No se pudo crear el artículo." };

  revalidatePath("/superadmin/blog");
  revalidatePath("/blog");
  return { id: data.id };
}

export async function actualizarPost(id: string, input: PostInput): Promise<{ error?: string }> {
  if (!(await guard())) return { error: "No autorizado." };
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const d = parsed.data;

  const supabase = createServiceClient();
  const patch: PostUpdate = {
    titulo: d.titulo,
    excerpt: d.excerpt || (d.contenido_html ? htmlToText(d.contenido_html) : null),
    contenido_html: d.contenido_html ? sanitizeHtml(d.contenido_html) : null,
    reading_time_min: readingTime(d.contenido_html ?? ""),
    category_id: d.category_id ?? null,
    tags: d.tags ?? [],
    meta_title: d.meta_title || null,
    meta_description: d.meta_description || null,
    target_keyword: d.target_keyword || null,
    secondary_keywords: d.secondary_keywords ?? [],
    featured_image_url: d.featured_image_url || null,
    featured_image_alt: d.featured_image_alt || null,
    ...(d.slug ? { slug: await slugUnico(d.slug, id) } : {}),
    ...(d.status ? { status: d.status, ...normalizaFecha(d.status, d.scheduled_at) } : {}),
    ...(d.ai_brief !== undefined ? { ai_brief: d.ai_brief as PostUpdate["ai_brief"] } : {}),
  };
  const { error } = await supabase.from("blog_posts").update(patch).eq("id", id);
  if (error) return { error: "No se pudo guardar el artículo." };

  revalidatePath("/superadmin/blog");
  revalidatePath(`/superadmin/blog/${id}`);
  revalidatePath("/blog");
  return {};
}

export async function cambiarEstadoPost(id: string, status: "draft" | "scheduled" | "published" | "archived", scheduledAt?: string | null): Promise<{ error?: string }> {
  if (!(await guard())) return { error: "No autorizado." };
  const supabase = createServiceClient();
  const { error } = await supabase.from("blog_posts").update({ status, ...normalizaFecha(status, scheduledAt) }).eq("id", id);
  if (error) return { error: "No se pudo cambiar el estado." };
  revalidatePath("/superadmin/blog");
  revalidatePath("/blog");
  return {};
}

export async function eliminarPost(id: string): Promise<{ error?: string }> {
  if (!(await guard())) return { error: "No autorizado." };
  const supabase = createServiceClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar." };
  revalidatePath("/superadmin/blog");
  revalidatePath("/blog");
  return {};
}

/** Genera el contenido del artículo con IA (Gemini) a partir de su brief/keyword. */
export async function generarConIA(id: string, opts?: { publicar?: boolean }): Promise<{ error?: string }> {
  if (!(await guard())) return { error: "No autorizado." };
  const res = await generarContenidoPost(id, opts);
  if (res.error) return { error: res.error };
  revalidatePath("/superadmin/blog");
  revalidatePath(`/superadmin/blog/${id}`);
  revalidatePath("/superadmin/blog/calendario");
  revalidatePath("/blog");
  return {};
}

/** Importa un calendario editorial (filas) creando posts programados/borrador con brief para IA. */
const filaSchema = z.object({
  titulo: z.string().min(1),
  tema: z.string().optional(),
  keyword_principal: z.string().optional(),
  keywords_secundarias: z.string().optional(),
  categoria_slug: z.string().optional(),
  fecha_publicacion: z.string().optional(),
});
export type FilaCalendario = z.infer<typeof filaSchema>;

export async function importarCalendario(rows: FilaCalendario[]): Promise<{ creados: number; errores: string[] }> {
  if (!(await guard())) return { creados: 0, errores: ["No autorizado."] };
  const supabase = createServiceClient();

  const { data: cats } = await supabase.from("blog_categories").select("id, slug");
  const catBySlug = new Map((cats ?? []).map((c) => [c.slug, c.id]));

  let creados = 0;
  const errores: string[] = [];
  for (const [i, raw] of rows.entries()) {
    const parsed = filaSchema.safeParse(raw);
    if (!parsed.success) { errores.push(`Fila ${i + 1}: ${parsed.error.issues[0]?.message}`); continue; }
    const r = parsed.data;
    const slug = await slugUnico(r.titulo);
    const fecha = r.fecha_publicacion ? new Date(r.fecha_publicacion) : null;
    const programada = fecha && !isNaN(fecha.getTime()) ? fecha.toISOString() : null;
    const secundarias = r.keywords_secundarias ? r.keywords_secundarias.split(",").map((s) => s.trim()).filter(Boolean) : [];

    const { error } = await supabase.from("blog_posts").insert({
      titulo: r.titulo,
      slug,
      target_keyword: r.keyword_principal || null,
      secondary_keywords: secundarias,
      category_id: r.categoria_slug ? catBySlug.get(r.categoria_slug) ?? null : null,
      status: programada ? "scheduled" : "draft",
      scheduled_at: programada,
      ai_generated: true,
      ai_brief: { topic: r.tema || r.titulo, source: "import_calendario" },
    });
    if (error) errores.push(`Fila ${i + 1}: no se pudo crear (${r.titulo}).`);
    else creados++;
  }

  revalidatePath("/superadmin/blog");
  revalidatePath("/superadmin/blog/calendario");
  return { creados, errores };
}

/** Sube una imagen al bucket público blog-images (service role). Recibe FormData con `file`. */
export async function subirImagenBlog(formData: FormData): Promise<{ error?: string; url?: string }> {
  if (!(await guard())) return { error: "No autorizado." };
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Archivo no válido." };
  if (file.size > 5 * 1024 * 1024) return { error: "La imagen supera los 5 MB." };

  const supabase = createServiceClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const year = new Date().getFullYear();
  const path = `${year}/${slugify(file.name.replace(/\.[^.]+$/, ""))}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("blog-images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: "No se pudo subir la imagen." };
  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return { url: data.publicUrl };
}
