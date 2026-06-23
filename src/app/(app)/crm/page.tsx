import { createClient } from "@/lib/supabase/server";
import { getOrgIdOrNull } from "@/lib/auth/org";
import { Header } from "@/components/layout/header";
import { CrmKanban, type Stage, type Opportunity } from "@/components/modules/crm/crm-kanban";

export const metadata = { title: "CRM — VetClinic" };

export default async function CrmPage() {
  const supabase = await createClient();

  let { data: pipeline } = await supabase.from("crm_pipelines").select("id, nombre").limit(1).maybeSingle();
  if (!pipeline) {
    const orgId = await getOrgIdOrNull();
    if (orgId) {
      await supabase.rpc("seed_default_pipeline", { p_org: orgId });
      const retry = await supabase.from("crm_pipelines").select("id, nombre").limit(1).maybeSingle();
      pipeline = retry.data;
    }
  }

  const [stagesRes, oppsRes] = await Promise.all([
    supabase.from("crm_stages").select("id, nombre, orden, color").order("orden"),
    supabase
      .from("crm_opportunities")
      .select("id, stage_id, nombre_contacto, telefono, email, valor, origen, notas, color, patient_id")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="flex min-h-full flex-col">
      <Header title="CRM" />
      <div className="flex-1 overflow-hidden">
        <CrmKanban
          stages={(stagesRes.data ?? []) as Stage[]}
          opportunities={(oppsRes.data ?? []) as Opportunity[]}
          pipelineNombre={pipeline?.nombre ?? "Pipeline de ventas"}
        />
      </div>
    </div>
  );
}
