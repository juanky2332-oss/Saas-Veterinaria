import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { BonosView } from "@/components/modules/gestion/bonos-view";

export const metadata = { title: "Bonos — Clinicomatic" };

export default async function BonosPage() {
  const supabase = await createClient();
  const [bonosRes, plantillasRes, pacientesRes, tratamientosRes] = await Promise.all([
    supabase
      .from("bonos")
      .select("id, nombre, sesiones_total, sesiones_usadas, precio, estado, caducidad, patient:patients(id, nombre, apellidos)")
      .order("created_at", { ascending: false }),
    supabase.from("bono_tipos").select("id, nombre, sesiones, precio, treatment_id").eq("activo", true).order("nombre"),
    supabase.from("patients").select("id, nombre, apellidos").is("deleted_at", null).order("apellidos").limit(500),
    supabase.from("treatments").select("id, nombre").eq("activo", true).order("nombre"),
  ]);

  const pacientes = (pacientesRes.data ?? []).map((p) => ({ value: p.id, label: `${p.nombre} ${p.apellidos}` }));
  const tratamientos = (tratamientosRes.data ?? []).map((t) => ({ value: t.id, label: t.nombre }));

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Bonos" />
      <div className="flex-1 p-4 md:p-6">
        <BonosView
          rows={(bonosRes.data ?? []) as never}
          plantillas={plantillasRes.data ?? []}
          pacientes={pacientes}
          tratamientos={tratamientos}
        />
      </div>
    </div>
  );
}
