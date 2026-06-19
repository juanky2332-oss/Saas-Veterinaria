"use client";

import { useState } from "react";
import Link from "next/link";
import { PhoneIncoming, PhoneOutgoing, PhoneCall, Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Llamada {
  id: string;
  direccion: string;
  from_number: string | null;
  to_number: string | null;
  duracion_seg: number | null;
  resumen: string | null;
  transcripcion: string | null;
  grabacion_url: string | null;
  sentimiento: string | null;
  created_at: string;
  patient: { id: string; nombre: string; apellidos: string } | null;
}

const dur = (s: number | null) => {
  if (!s) return "—";
  const m = Math.floor(s / 60), r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
};
const fechaHora = (s: string) => new Date(s).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const SENT_CLS: Record<string, string> = {
  Positive: "bg-[var(--exito-tint)] text-[var(--exito)]",
  Neutral: "bg-[var(--surface-2)] text-[var(--text-soft)]",
  Negative: "bg-[var(--error-tint)] text-[var(--error)]",
};

export function VozView({ llamadas, configurado }: { llamadas: Llamada[]; configurado: boolean }) {
  const [sel, setSel] = useState<Llamada | null>(llamadas[0] ?? null);

  if (!configurado && llamadas.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center shadow-[var(--shadow-card)]">
        <PhoneCall size={28} className="mx-auto mb-3 text-[var(--brand-soft)]" />
        <h2 className="font-display text-lg font-bold text-[var(--text)]">Aún no has configurado el agente de voz</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--text-soft)]">
          Conecta tu cuenta de Retell y tu número de Twilio, define la base de conocimiento de tu clínica y empieza a recibir llamadas atendidas por IA con transcripción automática.
        </p>
        <Link href="/configuracion/voz" className="mt-4 inline-block">
          <Button className="gap-1.5"><Settings size={15} /> Configurar agente de voz</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      {/* Lista */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--text)]">{llamadas.length} llamada(s)</p>
          <Link href="/configuracion/voz" className="text-xs font-semibold text-[var(--brand)] hover:underline">Configurar</Link>
        </div>
        {llamadas.length === 0 ? (
          <p className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-4 py-8 text-center text-sm text-[var(--text-soft)]">
            Sin llamadas todavía. Cuando entre una, aparecerá aquí con su transcripción.
          </p>
        ) : (
          llamadas.map((c) => {
            const entrante = c.direccion === "inbound";
            const activa = sel?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSel(c)}
                className={cn(
                  "w-full rounded-[12px] border p-3 text-left transition-colors",
                  activa ? "border-[var(--brand)] bg-[var(--brand-tint)]" : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]",
                )}
              >
                <div className="flex items-center gap-2">
                  {entrante ? <PhoneIncoming size={14} className="text-[var(--exito)]" /> : <PhoneOutgoing size={14} className="text-[var(--brand)]" />}
                  <span className="truncate text-sm font-semibold text-[var(--text)]">
                    {c.patient ? `${c.patient.nombre} ${c.patient.apellidos}` : (entrante ? c.from_number : c.to_number) ?? "Desconocido"}
                  </span>
                  <span className="ml-auto shrink-0 text-[11px] text-[var(--text-soft)]">{dur(c.duracion_seg)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--text-soft)]">{c.resumen ?? "Sin resumen."}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-soft)]">{fechaHora(c.created_at)}</p>
              </button>
            );
          })
        )}
      </div>

      {/* Detalle */}
      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        {!sel ? (
          <p className="py-16 text-center text-sm text-[var(--text-soft)]">Selecciona una llamada para ver su transcripción.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold text-[var(--text)]">
                {sel.patient ? (
                  <Link href={`/pacientes/${sel.patient.id}`} className="hover:text-[var(--brand)]">{sel.patient.nombre} {sel.patient.apellidos}</Link>
                ) : (sel.direccion === "inbound" ? sel.from_number : sel.to_number) ?? "Llamada"}
              </h2>
              <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-soft)]">{dur(sel.duracion_seg)}</span>
              {sel.sentimiento && (
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", SENT_CLS[sel.sentimiento] ?? "bg-[var(--surface-2)] text-[var(--text-soft)]")}>
                  {sel.sentimiento}
                </span>
              )}
              <span className="ml-auto text-xs text-[var(--text-soft)]">{fechaHora(sel.created_at)}</span>
            </div>

            {sel.resumen && (
              <div className="rounded-[12px] bg-[var(--brand-tint)] p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--brand-strong)]">
                  <Sparkles size={12} /> Resumen IA
                </p>
                <p className="text-sm text-[var(--text)]">{sel.resumen}</p>
              </div>
            )}

            {sel.grabacion_url && (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <audio controls src={sel.grabacion_url} className="w-full" />
            )}

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--text-soft)]">Transcripción</p>
              {sel.transcripcion ? (
                <pre className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-[12px] border border-[var(--border)] bg-[var(--bg)] p-3 font-body text-sm leading-relaxed text-[var(--text)]">
                  {sel.transcripcion}
                </pre>
              ) : (
                <p className="text-sm text-[var(--text-soft)]">Sin transcripción disponible.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
