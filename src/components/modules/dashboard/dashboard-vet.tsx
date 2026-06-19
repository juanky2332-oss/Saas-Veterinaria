"use client";

import { Card } from "@/components/ui/card";
import { PawPrint, CalendarDays, Syringe, Users, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Cita = { id: string; fecha_hora: string; motivo: string | null; mascotas: { nombre: string; especie: string } | null };
type VacunaProxima = { id: string; vacuna: string; fecha_proxima: string; mascotas: { id: string; nombre: string } | null };

interface Props {
  totalMascotas: number;
  totalClientes: number;
  citasHoy: Cita[];
  vacunasProximas: VacunaProxima[];
  clinicName: string;
}

export function DashboardVet({ totalMascotas, totalClientes, citasHoy, vacunasProximas, clinicName }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Bienvenido a {clinicName}</h1>
        <p className="text-sm text-[var(--text-soft)]">{format(new Date(), "EEEE, d MMMM yyyy", { locale: es })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Mascotas", value: totalMascotas, icon: PawPrint, href: "/mascotas" },
          { label: "Clientes", value: totalClientes, icon: Users, href: "/clientes" },
          { label: "Citas hoy", value: citasHoy.length, icon: CalendarDays, href: "/agenda" },
          { label: "Vacunas próximas", value: vacunasProximas.length, icon: Syringe, href: "/vacunaciones" },
        ].map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="p-4 hover:bg-[var(--brand-tint)] transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--brand-tint)]">
                  <Icon className="size-4 text-[var(--brand)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-[var(--text-soft)]">{label}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Citas de hoy */}
        <Card className="p-4">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <CalendarDays className="size-4 text-[var(--brand)]" /> Citas de hoy
          </h2>
          {citasHoy.length === 0 ? (
            <p className="text-sm text-[var(--text-soft)]">No hay citas programadas para hoy.</p>
          ) : (
            <div className="space-y-2">
              {citasHoy.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center gap-3 text-sm">
                  <span className="text-[var(--text-soft)] shrink-0 text-xs">
                    {format(new Date(c.fecha_hora), "HH:mm")}
                  </span>
                  <PawPrint className="size-3.5 text-[var(--brand)] shrink-0" />
                  <span className="truncate">{c.mascotas?.nombre ?? "Mascota"}</span>
                  {c.motivo && <span className="text-[var(--text-soft)] truncate">· {c.motivo}</span>}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Vacunas que vencen pronto */}
        <Card className="p-4">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Syringe className="size-4 text-[var(--brand)]" /> Vacunas por renovar
          </h2>
          {vacunasProximas.length === 0 ? (
            <p className="text-sm text-[var(--text-soft)]">Ninguna vacuna pendiente en los próximos 30 días.</p>
          ) : (
            <div className="space-y-2">
              {vacunasProximas.slice(0, 5).map((v) => (
                <div key={v.id} className="flex items-center gap-3 text-sm">
                  <AlertCircle className="size-3.5 text-amber-500 shrink-0" />
                  <Link href={`/mascotas/${v.mascotas?.id}`} className="truncate hover:text-[var(--brand)]">
                    {v.mascotas?.nombre ?? "Mascota"}
                  </Link>
                  <span className="text-[var(--text-soft)] shrink-0 text-xs">
                    {v.vacuna} · {format(new Date(v.fecha_proxima), "d MMM", { locale: es })}
                  </span>
                </div>
              ))}
              {vacunasProximas.length > 5 && (
                <Link href="/vacunaciones" className="text-xs text-[var(--brand)] hover:underline">
                  Ver todas ({vacunasProximas.length})
                </Link>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
