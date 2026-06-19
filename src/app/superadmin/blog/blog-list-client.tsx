"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, CalendarRange, Sparkles, Eye, EyeOff, Trash2, Pencil, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EstadoBadge } from "../_components/ui";
import { generarConIA, cambiarEstadoPost, eliminarPost } from "@/app/actions/blog";

export interface PostRow {
  id: string;
  titulo: string;
  slug: string;
  status: string;
  categoria: string;
  scheduled_at: string | null;
  published_at: string | null;
  updated_at: string;
  ai_generated: boolean;
  reading_time_min: number;
}

const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const fechaHora = (iso: string | null) => (iso ? new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

const FILTROS = [
  { key: "todos", label: "Todos" },
  { key: "draft", label: "Borradores" },
  { key: "scheduled", label: "Programados" },
  { key: "published", label: "Publicados" },
  { key: "generation_failed", label: "Fallidos" },
];

export function BlogListClient({ rows }: { rows: PostRow[] }) {
  const router = useRouter();
  const [filtro, setFiltro] = useState("todos");
  const [isPending, startTransition] = useTransition();

  const filtradas = useMemo(() => (filtro === "todos" ? rows : rows.filter((r) => r.status === filtro)), [rows, filtro]);

  function accion(fn: () => Promise<{ error?: string }>, ok: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) { toast.error(res.error); return; }
      toast.success(ok);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-[10px] border border-white/10 bg-white/[0.04] p-1">
          {FILTROS.map((f) => (
            <button key={f.key} onClick={() => setFiltro(f.key)} className={cn("rounded-[7px] px-2.5 py-1.5 text-xs font-semibold transition-colors", filtro === f.key ? "bg-white/15 text-white" : "text-white/55 hover:text-white")}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Link href="/superadmin/blog/calendario" className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-white/75 hover:text-white">
          <CalendarRange size={15} /> Calendario editorial
        </Link>
        <Link href="/superadmin/blog/nuevo" className="inline-flex h-9 items-center gap-1.5 rounded-[9px] bg-indigo-500 px-3 text-xs font-bold text-white hover:bg-indigo-400">
          <Plus size={15} /> Nuevo artículo
        </Link>
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[780px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-white/45">
              <th className="px-4 py-3 font-semibold">Artículo</th>
              <th className="px-4 py-3 font-semibold">Categoría</th>
              <th className="px-4 py-3 font-semibold">Programado / Publicado</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((p) => (
              <tr key={p.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <Link href={`/superadmin/blog/${p.id}`} className="block">
                    <p className="font-semibold text-white">{p.titulo}{p.ai_generated && <Sparkles size={12} className="ml-1.5 inline text-violet-300" />}</p>
                    <p className="text-xs text-white/40">/{p.slug} · {p.reading_time_min} min</p>
                  </Link>
                </td>
                <td className="px-4 py-3 text-white/70">{p.categoria}</td>
                <td className="px-4 py-3 tabular-nums text-white/55">
                  {p.status === "scheduled" ? fechaHora(p.scheduled_at) : p.status === "published" ? fecha(p.published_at) : fecha(p.updated_at)}
                </td>
                <td className="px-4 py-3"><EstadoBadge estado={p.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <IconBtn title="Generar con IA" onClick={() => accion(() => generarConIA(p.id), "Contenido generado con IA.")} disabled={isPending} className="hover:text-violet-300"><Sparkles size={15} /></IconBtn>
                    <Link href={`/superadmin/blog/${p.id}`} title="Editar" className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/55 hover:bg-white/10 hover:text-white"><Pencil size={14} /></Link>
                    {p.status === "published" ? (
                      <>
                        <Link href={`/blog/${p.slug}`} target="_blank" title="Ver en el blog" className="flex h-8 w-8 items-center justify-center rounded-[8px] text-white/55 hover:bg-white/10 hover:text-white"><ExternalLink size={14} /></Link>
                        <IconBtn title="Despublicar" onClick={() => accion(() => cambiarEstadoPost(p.id, "draft"), "Pasado a borrador.")} disabled={isPending}><EyeOff size={15} /></IconBtn>
                      </>
                    ) : (
                      <IconBtn title="Publicar ahora" onClick={() => accion(() => cambiarEstadoPost(p.id, "published"), "Artículo publicado.")} disabled={isPending} className="hover:text-emerald-300"><Eye size={15} /></IconBtn>
                    )}
                    <IconBtn title="Eliminar" onClick={() => { if (confirm(`¿Eliminar "${p.titulo}"?`)) accion(() => eliminarPost(p.id), "Artículo eliminado."); }} disabled={isPending} className="hover:text-rose-300"><Trash2 size={14} /></IconBtn>
                  </div>
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-white/45">No hay artículos en este estado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IconBtn({ children, title, onClick, disabled, className }: { children: React.ReactNode; title: string; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <button title={title} onClick={onClick} disabled={disabled} className={cn("flex h-8 w-8 items-center justify-center rounded-[8px] text-white/55 transition-colors hover:bg-white/10 disabled:opacity-40", className)}>
      {children}
    </button>
  );
}
