import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { CajaView } from "@/components/modules/gestion/caja-view";

export const metadata = { title: "Caja — Veteriblandenguer" };

export default async function CajaPage() {
  const supabase = await createClient();

  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);

  const [sesionRes, movimientosRes, pacientesRes] = await Promise.all([
    supabase.from("cash_sessions").select("id, fecha, apertura, estado").eq("estado", "abierta").maybeSingle(),
    supabase
      .from("cash_movements")
      .select("id, fecha, tipo, concepto, metodo, importe, patient:patients(nombre, apellidos)")
      .gte("fecha", inicioHoy.toISOString())
      .order("fecha", { ascending: false }),
    supabase.from("patients").select("id, nombre, apellidos").is("deleted_at", null).order("apellidos").limit(500),
  ]);

  const pacientes = (pacientesRes.data ?? []).map((p) => ({ value: p.id, label: `${p.nombre} ${p.apellidos}` }));

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Caja" />
      <div className="flex-1 p-4 md:p-6">
        <CajaView
          sesion={sesionRes.data ?? null}
          movimientos={(movimientosRes.data ?? []) as never}
          pacientes={pacientes}
        />
      </div>
    </div>
  );
}
