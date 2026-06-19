"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Save, Loader2, Upload, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { DatePicker } from "@/components/ui/date-picker";
import { crearPost, actualizarPost, generarConIA, subirImagenBlog, type PostInput } from "@/app/actions/blog";

export interface Categoria { id: string; nombre: string }
export interface PostFull {
  id: string;
  titulo: string;
  slug: string;
  excerpt: string | null;
  contenido_html: string | null;
  category_id: string | null;
  tags: string[];
  meta_title: string | null;
  meta_description: string | null;
  target_keyword: string | null;
  secondary_keywords: string[];
  featured_image_url: string | null;
  featured_image_alt: string | null;
  status: string;
  scheduled_at: string | null;
  ai_brief: { topic?: string } | null;
}

const ESTADOS = [
  { v: "draft", l: "Borrador" },
  { v: "scheduled", l: "Programado" },
  { v: "published", l: "Publicado" },
  { v: "archived", l: "Archivado" },
];

export function BlogFormClient({ post, categorias }: { post: PostFull | null; categorias: Categoria[] }) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [titulo, setTitulo] = useState(post?.titulo ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [contenido, setContenido] = useState(post?.contenido_html ?? "");
  const [categoryId, setCategoryId] = useState(post?.category_id ?? "");
  const [tags, setTags] = useState((post?.tags ?? []).join(", "));
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? "");
  const [metaDesc, setMetaDesc] = useState(post?.meta_description ?? "");
  const [keyword, setKeyword] = useState(post?.target_keyword ?? "");
  const [keywordsSec, setKeywordsSec] = useState((post?.secondary_keywords ?? []).join(", "));
  const [imagen, setImagen] = useState(post?.featured_image_url ?? "");
  const [imagenAlt, setImagenAlt] = useState(post?.featured_image_alt ?? "");
  const [status, setStatus] = useState(post?.status ?? "draft");
  const [fecha, setFecha] = useState(post?.scheduled_at ? post.scheduled_at.slice(0, 10) : "");
  const [hora, setHora] = useState(post?.scheduled_at ? new Date(post.scheduled_at).toTimeString().slice(0, 5) : "09:00");
  const [tema, setTema] = useState(post?.ai_brief?.topic ?? "");

  function construir(): PostInput {
    const scheduledISO = status === "scheduled" && fecha ? new Date(`${fecha}T${hora || "09:00"}`).toISOString() : null;
    return {
      titulo,
      excerpt: excerpt || undefined,
      contenido_html: contenido || undefined,
      category_id: categoryId || null,
      tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
      meta_title: metaTitle || undefined,
      meta_description: metaDesc || undefined,
      target_keyword: keyword || undefined,
      secondary_keywords: keywordsSec.split(",").map((s) => s.trim()).filter(Boolean),
      featured_image_url: imagen || undefined,
      featured_image_alt: imagenAlt || undefined,
      status: status as PostInput["status"],
      scheduled_at: scheduledISO,
      ai_brief: tema ? { topic: tema } : null,
    };
  }

  function guardar(): Promise<string | null> {
    return new Promise((resolve) => {
      startSaving(async () => {
        if (!titulo.trim()) { toast.error("Añade un título."); resolve(null); return; }
        if (post) {
          const res = await actualizarPost(post.id, construir());
          if (res.error) { toast.error(res.error); resolve(null); return; }
          toast.success("Artículo guardado.");
          router.refresh();
          resolve(post.id);
        } else {
          const res = await crearPost(construir());
          if (res.error || !res.id) { toast.error(res.error ?? "No se pudo crear."); resolve(null); return; }
          toast.success("Artículo creado.");
          router.push(`/superadmin/blog/${res.id}`);
          resolve(res.id);
        }
      });
    });
  }

  async function generar() {
    if (!titulo.trim() && !tema.trim() && !keyword.trim()) { toast.error("Añade un título, tema o keyword para generar."); return; }
    setGenerating(true);
    // Asegura que el post existe y tiene el brief/keyword guardados antes de generar.
    const id = await guardar();
    if (!id) { setGenerating(false); return; }
    const res = await generarConIA(id);
    setGenerating(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success("Contenido generado con IA. Revísalo y publica.");
    router.refresh();
  }

  async function subirImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await subirImagenBlog(fd);
    if (res.error) { toast.error(res.error); return; }
    if (res.url) { setImagen(res.url); toast.success("Imagen subida."); }
    if (fileRef.current) fileRef.current.value = "";
  }

  const inp = "h-10 w-full rounded-[10px] border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-400/50";
  const lbl = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/45";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/superadmin/blog" className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white"><ArrowLeft size={15} /> Blog</Link>
        <div className="flex-1" />
        {post?.status === "published" && (
          <Link href={`/blog/${post.slug}`} target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-white/10 px-3 text-xs font-semibold text-white/70 hover:text-white"><ExternalLink size={14} /> Ver</Link>
        )}
        <button onClick={generar} disabled={generating || saving} className="inline-flex h-9 items-center gap-1.5 rounded-[9px] bg-violet-500 px-3 text-xs font-bold text-white hover:bg-violet-400 disabled:opacity-50">
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} {generating ? "Generando…" : "Generar con IA"}
        </button>
        <button onClick={() => guardar()} disabled={saving || generating} className="inline-flex h-9 items-center gap-1.5 rounded-[9px] bg-indigo-500 px-3 text-xs font-bold text-white hover:bg-indigo-400 disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Columna principal */}
        <div className="space-y-4 lg:col-span-2">
          <div>
            <label className={lbl}>Título</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título del artículo" className={inp} />
          </div>
          <div>
            <label className={lbl}>Extracto</label>
            <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="Resumen breve (se usa en listados y metadatos)…" className="w-full resize-y rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-400/50" />
          </div>
          <div>
            <label className={lbl}>Contenido</label>
            {/* La key fuerza re-montar el editor cuando cambia el contenido (p. ej. tras generar con IA) */}
            <RichTextEditor key={`${post?.id ?? "new"}:${(post?.contenido_html ?? "").length}`} value={contenido} onChange={setContenido} placeholder="Escribe el artículo o genéralo con IA…" />
          </div>
        </div>

        {/* Columna lateral */}
        <div className="space-y-4">
          <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <p className="text-sm font-bold text-white">Publicación</p>
            <div>
              <label className={lbl}>Estado</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inp}>
                {ESTADOS.map((s) => <option key={s.v} value={s.v} className="bg-[#0f1729]">{s.l}</option>)}
              </select>
            </div>
            {status === "scheduled" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Fecha</label>
                  <DatePicker value={fecha} onChange={setFecha} min={new Date().toISOString().slice(0, 10)} />
                </div>
                <div>
                  <label className={lbl}>Hora</label>
                  <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={inp} />
                </div>
              </div>
            )}
            <div>
              <label className={lbl}>Categoría</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inp}>
                <option value="" className="bg-[#0f1729]">Sin categoría</option>
                {categorias.map((c) => <option key={c.id} value={c.id} className="bg-[#0f1729]">{c.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <p className="flex items-center gap-1.5 text-sm font-bold text-white"><Sparkles size={14} className="text-violet-300" /> Brief para la IA</p>
            <div>
              <label className={lbl}>De qué trata (tema)</label>
              <textarea value={tema} onChange={(e) => setTema(e.target.value)} rows={3} placeholder="Describe el enfoque del artículo para la generación con IA…" className="w-full resize-y rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-400/50" />
            </div>
            <div>
              <label className={lbl}>Keyword principal</label>
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="p. ej. software para clínicas" className={inp} />
            </div>
            <div>
              <label className={lbl}>Keywords secundarias (coma)</label>
              <input value={keywordsSec} onChange={(e) => setKeywordsSec(e.target.value)} placeholder="agenda clínica, recordatorios…" className={inp} />
            </div>
          </div>

          <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <p className="text-sm font-bold text-white">Imagen de portada</p>
            {imagen && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagen} alt="" className="aspect-video w-full rounded-[10px] object-cover" />
            )}
            <input value={imagen} onChange={(e) => setImagen(e.target.value)} placeholder="URL de la imagen" className={inp} />
            <input value={imagenAlt} onChange={(e) => setImagenAlt(e.target.value)} placeholder="Texto alternativo (alt)" className={inp} />
            <input ref={fileRef} type="file" accept="image/*" onChange={subirImagen} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-[9px] border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white"><Upload size={13} /> Subir imagen</button>
          </div>

          <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <p className="text-sm font-bold text-white">SEO</p>
            <div>
              <label className={lbl}>Meta título</label>
              <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={70} placeholder="≤ 60 caracteres" className={inp} />
            </div>
            <div>
              <label className={lbl}>Meta descripción</label>
              <textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} rows={2} maxLength={170} placeholder="≤ 155 caracteres" className="w-full resize-y rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-400/50" />
            </div>
            <div>
              <label className={lbl}>Etiquetas (coma)</label>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="gestión, agenda…" className={inp} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
