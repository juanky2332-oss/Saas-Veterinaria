"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Download, Sparkles, Plus, CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EstadoBadge } from "../../_components/ui";
import { importarCalendario, generarConIA, type FilaCalendario } from "@/app/actions/blog";

export interface Programado { id: string; titulo: string; status: string; keyword: string | null; scheduled_at: string | null; ai_generated: boolean; categoria: string }
export interface Cat { slug: string; nombre: string }

const fechaHora = (iso: string | null) => (iso ? new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Sin fecha");

const PLANTILLA_CSV = "titulo,tema,keyword_principal,keywords_secundarias,categoria_slug,fecha_publicacion\nCómo organizar la agenda de tu clínica,Guía para reducir huecos y ausencias con recordatorios,agenda para clínicas,recordatorios whatsapp;citas online,gestion-clinica,2026-07-01 09:00\n";

/** Parser CSV simple: respeta comillas dobles. Devuelve filas como objetos por cabecera. */
function parseCSV(text: string): FilaCalendario[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const split = (line: string): string[] => {
    const out: string[] = [];
    let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
      else if (c === "," && !q) { out.push(cur); cur = ""; }
      else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const headers = split(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = split(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cells[i] ?? ""; });
    return {
      titulo: row.titulo ?? "",
      tema: row.tema || undefined,
      keyword_principal: row.keyword_principal || undefined,
      keywords_secundarias: row.keywords_secundarias ? row.keywords_secundarias.replace(/;/g, ",") : undefined,
      categoria_slug: row.categoria_slug || undefined,
      fecha_publicacion: row.fecha_publicacion || undefined,
    };
  }).filter((r) => r.titulo);
}

