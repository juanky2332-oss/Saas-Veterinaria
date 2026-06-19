"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentUserHasRole, getCurrentOrg } from "@/lib/auth/org";
import { retellAdapter, retellModo } from "@/lib/adapters/retell";
import { buildVozPrompt, type VozAgenteConfig, type VozIntegrationConfig } from "@/lib/voz/agente";
import type { Json } from "@/lib/database.types";

/** Guarda la configuración del agente de voz y sincroniza el agente en Retell. */
export async function guardarVoz(input: {
  retell_api_key: string;
  twilio_number: string;
  activo: boolean;
  agente: VozAgenteConfig;
}): Promise<{ error?: string; agentId?: string; modo?: string }> {
  if (!(await currentUserHasRole(["owner", "admin"]))) {
    return { error: "Solo el propietario o un administrador pueden configurar el agente de voz." };
  }
  const supabase = await createClient();
  const org = await getCurrentOrg();

  const { data: existente } = await supabase
    .from("org_integrations")
    .select("config")
    .eq("tipo", "voz")
    .maybeSingle();
  const prev = (existente?.config ?? {}) as VozIntegrationConfig;

  // Clave de Retell: la que envía la clínica → la ya guardada → la global de
  // plataforma (RETELL_API_KEY en el entorno). Así una sola clave en Vercel sirve
  // de fallback para todas las clínicas que no usen la suya propia.
  const apiKey = input.retell_api_key || prev.retell_api_key || process.env.RETELL_API_KEY || "";

  // Sincroniza el agente en Retell (semi-automático). En mock devuelve un id ficticio.
  const prompt = buildVozPrompt(org?.nombre ?? "la clínica", input.agente);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const sync = await retellAdapter.sincronizarAgente({
    apiKey,
    nombreClinica: org?.nombre ?? "la clínica",
    prompt,
    vozId: input.agente.voz_id,
    agentId: prev.retell_agent_id,
    webhookUrl: appUrl ? `${appUrl}/api/webhooks/retell` : undefined,
  });
  if (sync.error) return { error: `Retell: ${sync.error}` };

  const config: VozIntegrationConfig = {
    retell_api_key: apiKey,
    retell_agent_id: sync.agentId || prev.retell_agent_id,
    twilio_number: input.twilio_number || prev.twilio_number,
    agente: input.agente,
  };

  const { error } = await supabase.from("org_integrations").upsert(
    {
      tipo: "voz",
      external_id: (input.twilio_number || prev.twilio_number || "").trim() || null,
      activo: input.activo,
      config: config as unknown as Json,
    },
    { onConflict: "organization_id,tipo" },
  );
  if (error) return { error: "No se pudo guardar la configuración del agente de voz." };

  revalidatePath("/configuracion/voz");
  revalidatePath("/voz");
  return { agentId: sync.agentId, modo: retellModo() };
}
