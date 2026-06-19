"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Phone, Mail, Euro, Settings2, ChevronLeft, ChevronRight,
  Trash2, UserPlus, StickyNote, GripVertical, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatEuro, iniciales, cn } from "@/lib/utils";
import {
  crearEtapa, actualizarEtapa, moverEtapa, eliminarEtapa,
  crearOportunidad, actualizarOportunidad, moverOportunidad,
  eliminarOportunidad, convertirEnPaciente,
} from "@/app/actions/crm";
import { toast } from "sonner";

export interface Stage {
  id: string;
  nombre: string;
  orden: number;
  color: string;
}

export interface Opportunity {
  id: string;
  stage_id: string;
  nombre_contacto: string;
  telefono: string | null;
  email: string | null;
  valor: number | null;
  origen: string | null;
  notas: string | null;
  color: string | null;
  patient_id: string | null;
}

const SWATCHES = [
  "#1f9fc4", "#0e9f8e", "#15a37a", "#d98a0b", "#e8845c",
  "#dc5146", "#5b6abf", "#b06a87", "#c07a2e", "#94a3b8",
];

const ORIGENES = ["manual", "web", "teléfono", "instagram", "recomendación", "whatsapp", "otro"];

interface Props {
  stages: Stage[];
  opportunities: Opportunity[];
  pipelineNombre: string;
}

