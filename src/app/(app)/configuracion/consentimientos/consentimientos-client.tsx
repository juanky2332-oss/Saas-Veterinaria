"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, FileText, Trash2, Pencil, Sparkles, X, Library, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { createClient } from "@/lib/supabase/client";
import { crearPlantilla, actualizarPlantilla, eliminarPlantilla, anadirDesdeBiblioteca, registrarPlantillaArchivo } from "@/app/actions/consentimientos";
import { PLANTILLAS_CONSENTIMIENTO, plantillasRecomendadas } from "@/lib/consentimientos/plantillas";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MiPlantilla {
  id: string;
  titulo: string;
  tipo: string;
  especialidad: string | null;
  cuerpo_richtext: string;
  variables: { clave: string; label: string }[] | null;
  archivo_path: string | null;
}

const ESP_LABEL: Record<string, string> = {
  estetica: "Estética", dental: "Dental", fisioterapia: "Fisioterapia", psicologia: "Psicología",
  veterinaria: "Veterinaria", general: "Medicina general", rgpd: "Protección de datos",
};

const VARIABLES_ESTANDAR = [
  { clave: "org_nombre", label: "Nombre de la clínica" },
  { clave: "org_nif", label: "NIF de la clínica" },
  { clave: "org_direccion", label: "Dirección de la clínica" },
  { clave: "paciente_nombre", label: "Nombre del paciente" },
  { clave: "paciente_dni", label: "DNI del paciente" },
  { clave: "tratamiento", label: "Tratamiento" },
  { clave: "profesional", label: "Profesional" },
  { clave: "fecha", label: "Fecha" },
  { clave: "lugar", label: "Lugar" },
];

type EditorState = { id?: string; titulo: string; especialidad: string; cuerpo: string; variables: { clave: string; label: string }[] };

