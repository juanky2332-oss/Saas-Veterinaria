import { createClient } from "@/lib/supabase/server";
import { normalizarAgente, type WhatsappIntegrationConfig } from "@/lib/whatsapp/agente";
import { WhatsappConfigClient } from "./whatsapp-config-client";

export const metadata = { title: "WhatsApp — Clinicomatic" };

export default async function WhatsappConfigPage() {
  const supabase = await createClient();
  const { data: integ } = await supabase
    .from("org_integrations")
    .select("external_id, activo, config")
    .eq("tipo", "whatsapp")
    .maybeSingle();

  const cfg = (integ?.config ?? {}) as WhatsappIntegrationConfig;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <WhatsappConfigClient
      inicial={{
        conectado: Boolean(integ?.external_id),
        activo: integ?.activo ?? true,
        phone_number_id: integ?.external_id ?? "",
        waba_id: cfg.waba_id ?? "",
        display_phone: cfg.display_phone ?? "",
        tieneToken: Boolean(cfg.token),
        tieneSecret: Boolean(cfg.app_secret),
        agente: normalizarAgente(cfg.agente),
      }}
      webhookUrl={`${appUrl}/api/webhooks/whatsapp`}
      verifyToken={process.env.WHATSAPP_VERIFY_TOKEN ?? "clinicflow_webhook_verify"}
    />
  );
}
