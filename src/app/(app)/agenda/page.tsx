import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { AgendaView } from "@/components/modules/agenda/agenda-view";
import { getCurrentOrg } from "@/lib/auth/org";
import { DEFAULT_TZ } from "@/lib/tz";

export const metadata = { title: "Agenda — Veteriblandenguer" };

export default async function AgendaPage() {
  const supabase = await createClient();

  const hoy = new Date();
  const inicio = new Date(hoy);
  inicio.setDate(hoy.getDate() - hoy.getDay() + 1); // lunes de esta semana
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 7);
  // Ventana de fetch ampliada Â±1 día para no perder citas en los bordes según la zona horaria.
  const desde = new Date(inicio); desde.setDate(desde.getDate() - 1);
  const hasta = new Date(fin); hasta.setDate(hasta.getDate() + 1);

  const [citasRes, doctoresRes, tratamientosRes, pacientesRes, org] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, patients(nombre, apellidos, telefono), treatments(nombre, categoria, duracion_min), profiles!doctora_id(nombre)")
      .gte("inicio", desde.toISOString())
      .lte("inicio", hasta.toISOString())
      .order("inicio"),
    supabase.from("profiles").select("id, nombre").eq("activo", true),
    supabase.from("treatments").select("id, nombre, categoria, duracion_min").eq("activo", true).order("nombre"),
    supabase.from("patients").select("id, nombre, apellidos, telefono").is("deleted_at", null).order("apellidos").limit(1000),
    getCurrentOrg(),
  ]);

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Agenda" />
      <div className="flex-1 overflow-hidden">
        <AgendaView
          citas={(citasRes.data ?? []) as never}
          doctores={doctoresRes.data ?? []}
          tratamientos={tratamientosRes.data ?? []}
          pacientes={pacientesRes.data ?? []}
          semanaInicio={inicio.toISOString()}
          timeZone={org?.timezone ?? DEFAULT_TZ}
        />
      </div>
    </div>
  );
}
