import { createClient } from "@/lib/supabase/server";
import { EquipoClient } from "./equipo-client";

export const metadata = { title: "Equipo — VetClinic" };

export default async function EquipoPage() {
  const supabase = await createClient();
  const { data: miembros } = await supabase
    .from("profiles")
    .select("id, nombre, rol, activo")
    .order("rol")
    .order("nombre");

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--text)]">Equipo</h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">Gestiona quién accede a tu clínica y con qué rol.</p>
      </div>
      <EquipoClient miembros={miembros ?? []} />
    </div>
  );
}