export function ConsentimientosClient({ misPlantillas, orgId, vertical }: { misPlantillas: MiPlantilla[]; orgId: string; vertical: string | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [pending, startTransition] = useTransition();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [verBiblioteca, setVerBiblioteca] = useState(misPlantillas.length === 0);
  const [subiendo, setSubiendo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const recomendadas = useMemo(() => plantillasRecomendadas(vertical), [vertical]);
  const recomendadasIds = new Set(recomendadas.map((p) => p.id));
  const otras = PLANTILLAS_CONSENTIMIENTO.filter((p) => !recomendadasIds.has(p.id));

  function nuevaPersonalizada() {
    setEditor({ titulo: "", especialidad: vertical ?? "", cuerpo: "", variables: VARIABLES_ESTANDAR });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function editar(p: MiPlantilla) {
    setEditor({ id: p.id, titulo: p.titulo, especialidad: p.especialidad ?? "", cuerpo: p.cuerpo_richtext, variables: [...VARIABLES_ESTANDAR, ...(p.variables ?? [])] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function guardar() {
    if (!editor) return;
    if (!editor.titulo.trim()) { toast.error("Indica un título."); return; }
    startTransition(async () => {
      const input = { titulo: editor.titulo, cuerpo_richtext: editor.cuerpo, especialidad: editor.especialidad || null };
      const res = editor.id ? await actualizarPlantilla(editor.id, input) : await crearPlantilla(input);
      if (res.error) { toast.error(res.error); return; }
      toast.success(editor.id ? "Plantilla guardada." : "Plantilla creada.");
      setEditor(null);
      router.refresh();
    });
  }
  function borrar(id: string) {
    if (typeof window !== "undefined" && !window.confirm("¿Eliminar esta plantilla?")) return;
    startTransition(async () => {
      const res = await eliminarPlantilla(id);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Plantilla eliminada.");
      router.refresh();
    });
  }
  function anadir(id: string) {
    startTransition(async () => {
      const res = await anadirDesdeBiblioteca(id);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Plantilla añadida a tus plantillas.");
      router.refresh();
    });
  }
  async function subir(file: File) {
    setSubiendo(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const path = `${orgId}/consentimientos/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("org-assets").upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (error) throw error;
      const res = await registrarPlantillaArchivo({ titulo: file.name.replace(/\.[^.]+$/, ""), archivo_path: path });
      if (res.error) throw new Error(res.error);
      toast.success("Documento subido como plantilla.");
      router.refresh();
    } catch {
      toast.error("No se pudo subir el documento.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Editor */}
      {editor && (
        <section className="rounded-[16px] border border-[var(--brand)]/40 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-semibold text-[var(--text)]">{editor.id ? "Editar plantilla" : "Nueva plantilla"}</h2>
            <button onClick={() => setEditor(null)} className="text-[var(--text-soft)] hover:text-[var(--text)]" aria-label="Cerrar"><X size={18} /></button>
          </div>
          <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_220px]">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-soft)]">Título</label>
              <Input value={editor.titulo} onChange={(e) => setEditor({ ...editor, titulo: e.target.value })} placeholder="Consentimiento informado…" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-soft)]">Especialidad</label>
              <select value={editor.especialidad} onChange={(e) => setEditor({ ...editor, especialidad: e.target.value })} className="h-10 w-full rounded-[12px] border border-[var(--border)] bg-white px-3 text-sm">
                <option value="">General</option>
                {Object.entries(ESP_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
          </div>
          <RichTextEditor value={editor.cuerpo} onChange={(html) => setEditor((s) => s && { ...s, cuerpo: html })} variables={editor.variables} placeholder="Escribe el texto del consentimiento. Usa «Insertar variable» para los datos que se rellenan solos." />
          <p className="mt-2 text-[11px] text-[var(--text-soft)]">Las variables como <code>{"{{paciente_nombre}}"}</code> se sustituyen por los datos reales al generar el consentimiento del paciente.</p>
          <div className="mt-4 flex gap-2">
            <Button disabled={pending} onClick={guardar}>{pending ? "Guardando…" : "Guardar plantilla"}</Button>
            <Button variant="outline" onClick={() => setEditor(null)}>Cancelar</Button>
          </div>
        </section>
      )}

      {/* Acciones */}
      {!editor && (
        <div className="flex flex-wrap gap-2">
          <Button className="gap-1.5" onClick={nuevaPersonalizada}><Plus size={15} /> Nueva plantilla</Button>
          <Button variant="outline" className="gap-1.5" disabled={subiendo} onClick={() => fileRef.current?.click()}>
            {subiendo ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Subir Word/PDF
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => setVerBiblioteca((v) => !v)}><Library size={15} /> {verBiblioteca ? "Ocultar biblioteca" : "Biblioteca de plantillas"}</Button>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void subir(f); e.target.value = ""; }} />
        </div>
      )}

      {/* Mis plantillas */}
      {!editor && (
        <section>
          <h2 className="mb-3 font-display font-semibold text-[var(--text)]">Mis plantillas</h2>
          {misPlantillas.length === 0 ? (
            <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-5 py-10 text-center shadow-[var(--shadow-card)]">
              <FileText size={26} className="mx-auto mb-2 text-[var(--brand-soft)]" />
              <p className="text-sm text-[var(--text-soft)]">Aún no tienes plantillas. Añade una de la biblioteca o crea la tuya.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {misPlantillas.map((p) => (
                <div key={p.id} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display font-semibold text-[var(--text)]">{p.titulo}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {p.especialidad && <span className="rounded-full bg-[var(--brand-tint)] px-2 py-0.5 text-[10px] font-bold text-[var(--brand-strong)]">{ESP_LABEL[p.especialidad] ?? p.especialidad}</span>}
                        <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--text-soft)]">{p.tipo}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {p.tipo === "subida" && p.archivo_path ? (
                      <a href={supabase.storage.from("org-assets").getPublicUrl(p.archivo_path).data.publicUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1.5"><Download size={13} /> Ver archivo</Button>
                      </a>
                    ) : (
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => editar(p)}><Pencil size={13} /> Editar</Button>
                    )}
                    <button onClick={() => borrar(p.id)} disabled={pending} className="ml-auto text-[var(--text-soft)] hover:text-[var(--error)]" aria-label="Eliminar"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Biblioteca */}
      {!editor && verBiblioteca && (
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-[var(--text)]">Biblioteca de plantillas legales</h2>
          {recomendadas.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--brand-strong)]"><Sparkles size={13} /> Recomendadas para tu clínica</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {recomendadas.map((p) => <BiblioCard key={p.id} p={p} onAdd={() => anadir(p.id)} pending={pending} recomendada />)}
              </div>
            </div>
          )}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--text-soft)]">Otras especialidades</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {otras.map((p) => <BiblioCard key={p.id} p={p} onAdd={() => anadir(p.id)} pending={pending} />)}
            </div>
          </div>
          <p className="text-[11px] text-[var(--text-soft)]">⚠️ Plantillas orientativas (Ley 41/2002, RGPD/LOPDGDD y normativa sectorial). Revísalas con tu asesor jurídico antes de usarlas.</p>
        </section>
      )}
    </div>
  );
}

function BiblioCard({ p, onAdd, pending, recomendada }: { p: typeof PLANTILLAS_CONSENTIMIENTO[number]; onAdd: () => void; pending: boolean; recomendada?: boolean }) {
  const [ver, setVer] = useState(false);
  return (
    <div className={cn("rounded-[16px] border bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]", recomendada ? "border-[var(--brand)]/40" : "border-[var(--border)]")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-[var(--text)]">{p.titulo}</p>
          <span className="mt-1 inline-block rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-soft)]">{p.especialidadLabel}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" className="gap-1.5" disabled={pending} onClick={onAdd}><Plus size={13} /> Añadir</Button>
        <Button size="sm" variant="ghost" onClick={() => setVer((v) => !v)}>{ver ? "Ocultar" : "Previsualizar"}</Button>
      </div>
      {ver && (
        <div className="mt-3 max-h-64 overflow-y-auto rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-3 text-xs leading-relaxed text-[var(--text-soft)] [&_h2]:mt-2 [&_h2]:font-bold [&_p]:my-1" dangerouslySetInnerHTML={{ __html: p.cuerpoHtml }} />
      )}
    </div>
  );
}
