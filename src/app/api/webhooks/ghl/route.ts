import { type NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { resolveOrgByIntegration } from "@/lib/api/integrations";

interface GhlOpportunityPayload {
  id: string;
  name: string;
  pipelineStageId: string;
  contactName?: string;
  phone?: string;
  email?: string;
  monetaryValue?: number;
  source?: string;
}
interface GhlWebhookBody {
  type?: string;
  locationId?: string;
  opportunity?: GhlOpportunityPayload;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-ghl-secret");
  if (secret !== process.env.GHL_WEBHOOK_SECRET && process.env.GHL_MODE !== "mock") {
    return NextResponse.json({ error: "Forbidden" }, { status: 401 });
  }

  const body = (await req.json()) as GhlWebhookBody;

  // Enrutar a la organización por el locationId de GoHighLevel
  const orgId = await resolveOrgByIntegration("ghl", body.locationId);
  if (!orgId) return NextResponse.json({ ok: true }); // sin clínica configurada → ignorar

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getServiceClient() as any;

  if (body.type === "opportunity.updated" || body.type === "opportunity.created") {
    const opp = body.opportunity;
    if (!opp) return NextResponse.json({ ok: true });

    const { data: stage } = await supabase
      .from("crm_stages")
      .select("id")
      .eq("organization_id", orgId)
      .eq("ghl_stage_id", opp.pipelineStageId)
      .maybeSingle();

    if (stage) {
      await supabase.from("crm_opportunities").upsert(
        {
          organization_id: orgId,
          ghl_opportunity_id: opp.id,
          stage_id: stage.id,
          nombre_contacto: opp.contactName ?? opp.name,
          telefono: opp.phone ?? null,
          email: opp.email ?? null,
          valor: opp.monetaryValue ?? null,
          origen: opp.source ?? null,
          sync_estado: "ok",
          ultima_sync_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,ghl_opportunity_id" },
      );
    }
  }

  return NextResponse.json({ ok: true });
}
