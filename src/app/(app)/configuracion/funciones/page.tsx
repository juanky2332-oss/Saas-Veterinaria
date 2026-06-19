import { getCurrentOrg } from "@/lib/auth/org";
import { resolveFeatures } from "@/lib/features";
import { PRESET_BY_VERTICAL } from "@/lib/theme/themes";
import { FuncionesClient } from "./funciones-client";

export const metadata = { title: "Funciones — Clinicomatic" };

export default async function FuncionesPage() {
  const org = await getCurrentOrg();
  if (!org) return null;

  const features = resolveFeatures(org.vertical, org.features);
  const verticalLabel = PRESET_BY_VERTICAL[org.vertical]?.label ?? org.vertical;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--text)]">Funciones de la clínica</h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          Clinicomatic se adapta a tu especialidad. Activa o desactiva los módulos del menú y las
          secciones de la ficha del paciente que tu clínica necesita. Tu punto de partida es el
          recomendado para <strong className="text-[var(--text)]">{verticalLabel}</strong>.
        </p>
      </div>
      <FuncionesClient
        initial={features}
        vertical={org.vertical}
        verticalLabel={verticalLabel}
      />
    </div>
  );
}
