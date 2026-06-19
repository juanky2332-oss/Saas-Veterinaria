"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, LayoutGrid, ClipboardList } from "lucide-react";
import { guardarFunciones } from "@/app/actions/funciones";
import { FEATURES, resolveFeatures, type FeatureKey, type FeatureState } from "@/lib/features";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  initial: FeatureState;
  vertical: string;
  verticalLabel: string;
}

const MODULOS = FEATURES.filter((f) => f.group === "modulo");
const FICHA = FEATURES.filter((f) => f.group === "ficha");

export function FuncionesClient({ initial, vertical, verticalLabel }: Props) {
  const router = useRouter();
  const [state, setState] = useState<FeatureState>(initial);
  const [guardando, setGuardando] = useState(false);

  const preset = useMemo(() => resolveFeatures(vertical, {}), [vertical]);
  const dirty = useMemo(
    () => FEATURES.some((f) => state[f.key] !== initial[f.key]),
    [state, initial],
  );

  function toggle(key: FeatureKey) {
    setState((s) => ({ ...s, [key]: !s[key] }));
  }

  async function guardar() {
    setGuardando(true);
    const res = await guardarFunciones(state);
    setGuardando(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Funciones actualizadas. El menú y las fichas ya reflejan tu configuración.");
    router.refresh();
  }

  function restaurar() {
    setState(preset);
    toast.message(`Restaurado al recomendado para ${verticalLabel}. Recuerda guardar.`);
  }

  return (
    <div className="space-y-6">
      <Grupo
        icon={<LayoutGrid size={17} strokeWidth={1.9} />}
        titulo="Módulos del menú"
        desc="Qué aparece en la navegación principal de tu clínica."
        items={MODULOS}
        state={state}
        onToggle={toggle}
      />
      <Grupo
        icon={<ClipboardList size={17} strokeWidth={1.9} />}
        titulo="Secciones de la ficha del paciente"
        desc="Qué pestañas y datos se muestran al abrir un paciente."
        items={FICHA}
        state={state}
        onToggle={toggle}
      />

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)]/95 p-4 shadow-[var(--shadow-pop)] backdrop-blur-sm">
        <Button size="lg" onClick={guardar} disabled={guardando || !dirty}>
          {guardando ? "Guardando…" : dirty ? "Guardar cambios" : "Sin cambios"}
        </Button>
        <Button size="lg" variant="outline" className="gap-1.5" onClick={restaurar} disabled={guardando}>
          <RotateCcw size={15} /> Recomendado para {verticalLabel}
        </Button>
      </div>
    </div>
  );
}

function Grupo({
  icon,
  titulo,
  desc,
  items,
  state,
  onToggle,
}: {
  icon: React.ReactNode;
  titulo: string;
  desc: string;
  items: typeof FEATURES;
  state: FeatureState;
  onToggle: (k: FeatureKey) => void;
}) {
  return (
    <section className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[var(--brand-tint)] text-[var(--brand-strong)]">
          {icon}
        </span>
        <div>
          <h2 className="font-display font-semibold text-[var(--text)]">{titulo}</h2>
          <p className="text-sm text-[var(--text-soft)]">{desc}</p>
        </div>
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {items.map((f) => (
          <li key={f.key} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                {f.label}
                {f.soon && (
                  <span className="rounded-full bg-[var(--accent-tint)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
                    Próximamente
                  </span>
                )}
              </p>
              <p className="text-xs text-[var(--text-soft)]">{f.desc}</p>
            </div>
            <Toggle on={state[f.key]} onClick={() => onToggle(f.key)} label={f.label} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${on ? "Desactivar" : "Activar"} ${label}`}
      onClick={onClick}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40",
        on ? "bg-[var(--brand)]" : "bg-[var(--border)]",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          on ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
