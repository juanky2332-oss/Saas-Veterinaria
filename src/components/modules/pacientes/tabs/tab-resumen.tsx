"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Sparkles, FileText, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatFechaHora, formatRelativo, cn } from "@/lib/utils";
import { toggleRecordatoriosWa } from "@/app/actions/pacientes";
import { toast } from "sonner";
import type { Database } from "@/lib/database.types";

type Paciente = Database["public"]["Tables"]["patients"]["Row"];

interface TabResumenProps {
  paciente: Paciente;
  citas: Record<string, unknown>[];
  tratamientos: Record<string, unknown>[];
}

const estadoBadge: Record<string, { label: string; variant: "oliva" | "aviso" | "error" | "muted" | "exito" }> = {
  confirmada: { label: "Confirmada", variant: "oliva" },
  pendiente: { label: "Pendiente", variant: "aviso" },
  cancelada: { label: "Cancelada", variant: "muted" },
  completada: { label: "Completada", variant: "exito" },
  no_show: { label: "No show", variant: "error" },
};

export function TabResumen({ paciente, citas, tratamientos }: TabResumenProps) {
  const ahora = new Date();
  const citasFuturas = (citas as { inicio: string; estado: string; treatments?: { nombre: string } }[])
    .filter((c) => new Date(c.inicio) > ahora && !["cancelada", "no_show"].includes(c.estado))
    .slice(0, 3);

  const recomendaciones = (tratamientos as { treatment_id: string; proxima_recomendada_at?: string; treatments?: { nombre: string } }[])
    .filter((t) => t.proxima_recomendada_at && new Date(t.proxima_recomendada_at) < ahora);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Datos personales */}
      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DataRow label="DNI" value={paciente.dni ?? "—"} />
          <DataRow label="Fecha de nacimiento" value={paciente.fecha_nacimiento ? formatFechaHora(paciente.fecha_nacimiento).split(" ")[0] : "—"} />
          <DataRow label="Dirección" value={paciente.direccion ?? "—"} />
          <DataRow label="Origen" value={paciente.origen ?? "—"} />
          {paciente.observaciones && (
            <div>
              <p className="text-xs font-semibold text-[var(--tinta-suave)] mb-1">Observaciones</p>
              <p className="text-sm text-[var(--tinta)] bg-[var(--arena)] rounded-[8px] px-3 py-2">
                {paciente.observaciones}
              </p>
            </div>
          )}

          <RecordatoriosToggle pacienteId={paciente.id} inicial={paciente.recordatorios_wa} />
        </CardContent>
      </Card>

      {/* Próximas citas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Próximas citas</CardTitle>
            <Link
              href={`/agenda?paciente=${paciente.id}`}
              className="text-xs font-semibold text-[var(--oliva)] hover:text-[var(--oliva-oscuro)]"
            >
              Ver agenda
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {citasFuturas.length === 0 ? (
            <div className="py-6 text-center">
              <CalendarDays size={24} strokeWidth={1.5} className="mx-auto text-[var(--salvia)] mb-2" />
              <p className="text-sm text-[var(--tinta-suave)]">No hay citas próximas</p>
              <Link href={`/agenda?nueva=1&paciente=${paciente.id}`} className="mt-2 inline-block">
                <span className="text-xs font-semibold text-[var(--oliva)]">Crear cita →</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {citasFuturas.map((c, i) => {
                const b = estadoBadge[c.estado as string] ?? { label: c.estado, variant: "muted" as const };
                return (
                  <div key={i} className="flex items-center justify-between rounded-[10px] p-3 bg-[var(--arena)]">
                    <div>
                      <p className="text-sm font-semibold text-[var(--tinta)]">
                        {c.treatments?.nombre ?? "Sin tratamiento"}
                      </p>
                      <p className="text-xs text-[var(--tinta-suave)]">
                        {formatRelativo(c.inicio)}
                      </p>
                    </div>
                    <Badge variant={b.variant}>{b.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recomendaciones activas */}
      {recomendaciones.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles size={16} strokeWidth={1.75} className="text-[var(--dorado)]" />
              <CardTitle>Recomendaciones — toca renovar</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recomendaciones.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-full bg-[var(--terracota-tint)] px-3 py-1.5"
                >
                  <FileText size={12} strokeWidth={1.75} className="text-[var(--terracota)]" />
                  <span className="text-xs font-semibold text-[var(--terracota)]">
                    {r.treatments?.nombre}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RecordatoriosToggle({ pacienteId, inicial }: { pacienteId: string; inicial: boolean }) {
  const router = useRouter();
  const [activo, setActivo] = useState(inicial);

  async function toggle() {
    const nuevo = !activo;
    setActivo(nuevo);
    const res = await toggleRecordatoriosWa(pacienteId, nuevo);
    if (res.error) {
      setActivo(!nuevo);
      toast.error(res.error);
      return;
    }
    toast.success(nuevo ? "Recordatorios de WhatsApp activados" : "Recordatorios de WhatsApp desactivados");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--lino)] bg-[var(--arena)]/60 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <MessageCircle size={15} strokeWidth={1.75} className="text-[var(--oliva)]" />
        <div>
          <p className="text-xs font-bold text-[var(--tinta)]">Recordatorios por WhatsApp</p>
          <p className="text-[11px] text-[var(--tinta-suave)]">Citas y tratamientos recurrentes</p>
        </div>
      </div>
      <button
        onClick={toggle}
        role="switch"
        aria-checked={activo}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          activo ? "bg-[var(--oliva)]" : "bg-[var(--lino)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            activo ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-xs font-semibold text-[var(--tinta-suave)] shrink-0">{label}</p>
      <p className="text-sm text-[var(--tinta)] text-right">{value}</p>
    </div>
  );
}
