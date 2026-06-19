"use client";

import { useActionState, useState } from "react";
import { Sparkles, Stethoscope, HeartPulse, Activity, Brain, PawPrint } from "lucide-react";
import { crearClinica, type OnboardingState } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ESPECIALIDADES_POR_VERTICAL,
  verticalDeEspecialidad,
} from "@/lib/especialidades";

const VERTICALES = [
  { id: "estetica", label: "Estética", desc: "Medicina estética, wellness, dermo", icon: Sparkles },
  { id: "dental", label: "Dental", desc: "Odontología, ortodoncia, implantes", icon: Stethoscope },
  { id: "fisioterapia", label: "Fisioterapia", desc: "Fisio, osteopatía, readaptación", icon: Activity },
  { id: "psicologia", label: "Psicología", desc: "Psicología, terapia, logopedia", icon: Brain },
  { id: "veterinaria", label: "Veterinaria", desc: "Clínicas y hospitales veterinarios", icon: PawPrint },
  { id: "general", label: "Otra especialidad", desc: "Medicina general o cualquier clínica", icon: HeartPulse },
] as const;

const VERTICAL_LABEL: Record<string, string> = {
  estetica: "Estética y dermo",
  dental: "Dental",
  fisioterapia: "Fisioterapia y movimiento",
  psicologia: "Salud mental y habla",
  veterinaria: "Veterinaria",
  general: "Medicina general y otras",
};

export function OnboardingForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(crearClinica, null);
  const [vertical, setVertical] = useState<string>("estetica");
  const [especialidad, setEspecialidad] = useState<string>("");

  function elegirVertical(id: string) {
    setVertical(id);
    // Si la especialidad elegida ya no pertenece a esta familia, la limpiamos.
    if (especialidad && verticalDeEspecialidad(especialidad) !== id) setEspecialidad("");
  }

  function elegirEspecialidad(value: string) {
    setEspecialidad(value);
    const v = verticalDeEspecialidad(value);
    if (v) setVertical(v);
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)] px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <span className="flex h-11 w-11 mx-auto items-center justify-center rounded-[12px] bg-[var(--brand)] text-white text-xl font-display font-bold shadow-[var(--shadow-card)]">
            C
          </span>
          <h1 className="mt-4 text-2xl font-display font-bold text-[var(--text)]">Crea tu clínica</h1>
          <p className="mt-1 text-sm text-[var(--text-soft)]">
            Un último paso para empezar. Personalizaremos Clinicomatic según tu especialidad.
          </p>
        </div>

        <form action={formAction} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] space-y-6">
          <input type="hidden" name="vertical" value={vertical} />
          <input type="hidden" name="especialidad" value={especialidad} />

          <div>
            <Label className="mb-2 block">Tipo de clínica</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {VERTICALES.map((v) => {
                const Icon = v.icon;
                const active = vertical === v.id;
                return (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => elegirVertical(v.id)}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-[12px] border p-3.5 text-left transition-all",
                      active
                        ? "border-[var(--brand)] bg-[var(--brand-tint)] ring-2 ring-[var(--brand)]/20"
                        : "border-[var(--border)] hover:border-[var(--brand-soft)] hover:bg-[var(--surface-2)]",
                    )}
                  >
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-[10px]", active ? "bg-[var(--brand)] text-white" : "bg-[var(--surface-2)] text-[var(--text-soft)]")}>
                      <Icon size={18} strokeWidth={1.75} />
                    </span>
                    <span className="font-display font-semibold text-sm text-[var(--text)]">{v.label}</span>
                    <span className="text-[11px] leading-tight text-[var(--text-soft)]">{v.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="especialidad">Especialidad concreta <span className="font-normal text-[var(--text-soft)]">(opcional)</span></Label>
            <select
              id="especialidad"
              value={especialidad}
              onChange={(e) => elegirEspecialidad(e.target.value)}
              className="h-11 w-full rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus-visible:border-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/20"
            >
              <option value="">Sin especificar — usar configuración del tipo elegido</option>
              {(Object.keys(ESPECIALIDADES_POR_VERTICAL) as (keyof typeof ESPECIALIDADES_POR_VERTICAL)[]).map((vert) => (
                <optgroup key={vert} label={VERTICAL_LABEL[vert]}>
                  {ESPECIALIDADES_POR_VERTICAL[vert].map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-xs text-[var(--text-soft)]">
              Ajustamos el tema y las funciones activas a tu especialidad. Podrás cambiarlas luego en Configuración → Funciones.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre de la clínica</Label>
            <Input id="nombre" name="nombre" required placeholder="p. ej. Clínica Sonrisa" autoFocus />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tu_nombre">Tu nombre</Label>
            <Input id="tu_nombre" name="tu_nombre" placeholder="Cómo te llamamos" defaultValue="" />
            <p className="text-xs text-[var(--text-soft)]">Sesión: {email}</p>
          </div>

          {state?.error && (
            <p className="text-sm text-[var(--error)] bg-[var(--error-tint)] rounded-[10px] px-3 py-2">{state.error}</p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Creando tu clínica…" : "Crear clínica y empezar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
