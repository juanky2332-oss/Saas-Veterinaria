"use client";

import { useState } from "react";
import {
  FileText, Plus, ChevronDown, ChevronUp, Mic, Calendar, User, Stethoscope, PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFecha } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface CitaHistorial {
  id: string;
  inicio: string;
  estado: string;
  notas?: string | null;
  treatments?: { nombre: string; categoria: string } | null;
  profiles?: { nombre: string } | null;
}

export interface InformeHistorial {
  id: string;
  contenido: {
    motivo?: string;
    tratamiento?: string;
    producto_lote?: string;
    observaciones?: string;
    pauta_seguimiento?: string;
  };
  created_at: string;
  transcripcion_origen: string;
  appointment_id: string | null;
  profiles?: { nombre: string } | null;
  appointments?: { inicio: string; treatments?: { nombre: string } | null } | null;
}

interface TabHistorialProps {
  citas: Record<string, unknown>[];
  informes: InformeHistorial[];
  onRegistrarVisita: (cita?: CitaHistorial) => void;
}

const SECCIONES_INFORME: { key: keyof InformeHistorial["contenido"]; label: string }[] = [
  { key: "motivo", label: "Motivo" },
  { key: "tratamiento", label: "Tratamiento aplicado" },
  { key: "producto_lote", label: "Producto y lote" },
  { key: "observaciones", label: "Observaciones" },
  { key: "pauta_seguimiento", label: "Pauta / seguimiento" },
];

export function TabHistorial({ citas, informes, onRegistrarVisita }: TabHistorialProps) {
  const todas = citas as unknown as CitaHistorial[];
  const pasadas = todas.filter((c) => ["completada", "no_show", "cancelada"].includes(c.estado));
  const conInforme = new Set(informes.map((i) => i.appointment_id).filter(Boolean));
  const sinInforme = pasadas.filter((c) => !conInforme.has(c.id));

  return (
    <div className="space-y-4 animate-in fade-in-0 duration-300">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--tinta-suave)]">
          {informes.length} informe{informes.length !== 1 ? "s" : ""} · {pasadas.length} visita{pasadas.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => onRegistrarVisita()}>
          <Plus size={13} strokeWidth={2} /> Registrar visita
        </Button>
      </div>

      {informes.length === 0 && pasadas.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--salvia-tint)]">
            <Stethoscope size={22} strokeWidth={1.5} className="text-[var(--salvia)]" />
          </div>
          <h3 className="font-display text-base font-semibold text-[var(--tinta)]">Sin historial clínico</h3>
          <p className="mt-1 max-w-xs text-sm text-[var(--tinta-suave)]">
            Registra la primera visita: puedes dictar el informe por voz y la IA lo estructura.
          </p>
          <Button size="sm" className="mt-4 gap-1.5" onClick={() => onRegistrarVisita()}>
            <Mic size={13} strokeWidth={2} /> Registrar primera visita
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Informes clínicos */}
          {informes.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--tinta-suave)]">Informes clínicos</p>
              {informes.map((inf, i) => (
                <InformeCard key={inf.id} informe={inf} index={i} />
              ))}
            </div>
          )}

          {/* Visitas sin informe */}
          {sinInforme.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--tinta-suave)]">Visitas sin informe</p>
              {sinInforme.map((cita) => (
                <div
                  key={cita.id}
                  className="flex items-center gap-3 rounded-[14px] border border-dashed border-[var(--lino)] bg-[var(--blanco-calido)]/70 px-4 py-3"
                >
                  <Calendar size={15} className="shrink-0 text-[var(--tinta-suave)]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--tinta)]">
                      {cita.treatments?.nombre ?? "Visita"} · {formatFecha(cita.inicio)}
                    </p>
                    <p className="text-[11px] capitalize text-[var(--tinta-suave)]">{cita.estado.replace("_", " ")}</p>
                  </div>
                  {cita.estado === "completada" && (
                    <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => onRegistrarVisita(cita)}>
                      <Mic size={12} /> Dictar informe
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InformeCard({ informe, index }: { informe: InformeHistorial; index: number }) {
  const [abierto, setAbierto] = useState(index === 0);
  const fecha = informe.appointments?.inicio ?? informe.created_at;
  const titulo = informe.contenido.motivo || informe.appointments?.treatments?.nombre || "Informe clínico";
  const esVoz = informe.transcripcion_origen === "voz";

  return (
    <div
      style={{ animationDelay: `${index * 40}ms` }}
      className="overflow-hidden rounded-[14px] border border-[var(--lino)] bg-[var(--blanco-calido)] shadow-[var(--shadow-card)] animate-in fade-in-0 slide-in-from-bottom-2"
    >
      <button
        onClick={() => setAbierto((a) => !a)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--arena)]"
      >
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]", esVoz ? "bg-[var(--salvia-tint)] text-[var(--oliva)]" : "bg-[var(--arena)] text-[var(--tinta-suave)]")}>
          {esVoz ? <Mic size={15} strokeWidth={1.75} /> : <PenLine size={15} strokeWidth={1.75} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--tinta)]">{titulo}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] text-[var(--tinta-suave)]">
              <Calendar size={10} /> {formatFecha(fecha)}
            </span>
            {informe.profiles?.nombre && (
              <span className="flex items-center gap-1 text-[11px] text-[var(--tinta-suave)]">
                <User size={10} /> {informe.profiles.nombre}
              </span>
            )}
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", esVoz ? "bg-[var(--salvia-tint)] text-[var(--oliva)]" : "bg-[var(--arena)] text-[var(--tinta-suave)]")}>
              {esVoz ? "Dictado por voz" : "Escrito"}
            </span>
          </div>
        </div>
        {abierto ? <ChevronUp size={15} className="shrink-0 text-[var(--tinta-suave)]" /> : <ChevronDown size={15} className="shrink-0 text-[var(--tinta-suave)]" />}
      </button>

      {abierto && (
        <div className="space-y-3 border-t border-[var(--lino)] px-4 pb-4 pt-3">
          {SECCIONES_INFORME.map(({ key, label }) => {
            const valor = informe.contenido[key];
            if (!valor?.trim()) return null;
            return (
              <div key={key}>
                <p className="mb-0.5 text-[10.5px] font-bold uppercase tracking-wide text-[var(--tinta-suave)]">{label}</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--tinta)]">{valor}</p>
              </div>
            );
          })}
          {!SECCIONES_INFORME.some(({ key }) => informe.contenido[key]?.trim()) && (
            <p className="flex items-center gap-2 text-sm text-[var(--tinta-suave)]">
              <FileText size={14} /> Informe sin contenido.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
