"use client";

import Link from "next/link";
import {
  CalendarDays, MessageCircle, Package, Sparkles, Clock,
  ArrowRight, TrendingUp, AlertTriangle, Bot,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatHora, iniciales, formatRelativo } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  patients: { nombre: string; apellidos: string } | null;
  treatments: { nombre: string } | null;
};
type Recomendacion = Database["public"]["Views"]["v_recomendaciones_pendientes"]["Row"];
type StockBajo = Database["public"]["Views"]["v_stock_bajo"]["Row"];
type Conversacion = Database["public"]["Tables"]["wa_conversations"]["Row"];

interface DashboardContentProps {
  citasHoy: Appointment[];
  recomendaciones: Recomendacion[];
  stockBajo: StockBajo[];
  conversacionesPendientes: Conversacion[];
}

const estadoBadge: Record<string, { label: string; variant: "oliva" | "aviso" | "error" | "muted" | "exito" }> = {
  confirmada: { label: "Confirmada", variant: "oliva" },
  pendiente: { label: "Pendiente", variant: "aviso" },
  cancelada: { label: "Cancelada", variant: "muted" },
  completada: { label: "Completada", variant: "exito" },
  no_show: { label: "No show", variant: "error" },
};

export function DashboardContent({ citasHoy, recomendaciones, stockBajo, conversacionesPendientes }: DashboardContentProps) {
  return (
    <div className="h-full flex flex-col gap-5 p-4 md:p-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-400">

      {/* KPI strip — full width */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            icon: <CalendarDays size={20} strokeWidth={1.75} className="text-[var(--oliva)]" />,
            bg: "bg-[var(--salvia-tint)]",
            label: "Citas hoy", value: citasHoy.length, href: "/agenda", delay: 0,
          },
          {
            icon: <MessageCircle size={20} strokeWidth={1.75} className="text-[var(--terracota)]" />,
            bg: "bg-[var(--terracota-tint)]",
            label: "WhatsApp sin leer",
            value: conversacionesPendientes.reduce((s, c) => s + c.no_leidos, 0),
            href: "/whatsapp", delay: 60,
          },
          {
            icon: <Sparkles size={20} strokeWidth={1.75} className="text-[var(--dorado)]" />,
            bg: "bg-[var(--aviso-tint)]",
            label: "Recomendaciones", value: recomendaciones.length, href: "/pacientes", delay: 120,
          },
          {
            icon: <Package size={20} strokeWidth={1.75} className="text-[var(--error)]" />,
            bg: "bg-[var(--error-tint)]",
            label: "Stock bajo", value: stockBajo.length, href: "/inventario", delay: 180,
          },
        ].map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            aria-label={`Ver ${kpi.label}`}
            style={{ animationDelay: `${kpi.delay}ms` }}
            className="group relative overflow-hidden rounded-[16px] border border-[var(--lino)] bg-[var(--blanco-calido)] p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oliva)] focus-visible:ring-offset-2 animate-in fade-in-0 slide-in-from-bottom-3"
          >
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-[10px] ${kpi.bg} mb-3`}>
              {kpi.icon}
            </div>
            <p className="text-3xl font-display font-bold text-[var(--tinta)] tabular-nums leading-none">{kpi.value}</p>
            <p className="text-xs font-semibold text-[var(--tinta-suave)] mt-1.5">{kpi.label}</p>
            <ArrowRight size={14} className="absolute right-4 top-4 text-[var(--lino)] group-hover:text-[var(--oliva)] transition-colors" />
          </Link>
        ))}
      </div>

      {/* Main grid — responsive: 1 col móvil, 2 tablet, 3 desktop */}
      <div className="flex-1 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 min-h-0">

        {/* Citas de hoy */}
        <div className="flex flex-col rounded-[16px] border border-[var(--lino)] bg-[var(--blanco-calido)] shadow-[var(--shadow-card)] overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-400" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--lino)]">
            <div className="flex items-center gap-2">
              <CalendarDays size={15} strokeWidth={1.75} className="text-[var(--oliva)]" />
              <h3 className="font-display text-base font-semibold text-[var(--tinta)]">Citas de hoy</h3>
            </div>
            <Link href="/agenda" className="flex items-center gap-1 text-xs font-semibold text-[var(--oliva)] hover:text-[var(--oliva-oscuro)] transition-colors">
              Ver agenda <ArrowRight size={11} />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {citasHoy.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--salvia-tint)] mb-3">
                  <CalendarDays size={20} strokeWidth={1.5} className="text-[var(--salvia)]" />
                </div>
                <p className="text-sm font-semibold text-[var(--tinta)]">Sin citas hoy</p>
                <p className="text-xs text-[var(--tinta-suave)] mt-1">Hoy no hay citas programadas. Buen momento para respirar.</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--lino)]">
                {citasHoy.map((cita, i) => {
                  const badge = estadoBadge[cita.estado] ?? { label: cita.estado, variant: "muted" as const };
                  const nombre = cita.patients ? `${cita.patients.nombre} ${cita.patients.apellidos}` : "—";
                  return (
                    <Link
                      key={cita.id}
                      href={`/agenda?cita=${cita.id}`}
                      style={{ animationDelay: `${i * 40}ms` }}
                      className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--arena)] transition-colors animate-in fade-in-0 slide-in-from-left-2"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--terracota-tint)] text-[10px] font-display font-bold text-[var(--terracota)]">
                        {iniciales(cita.patients?.nombre ?? "?", cita.patients?.apellidos)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--tinta)] truncate">{nombre}</p>
                        <p className="text-xs text-[var(--tinta-suave)] truncate">{cita.treatments?.nombre ?? "Sin tratamiento"} · Sala {cita.sala}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1 text-[11px] text-[var(--tinta-suave)] tabular-nums">
                          <Clock size={10} />
                          {formatHora(cita.inicio)}
                        </div>
                        <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recomendaciones pendientes */}
        <div className="flex flex-col rounded-[16px] border border-[var(--lino)] bg-[var(--blanco-calido)] shadow-[var(--shadow-card)] overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-400" style={{ animationDelay: "140ms" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--lino)]">
            <div className="flex items-center gap-2">
              <Sparkles size={15} strokeWidth={1.75} className="text-[var(--dorado)]" />
              <h3 className="font-display text-base font-semibold text-[var(--tinta)]">Toca contactar</h3>
            </div>
            <Link href="/pacientes" className="flex items-center gap-1 text-xs font-semibold text-[var(--oliva)] hover:text-[var(--oliva-oscuro)] transition-colors">
              Ver todas <ArrowRight size={11} />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            {recomendaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--exito-tint)] mb-3">
                  <TrendingUp size={20} strokeWidth={1.5} className="text-[var(--exito)]" />
                </div>
                <p className="text-sm font-semibold text-[var(--tinta)]">Todo al día</p>
                <p className="text-xs text-[var(--tinta-suave)] mt-1">No hay tratamientos pendientes de contactar.</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--lino)]">
                {recomendaciones.slice(0, 8).map((r, i) => (
                  <Link
                    key={`${r.patient_id}-${r.treatment_id}`}
                    href={`/pacientes/${r.patient_id}`}
                    style={{ animationDelay: `${i * 35}ms` }}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--arena)] transition-colors animate-in fade-in-0 slide-in-from-left-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--salvia-tint)] text-[10px] font-display font-bold text-[var(--oliva)]">
                      {iniciales(r.patient_nombre ?? "", r.patient_apellidos ?? "")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--tinta)] truncate">{r.patient_nombre} {r.patient_apellidos}</p>
                      <p className="text-xs text-[var(--tinta-suave)] truncate">{r.treatment_nombre}</p>
                    </div>
                    <Badge variant={(r.dias_vencido ?? 0) > 30 ? "error" : "aviso"} className="text-[10px] shrink-0">
                      {r.dias_vencido ?? 0}d
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp + stock en columna */}
        <div className="flex flex-col gap-4 lg:col-span-2 xl:col-span-1">

          {/* WhatsApp sin atender */}
          {conversacionesPendientes.length > 0 && (
            <div className="rounded-[16px] border border-[var(--lino)] bg-[var(--blanco-calido)] shadow-[var(--shadow-card)] overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-400" style={{ animationDelay: "200ms" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--lino)]">
                <div className="flex items-center gap-2">
                  <MessageCircle size={15} strokeWidth={1.75} className="text-[var(--terracota)]" />
                  <h3 className="font-display text-base font-semibold text-[var(--tinta)]">WhatsApp</h3>
                </div>
                <Link href="/whatsapp" className="flex items-center gap-1 text-xs font-semibold text-[var(--oliva)] hover:text-[var(--oliva-oscuro)] transition-colors">
                  Bandeja <ArrowRight size={11} />
                </Link>
              </div>
              <div className="divide-y divide-[var(--lino)]">
                {conversacionesPendientes.slice(0, 4).map((conv, i) => (
                  <Link
                    key={conv.id}
                    href={`/whatsapp?conv=${conv.id}`}
                    style={{ animationDelay: `${i * 30}ms` }}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--arena)] transition-colors animate-in fade-in-0"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--terracota-tint)]">
                      {conv.estado_agente === "humano"
                        ? <AlertTriangle size={13} strokeWidth={2} className="text-[var(--terracota)]" />
                        : <Bot size={13} strokeWidth={1.75} className="text-[var(--terracota)]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--tinta)] tabular-nums truncate">{conv.telefono}</p>
                      <p className="text-[11px] text-[var(--tinta-suave)]">
                        {conv.ultima_entrada_at ? formatRelativo(conv.ultima_entrada_at) : "—"}
                      </p>
                    </div>
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--terracota)] text-[10px] font-bold text-white">
                      {conv.no_leidos}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Stock bajo */}
          {stockBajo.length > 0 && (
            <div className="rounded-[16px] border border-[var(--error)]/30 bg-[var(--error-tint)]/60 shadow-[var(--shadow-card)] overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-400" style={{ animationDelay: "260ms" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--error)]/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} strokeWidth={1.75} className="text-[var(--error)]" />
                  <h3 className="font-display text-base font-semibold text-[var(--tinta)]">Stock bajo</h3>
                </div>
                <Link href="/inventario" className="flex items-center gap-1 text-xs font-semibold text-[var(--oliva)] hover:text-[var(--oliva-oscuro)] transition-colors">
                  Inventario <ArrowRight size={11} />
                </Link>
              </div>
              <div className="divide-y divide-[var(--error)]/10">
                {stockBajo.map((p, i) => (
                  <div key={p.id} style={{ animationDelay: `${i * 30}ms` }} className="flex items-center justify-between px-5 py-3 animate-in fade-in-0">
                    <div>
                      <p className="text-sm font-semibold text-[var(--tinta)]">{p.nombre}</p>
                      <p className="text-[11px] text-[var(--tinta-suave)]">{p.categoria}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--error)] tabular-nums">{p.unidades} ud.</p>
                      <p className="text-[11px] text-[var(--tinta-suave)]">mín. {p.umbral_alerta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