export function CrmKanban({ stages: initialStages, opportunities: initialOpps, pipelineNombre }: Props) {
  const router = useRouter();
  const [opps, setOpps] = useState(initialOpps);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [etapaDialog, setEtapaDialog] = useState<{ modo: "nueva" } | { modo: "editar"; stage: Stage } | null>(null);
  const [oppDialog, setOppDialog] = useState<{ modo: "nueva"; stageId?: string } | { modo: "editar"; opp: Opportunity } | null>(null);

  const stages = useMemo(() => [...initialStages].sort((a, b) => a.orden - b.orden), [initialStages]);

  const oppsPorEtapa = useMemo(() => {
    const map: Record<string, Opportunity[]> = {};
    for (const s of stages) map[s.id] = [];
    for (const o of opps) (map[o.stage_id] ??= []).push(o);
    return map;
  }, [stages, opps]);

  const totalValor = opps.reduce((sum, o) => sum + (o.valor ?? 0), 0);

  function onDragStart(e: React.DragEvent, oppId: string) {
    setDraggingId(oppId);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOver(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStageId(stageId);
  }
  async function onDrop(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    const id = draggingId;
    setDraggingId(null);
    setDragOverStageId(null);
    if (!id) return;
    const prev = opps;
    setOpps((p) => p.map((o) => (o.id === id ? { ...o, stage_id: stageId } : o)));
    const res = await moverOportunidad(id, stageId);
    if (res.error) {
      setOpps(prev);
      toast.error(res.error);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 md:px-6">
        <div>
          <p className="font-display text-sm font-bold text-[var(--text)]">{pipelineNombre}</p>
          <p className="text-xs text-[var(--text-soft)]">
            {opps.length} oportunidades · <span className="font-semibold text-[var(--brand)]">{formatEuro(totalValor)}</span> en pipeline
          </p>
        </div>
        <div className="flex-1" />
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEtapaDialog({ modo: "nueva" })}>
          <Plus size={13} strokeWidth={2} /> Etapa
        </Button>
        <Button size="sm" className="gap-1.5" onClick={() => setOppDialog({ modo: "nueva" })}>
          <Plus size={13} strokeWidth={2} /> Nueva oportunidad
        </Button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-3 p-4 md:p-5">
          {stages.map((stage) => {
            const tarjetas = oppsPorEtapa[stage.id] ?? [];
            const valorEtapa = tarjetas.reduce((s, o) => s + (o.valor ?? 0), 0);
            const isOver = dragOverStageId === stage.id;
            return (
              <div
                key={stage.id}
                className={cn(
                  "flex w-[290px] flex-shrink-0 flex-col rounded-[14px] bg-[var(--surface-2)] transition-shadow",
                  isOver && "ring-2 ring-[var(--brand)] ring-offset-1",
                )}
                style={{ boxShadow: `inset 0 3px 0 ${stage.color}` }}
                onDragOver={(e) => onDragOver(e, stage.id)}
                onDrop={(e) => onDrop(e, stage.id)}
                onDragLeave={() => setDragOverStageId(null)}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 px-3.5 pb-1 pt-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: stage.color }} />
                  <span className="truncate text-sm font-bold text-[var(--text)]">{stage.nombre}</span>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--border)] px-1.5 text-[10px] font-bold text-[var(--text-soft)]">
                    {tarjetas.length}
                  </span>
                  <div className="flex-1" />
                  <button
                    onClick={() => setEtapaDialog({ modo: "editar", stage })}
                    className="flex h-6 w-6 items-center justify-center rounded-[7px] text-[var(--text-soft)] hover:bg-[var(--border)] hover:text-[var(--text)] transition-colors"
                    aria-label={`Editar etapa ${stage.nombre}`}
                  >
                    <Settings2 size={13} strokeWidth={2} />
                  </button>
                </div>
                <p className="px-3.5 pb-2 text-[11px] font-semibold tabular-nums" style={{ color: stage.color }}>
                  {valorEtapa > 0 ? formatEuro(valorEtapa) : "—"}
                </p>

                {/* Cards */}
                <div className="flex-1 space-y-2 overflow-y-auto px-2.5 pb-2">
                  {tarjetas.length === 0 && (
                    <div className="flex h-16 items-center justify-center rounded-[10px] border-2 border-dashed border-[var(--border)]">
                      <p className="text-[11px] text-[var(--text-soft)]">Arrastra aquí</p>
                    </div>
                  )}
                  {tarjetas.map((opp) => (
                    <OppCard
                      key={opp.id}
                      opp={opp}
                      stageColor={stage.color}
                      isDragging={draggingId === opp.id}
                      onDragStart={onDragStart}
                      onClick={() => setOppDialog({ modo: "editar", opp })}
                    />
                  ))}
                </div>

                {/* Add card */}
                <button
                  onClick={() => setOppDialog({ modo: "nueva", stageId: stage.id })}
                  className="mx-2.5 mb-2.5 flex items-center justify-center gap-1 rounded-[10px] border border-dashed border-[var(--border)] py-2 text-xs font-semibold text-[var(--text-soft)] transition-colors hover:border-[var(--brand-soft)] hover:bg-[var(--brand-tint)] hover:text-[var(--brand-strong)]"
                >
                  <Plus size={12} strokeWidth={2.5} /> Añadir
                </button>
              </div>
            );
          })}

          {/* Nueva etapa fantasma */}
          <button
            onClick={() => setEtapaDialog({ modo: "nueva" })}
            className="flex h-full w-[220px] flex-shrink-0 flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-[var(--border)] text-[var(--text-soft)] transition-colors hover:border-[var(--brand-soft)] hover:bg-[var(--brand-tint)]/40 hover:text-[var(--brand-strong)]"
          >
            <Plus size={20} />
            <span className="text-sm font-semibold">Nueva etapa</span>
          </button>
        </div>
      </div>

      {/* Dialogs */}
      {etapaDialog && (
        <EtapaDialog
          key={etapaDialog.modo === "editar" ? etapaDialog.stage.id : "nueva"}
          estado={etapaDialog}
          stages={stages}
          onClose={() => setEtapaDialog(null)}
          onDone={() => { setEtapaDialog(null); router.refresh(); }}
        />
      )}
      {oppDialog && (
        <OppDialog
          key={oppDialog.modo === "editar" ? oppDialog.opp.id : "nueva"}
          estado={oppDialog}
          stages={stages}
          onClose={() => setOppDialog(null)}
          onDone={() => { setOppDialog(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

/* ───────────────────────── Tarjeta ───────────────────────── */

function OppCard({ opp, stageColor, isDragging, onDragStart, onClick }: {
  opp: Opportunity;
  stageColor: string;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: () => void;
}) {
  const partes = opp.nombre_contacto.split(" ");
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, opp.id)}
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3 transition-all",
        isDragging
          ? "scale-[1.02] opacity-50 shadow-[var(--shadow-pop)]"
          : "shadow-[var(--shadow-card)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]",
      )}
      style={{ borderLeft: `3px solid ${opp.color ?? stageColor}` }}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ background: opp.color ?? stageColor }}
        >
          {iniciales(partes[0] ?? "?", partes[1])}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--text)]">{opp.nombre_contacto}</p>
          {opp.valor != null && opp.valor > 0 && (
            <p className="mt-0.5 flex items-center gap-0.5 text-xs font-bold tabular-nums text-[var(--brand)]">
              <Euro size={10} /> {formatEuro(opp.valor)}
            </p>
          )}
        </div>
        <GripVertical size={14} className="mt-0.5 shrink-0 text-[var(--border)] group-hover:text-[var(--text-soft)]" />
      </div>

      {(opp.telefono || opp.email) && (
        <div className="mt-2 space-y-0.5">
          {opp.telefono && (
            <p className="flex items-center gap-1 text-[10.5px] text-[var(--text-soft)]"><Phone size={9} /> {opp.telefono}</p>
          )}
          {opp.email && (
            <p className="flex items-center gap-1 truncate text-[10.5px] text-[var(--text-soft)]"><Mail size={9} /> {opp.email}</p>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center gap-1.5">
        {opp.origen && <Badge variant="muted" className="text-[10px] capitalize">{opp.origen}</Badge>}
        {opp.patient_id && <Badge variant="oliva" className="text-[10px]">Paciente</Badge>}
        {opp.notas && <StickyNote size={11} className="ml-auto text-[var(--text-soft)]" />}
      </div>
    </div>
  );
}

/* ─────────────────── Dialog de etapa ─────────────────── */

function EtapaDialog({ estado, stages, onClose, onDone }: {
  estado: { modo: "nueva" } | { modo: "editar"; stage: Stage };
  stages: Stage[];
  onClose: () => void;
  onDone: () => void;
}) {
  const editar = estado.modo === "editar" ? estado.stage : null;
  const [nombre, setNombre] = useState(editar?.nombre ?? "");
  const [color, setColor] = useState(editar?.color ?? SWATCHES[0]);
  const [isPending, startTransition] = useTransition();
  const idx = editar ? stages.findIndex((s) => s.id === editar.id) : -1;

  function guardar() {
    startTransition(async () => {
      const res = editar
        ? await actualizarEtapa(editar.id, { nombre, color })
        : await crearEtapa(nombre, color);
      if (res.error) { toast.error(res.error); return; }
      toast.success(editar ? "Etapa actualizada" : "Etapa creada");
      onDone();
    });
  }

  function mover(dir: -1 | 1) {
    if (!editar) return;
    startTransition(async () => {
      const res = await moverEtapa(editar.id, dir);
      if (res.error) { toast.error(res.error); return; }
      onDone();
    });
  }

  function eliminar() {
    if (!editar) return;
    startTransition(async () => {
      const res = await eliminarEtapa(editar.id);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Etapa eliminada");
      onDone();
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editar ? "Editar etapa" : "Nueva etapa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Presupuesto enviado" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Color de la columna</Label>
            <div className="flex flex-wrap gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn("h-7 w-7 rounded-full border-2 transition-transform hover:scale-110", color === c ? "border-[var(--text)]" : "border-transparent")}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          {editar && (
            <div className="flex items-center justify-between rounded-[10px] bg-[var(--surface-2)] px-3 py-2">
              <span className="text-sm text-[var(--text-soft)]">Posición</span>
              <div className="flex gap-1.5">
                <Button size="icon-sm" variant="outline" disabled={idx <= 0 || isPending} onClick={() => mover(-1)} aria-label="Mover a la izquierda">
                  <ChevronLeft size={14} />
                </Button>
                <Button size="icon-sm" variant="outline" disabled={idx >= stages.length - 1 || isPending} onClick={() => mover(1)} aria-label="Mover a la derecha">
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          {editar ? (
            <Button variant="ghost" className="gap-1.5 text-[var(--error)] hover:bg-[var(--error-tint)]" disabled={isPending} onClick={eliminar}>
              <Trash2 size={14} /> Eliminar
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={guardar} disabled={isPending || !nombre.trim()}>
              {isPending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────── Dialog de oportunidad ─────────────── */

function OppDialog({ estado, stages, onClose, onDone }: {
  estado: { modo: "nueva"; stageId?: string } | { modo: "editar"; opp: Opportunity };
  stages: Stage[];
  onClose: () => void;
  onDone: () => void;
}) {
  const editar = estado.modo === "editar" ? estado.opp : null;
  const [form, setForm] = useState({
    stage_id: editar?.stage_id ?? (estado.modo === "nueva" ? estado.stageId ?? stages[0]?.id ?? "" : ""),
    nombre_contacto: editar?.nombre_contacto ?? "",
    telefono: editar?.telefono ?? "",
    email: editar?.email ?? "",
    valor: editar?.valor != null ? String(editar.valor) : "",
    origen: editar?.origen ?? "manual",
    notas: editar?.notas ?? "",
    color: (editar?.color ?? null) as string | null,
  });
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function guardar() {
    const payload = {
      stage_id: form.stage_id,
      nombre_contacto: form.nombre_contacto,
      telefono: form.telefono || undefined,
      email: form.email || "",
      valor: form.valor ? Number(form.valor) : null,
      origen: form.origen,
      notas: form.notas || undefined,
      color: form.color,
    };
    startTransition(async () => {
      const res = editar ? await actualizarOportunidad(editar.id, payload) : await crearOportunidad(payload);
      if (res.error) { toast.error(res.error); return; }
      toast.success(editar ? "Oportunidad guardada" : "Oportunidad creada");
      onDone();
    });
  }

  function eliminar() {
    if (!editar) return;
    startTransition(async () => {
      const res = await eliminarOportunidad(editar.id);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Oportunidad eliminada");
      onDone();
    });
  }

  function convertir() {
    if (!editar) return;
    startTransition(async () => {
      const res = await convertirEnPaciente(editar.id);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Convertida en paciente 🎉");
      onDone();
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editar ? "Oportunidad" : "Nueva oportunidad"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Nombre del contacto *</Label>
            <Input value={form.nombre_contacto} onChange={(e) => set("nombre_contacto", e.target.value)} placeholder="Nombre y apellidos" autoFocus={!editar} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={form.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="+34 …" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@ejemplo.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor estimado (€)</Label>
              <Input type="number" min="0" step="0.01" value={form.valor} onChange={(e) => set("valor", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Origen</Label>
              <Select value={form.origen} onValueChange={(v) => set("origen", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORIGENES.map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Etapa</Label>
            <Select value={form.stage_id} onValueChange={(v) => set("stage_id", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.nombre}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Color de la tarjeta</Label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => set("color", null)}
                className={cn("flex h-7 items-center rounded-full border px-2 text-[10px] font-semibold", form.color === null ? "border-[var(--text)] text-[var(--text)]" : "border-[var(--border)] text-[var(--text-soft)]")}
              >
                Auto
              </button>
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  onClick={() => set("color", c)}
                  className={cn("h-7 w-7 rounded-full border-2 transition-transform hover:scale-110", form.color === c ? "border-[var(--text)]" : "border-transparent")}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <textarea
              value={form.notas}
              onChange={(e) => set("notas", e.target.value)}
              rows={3}
              placeholder="Contexto, interés, próximos pasos…"
              className="w-full resize-none rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]"
            />
          </div>

          {editar && (
            <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
              {editar.patient_id ? (
                <Link href={`/pacientes/${editar.patient_id}`} className="inline-flex items-center gap-1.5 rounded-[10px] bg-[var(--brand-tint)] px-3 py-1.5 text-xs font-bold text-[var(--brand-strong)]">
                  Ver ficha de paciente <ExternalLink size={12} />
                </Link>
              ) : (
                <Button size="sm" variant="outline" className="gap-1.5" disabled={isPending} onClick={convertir}>
                  <UserPlus size={13} /> Convertir en paciente
                </Button>
              )}
              <Button size="sm" variant="ghost" className="gap-1.5 text-[var(--error)] hover:bg-[var(--error-tint)]" disabled={isPending} onClick={eliminar}>
                <Trash2 size={13} /> Eliminar
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={isPending || !form.nombre_contacto.trim() || !form.stage_id}>
            {isPending ? "Guardando…" : editar ? "Guardar cambios" : "Crear oportunidad"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
