"use client";

import { useActionState } from "react";
import { PawPrint, Bug, Heart, ArrowRight } from "lucide-react";
import { crearClinica, type OnboardingState } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ESPECIALIDADES = [
  {
    id: "veterinaria",
    label: "Pequeños animales",
    desc: "Perros, gatos y animales de compañía",
    icon: PawPrint,
    color: "var(--brand-tint)",
    activeColor: "var(--brand)",
  },
  {
    id: "exoticos",
    label: "Animales exóticos",
    desc: "Reptiles, aves, roedores y otros",
    icon: Bug,
    color: "#FEF3C7",
    activeColor: "#D97706",
  },
  {
    id: "equina",
    label: "Medicina equina",
    desc: "Caballos, yeguas y équidos",
    icon: Heart,
    color: "#FEE2E2",
    activeColor: "#DC2626",
  },
] as const;

type EspId = (typeof ESPECIALIDADES)[number]["id"];

export function OnboardingForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(crearClinica, null);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)] px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Cabecera */}
        <div className="mb-8 text-center">
          <span className="flex h-14 w-14 mx-auto items-center justify-center rounded-[16px] bg-[var(--brand)] text-white shadow-[0_8px_24px_-8px_rgba(46,139,87,.5)]">
            <PawPrint size={28} strokeWidth={1.75} />
          </span>
          <h1 className="mt-5 text-2xl font-display font-extrabold text-[var(--text)]">Configura tu clínica veterinaria</h1>
          <p className="mt-2 text-sm text-[var(--text-soft)]">
            Un paso rápido para personalizar la plataforma a tu especialidad.
          </p>
        </div>

        <form action={formAction} className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[var(--shadow-card)] space-y-6">
          {/* Vertical hardcodeado: veterinaria — el campo oculto lo envía */}
          <input type="hidden" name="vertical" value="veterinaria" />
          <input type="hidden" name="especialidad" value="" />

          {/* Especialidad */}
          <div>
            <Label className="mb-3 block text-sm font-bold text-[var(--text)]">¿Qué tipo de animales trata tu clínica?</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {ESPECIALIDADES.map((esp) => {
                const Icon = esp.icon;
                return (
                  <label
                    key={esp.id}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-[14px] border-2 p-4 cursor-pointer text-center transition-all duration-150 select-none",
                      "hover:border-[var(--brand-soft)] hover:bg-[var(--brand-tint)]/50",
                    )}
                    style={{ borderColor: "var(--border)" }}
                  >
                    <input
                      type="radio"
                      name="especialidad_visual"
                      value={esp.id}
                      className="sr-only"
                      defaultChecked={esp.id === "veterinaria"}
                      onChange={() => {
                        // update hidden input via DOM — no state needed
                        const hidden = document.querySelector<HTMLInputElement>('input[name="especialidad"]');
                        if (hidden) hidden.value = esp.id === "veterinaria" ? "" : esp.id;
                      }}
                    />
                    <span className="flex h-12 w-12 items-center justify-center rounded-[12px]" style={{ background: esp.color }}>
                      <Icon size={22} strokeWidth={1.75} style={{ color: esp.activeColor }} />
                    </span>
                    <div>
                      <p className="font-display text-sm font-bold text-[var(--text)]">{esp.label}</p>
                      <p className="text-[11px] text-[var(--text-soft)] leading-tight mt-0.5">{esp.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-[var(--text-soft)]">Puedes atender múltiples tipos — elige el principal. Podrás cambiarlo en Configuración.</p>
          </div>

          {/* Nombre de la clínica */}
          <div className="space-y-1.5">
            <Label htmlFor="nombre" className="font-bold">Nombre de la clínica</Label>
            <Input
              id="nombre"
              name="nombre"
              required
              placeholder="p. ej. Clínica Veterinaria Norte"
              autoFocus
              className="h-11"
            />
          </div>

          {/* Tu nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="tu_nombre" className="font-bold">
              Tu nombre <span className="font-normal text-[var(--text-soft)]">(opcional)</span>
            </Label>
            <Input
              id="tu_nombre"
              name="tu_nombre"
              placeholder="Cómo te llamamos"
              className="h-11"
            />
            <p className="text-xs text-[var(--text-soft)]">Sesión: {email}</p>
          </div>

          {state?.error && (
            <div className="rounded-[12px] bg-[var(--error-tint)] border border-[var(--error)]/20 px-4 py-3">
              <p className="text-sm text-[var(--error)] font-medium">{state.error}</p>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full gap-2" disabled={pending}>
            {pending ? "Creando tu clínica…" : (
              <>Empezar a usar Veteriblandenguer <ArrowRight size={16} /></>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
