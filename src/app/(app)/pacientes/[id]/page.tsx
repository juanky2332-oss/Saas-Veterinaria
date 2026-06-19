import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { FichaPaciente } from "@/components/modules/pacientes/ficha-paciente";
import { getFeatures } from "@/lib/auth/org";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("patients")
    .select("nombre, apellidos")
    .eq("id", id)
    .single() as { data: { nombre: string; apellidos: string } | null; error: unknown };
  if (!data) return { title: "Paciente — Clinicomatic" };
  return { title: `${data.nombre} ${data.apellidos} — Clinicomatic` };
}

export default async function FichaPacientePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab = "resumen" } = await searchParams;
  const supabase = await createClient();

  const pacienteResult = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single() as { data: import("@/lib/database.types").Database["public"]["Tables"]["patients"]["Row"] | null; error: unknown };

  if (!pacienteResult.data) notFound();
  const paciente = pacienteResult.data;

  const [citasRes, tratamientosRes, consentimientosRes, fotosRes, conversacionRes, informesRes, metricasRes, recetasRes, bonosRes, bonoPlantillasRes, catTratamientosRes, features] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("*, treatments(nombre, categoria), profiles!doctora_id(nombre)")
        .eq("patient_id", id)
        .order("inicio", { ascending: false })
        .limit(50),
      supabase
        .from("patient_treatments")
        .select("*, treatments(nombre, categoria, duracion_min)")
        .eq("patient_id", id),
      supabase
        .from("consents")
        .select("*, consent_templates(titulo)")
        .eq("patient_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("patient_photos")
        .select("*")
        .eq("patient_id", id)
        .order("tomada_at", { ascending: false }),
      supabase
        .from("wa_conversations")
        .select("*, wa_messages(*)")
        .eq("patient_id", id)
        .single(),
      supabase
        .from("clinical_reports")
        .select("id, contenido, created_at, transcripcion_origen, appointment_id, profiles!doctora_id(nombre), appointments(inicio, treatments(nombre))")
        .eq("patient_id", id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("patient_metrics")
        .select("*")
        .eq("patient_id", id)
        .order("fecha", { ascending: false })
        .limit(200),
      supabase
        .from("recipes")
        .select("id, fecha, diagnostico, observaciones, recipe_items(id, medicamento, posologia, duracion, cantidad)")
        .eq("patient_id", id)
        .order("fecha", { ascending: false })
        .limit(100),
      supabase
        .from("bonos")
        .select("id, nombre, sesiones_total, sesiones_usadas, precio, estado")
        .eq("patient_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("bono_tipos").select("id, nombre, sesiones, precio, treatment_id").eq("activo", true).order("nombre"),
      supabase.from("treatments").select("id, nombre").eq("activo", true).order("nombre"),
      getFeatures(),
    ]);

  const tratamientosOpts = (catTratamientosRes.data ?? []).map((t) => ({ value: t.id, label: t.nombre }));

  return (
    <div className="flex flex-col min-h-full">
      <Header title={`${paciente.nombre} ${paciente.apellidos}`} />
      <div className="flex-1 p-4 md:p-6">
        <FichaPaciente
          paciente={paciente}
          citas={citasRes.data ?? []}
          tratamientos={tratamientosRes.data ?? []}
          consentimientos={consentimientosRes.data ?? []}
          fotos={fotosRes.data ?? []}
          conversacion={conversacionRes.data}
          informes={(informesRes.data ?? []) as unknown as import("@/components/modules/pacientes/tabs/tab-historial").InformeHistorial[]}
          metricas={metricasRes.data ?? []}
          recetas={recetasRes.data ?? []}
          bonos={bonosRes.data ?? []}
          bonoPlantillas={bonoPlantillasRes.data ?? []}
          tratamientosOpts={tratamientosOpts}
          features={features}
          tabInicial={tab}
        />
      </div>
    </div>
  );
}
