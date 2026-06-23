import { createClient } from "@/lib/supabase/server";
import { VozConfigClient } from "./voz-config-client";
import { retellModo } from "@/lib/adapters/retell";
import type { VozIntegrationConfig } from "@/lib/voz/agente";

export const metadata = { title: "Agente de voz — VetClinic" };

export default async function VozConfigPage() {
  const supabase = await createClient();
  const { data: integ } = await supabase
    .from("org_integrations")
    .select("config, external_id, activo")
    .eq("tipo", "voz")
    .maybeSingle();

  const cfg = (integ?.config ?? {}) as VozIntegrationConfig;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--text)]">Agente de voz</h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          Recepcionista virtual telefónica con IA (Retell + Twilio). Atiende llamadas, informa y agenda, y te deja la transcripción.
        </p>
      </div>
      <VozConfigClient
        initial={cfg.agente ?? {}}
        retellApiKeySet={Boolean(cfg.retell_api_key)}
        twilioNumber={cfg.twilio_number ?? integ?.external_id ?? ""}
        activo={integ?.activo ?? false}
        agentId={cfg.retell_agent_id ?? null}
        modo={retellModo()}
      />
    </div>
  );
}
