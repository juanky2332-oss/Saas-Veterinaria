import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { VozView } from "@/components/modules/voz/voz-view";

export const metadata = { title: "Agente de voz — Clinicomatic" };

export default async function VozPage() {
  const supabase = await createClient();
  const [llamadasRes, integRes] = await Promise.all([
    supabase
      .from("voice_calls")
      .select("id, direccion, from_number, to_number, duracion_seg, resumen, transcripcion, grabacion_url, sentimiento, created_at, patient:patients(id, nombre, apellidos)")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("org_integrations").select("activo").eq("tipo", "voz").maybeSingle(),
  ]);

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Agente de voz" />
      <div className="flex-1 p-4 md:p-6">
        <VozView llamadas={(llamadasRes.data ?? []) as never} configurado={Boolean(integRes.data)} />
      </div>
    </div>
  );
}