export function CalendarioClient({ programados, cats }: { programados: Programado[]; cats: Cat[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<FilaCalendario[]>([]);

  // Alta rápida manual
  const [titulo, setTitulo] = useState("");
  const [tema, setTema] = useState("");
  const [keyword, setKeyword] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("09:00");

  function descargarPlantilla() {
    const blob = new Blob([PLANTILLA_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "plantilla-calendario-editorial.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { const txt = String(reader.result || ""); setCsv(txt); setPreview(parseCSV(txt)); };
    reader.readAsText(file);
  }

  function revisar() {
    const rows = parseCSV(csv);
    if (rows.length === 0) { toast.error("No se detectaron filas válidas. Revisa la cabecera y el formato."); return; }
    setPreview(rows);
  }

  function importar() {
    if (preview.length === 0) { toast.error("Nada que importar."); return; }
    startTransition(async () => {
      const res = await importarCalendario(preview);
      if (res.errores.length) toast.error(`${res.creados} creados · ${res.errores.length} con error`);
      else toast.success(`${res.creados} artículos añadidos al calendario.`);
      setCsv(""); setPreview([]);
      router.refresh();
    });
  }

  function altaRapida() {
    if (!titulo.trim()) { toast.error("Añade un título."); return; }
    const fila: FilaCalendario = {
      titulo,
      tema: tema || undefined,
      keyword_principal: keyword || undefined,
      categoria_slug: catSlug || undefined,
      fecha_publicacion: fecha ? `${fecha} ${hora || "09:00"}` : undefined,
    };
    startTransition(async () => {
      const res = await importarCalendario([fila]);
      if (res.errores.length) { toast.error(res.errores[0]); return; }
      toast.success("Añadido al calendario.");
      setTitulo(""); setTema(""); setKeyword(""); setCatSlug(""); setFecha("");
      router.refresh();
    });
  }

  function generarAhora(id: string) {
    startTransition(async () => {
      const res = await generarConIA(id);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Artículo generado con IA (queda en borrador para revisar).");
      router.refresh();
    });
  }

  const inp = "h-10 w-full rounded-[10px] border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-400/50";
  const lbl = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/45";

  return (
    <div className="space-y-4">
      <Link href="/superadmin/blog" className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white"><ArrowLeft size={15} /> Blog</Link>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Importar CSV */}
        <div className="rounded-[16px] border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-1 text-sm font-bold text-white">Importar calendario (CSV)</h2>
          <p className="mb-3 text-xs text-white/50">Columnas: titulo, tema, keyword_principal, keywords_secundarias (separadas por ;), categoria_slug, fecha_publicacion (YYYY-MM-DD HH:mm).</p>
          <div className="mb-3 flex flex-wrap gap-2">
            <button onClick={descargarPlantilla} className="inline-flex items-center gap-1.5 rounded-[9px] border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white"><Download size={13} /> Descargar plantilla</button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-[9px] border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 hover:text-white">
              <Upload size={13} /> Subir CSV
              <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
            </label>
          </div>
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={5} placeholder="…o pega aquí el contenido CSV" className="w-full resize-y rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-xs text-white placeholder:text-white/35 outline-none focus:border-indigo-400/50" />
          <div className="mt-2 flex items-center gap-2">
            <button onClick={revisar} className="rounded-[9px] border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/75 hover:text-white">Previsualizar</button>
            {preview.length > 0 && (
              <button onClick={importar} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-[9px] bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-400 disabled:opacity-50">
                {isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Importar {preview.length} filas
              </button>
            )}
          </div>
          {preview.length > 0 && (
            <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-xs text-white/60">
              {preview.map((r, i) => <li key={i} className="truncate">• {r.titulo} {r.fecha_publicacion ? `— ${r.fecha_publicacion}` : ""}</li>)}
            </ul>
          )}
        </div>

        {/* Alta rápida */}
        <div className="rounded-[16px] border border-white/10 bg-white/[0.03] p-5">
          <h2 className="mb-3 text-sm font-bold text-white">Añadir tema al calendario</h2>
          <div className="space-y-3">
            <div><label className={lbl}>Título</label><input value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inp} placeholder="Título del artículo" /></div>
            <div><label className={lbl}>Tema / brief para la IA</label><textarea value={tema} onChange={(e) => setTema(e.target.value)} rows={2} className="w-full resize-y rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-400/50" placeholder="De qué trata…" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={lbl}>Keyword</label><input value={keyword} onChange={(e) => setKeyword(e.target.value)} className={inp} placeholder="keyword principal" /></div>
              <div><label className={lbl}>Categoría</label>
                <select value={catSlug} onChange={(e) => setCatSlug(e.target.value)} className={inp}>
                  <option value="" className="bg-[#0f1729]">Sin categoría</option>
                  {cats.map((c) => <option key={c.slug} value={c.slug} className="bg-[#0f1729]">{c.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={lbl}>Fecha publicación</label><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inp} /></div>
              <div><label className={lbl}>Hora</label><input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={inp} /></div>
            </div>
            <button onClick={altaRapida} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-[9px] bg-indigo-500 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-400 disabled:opacity-50">
              <Plus size={14} /> Añadir al calendario
            </button>
          </div>
        </div>
      </div>

      {/* Programados */}
      <div className="rounded-[16px] border border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
          <CalendarClock size={16} className="text-indigo-300" />
          <h2 className="text-sm font-bold text-white">Cola editorial ({programados.length})</h2>
        </div>
        {programados.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-white/45">No hay temas en el calendario. Importa un CSV o añade uno arriba.</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {programados.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/superadmin/blog/${p.id}`} className="truncate font-semibold text-white hover:text-indigo-200">{p.titulo}</Link>
                  <p className="text-xs text-white/45">{p.categoria}{p.keyword ? ` · ${p.keyword}` : ""}</p>
                </div>
                <span className="text-xs tabular-nums text-white/55">{fechaHora(p.scheduled_at)}</span>
                <EstadoBadge estado={p.status} />
                <button onClick={() => generarAhora(p.id)} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-[8px] bg-violet-500/90 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-400 disabled:opacity-50">
                  <Sparkles size={13} /> Generar ahora
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
