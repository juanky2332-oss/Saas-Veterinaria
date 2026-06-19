import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { DashboardVet } from "@/components/modules/dashboard/dashboard-vet";
import { getCurrentOrg } from "@/lib/auth/org";
import { addDays } from "date-fns";

export const metadata = { title: "Dashboard — Veteriblandenguer" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const org = await getCurrentOrg();
  const en30 = addDays(new Date(), 30).toISOString().slice(0, 10);
  const hoyInicio = new Date(); hoyInicio.setHours(0, 0, 0, 0);
  const hoyFin = new Date(); hoyFin.setHours(23, 59, 59, 999);

  const [
    { count: totalMascotas },
    { count: totalClientes },
    { data: citasHoy },
    { data: vacunasProximas },
  ] = await Promise.all([
    supabase.from("mascotas").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("clientes").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase
      .from("appointments")
      .select("id, inicio, motivo, mascotas(nombre, especie)")
      .gte("inicio", hoyInicio.toISOString())
      .lte("inicio", hoyFin.toISOString())
      .order("inicio"),
    supabase
      .from("vacunaciones_vet")
      .select("id, vacuna, fecha_proxima, mascotas(id, nombre)")
      .lte("fecha_proxima", en30)
      .order("fecha_proxima"),
  ]);

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Dashboard" />
      <div className="flex-1 p-4 md:p-6">
        <DashboardVet
          totalMascotas={totalMascotas ?? 0}
          totalClientes={totalClientes ?? 0}
          citasHoy={(citasHoy ?? []).map((c) => ({ ...c, fecha_hora: c.inicio, mascotas: Array.isArray(c.mascotas) ? c.mascotas[0] : c.mascotas }))}
          vacunasProximas={(vacunasProximas ?? []).map((v) => ({ ...v, mascotas: Array.isArray(v.mascotas) ? v.mascotas[0] : v.mascotas }))}
          clinicName={org?.nombre ?? "Veteriblandenguer"}
        />
      </div>
    </div>
  );
}
