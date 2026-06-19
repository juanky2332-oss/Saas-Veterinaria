import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { CuotasView } from "@/components/modules/gestion/cuotas-view";

export const metadata = { title: "Cuotas — Clinicomatic" };

export default async function CuotasPage() {
  const supabase = await createClient();
  const [cuotasRes, pacientesRes] = await Promise.all([
    supabase
      .from("cuotas")
      .select("id, concepto, importe, periodicidad, proximo_cobro, metodo, activo, patient:patients(nombre, apellidos)")
      .order("created_at", { ascending: false }),
    supabase.from("patients").select("id, nombre, apellidos").is("deleted_at", null).order("apellidos").limit(500),
  ]);

  const pacientes = (pacientesRes.data ?? []).map((p) => ({
    value: p.id,
    label: `${p.nombre} ${p.apellidos}`,
  }));

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Cuotas" />
      <div className="flex-1 p-4 md:p-6">
        <CuotasView rows={(cuotasRes.data ?? []) as never} pacientes={pacientes} />
      </div>
    </div>
  );
}
