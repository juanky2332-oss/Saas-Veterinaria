"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { currentUserHasRole } from "@/lib/auth/org";
import { sendWhatsAppTextAs } from "@/lib/adapters/whatsapp";
import type { WhatsappIntegrationConfig, AgenteConfig } from "@/lib/whatsapp/agente";
import type { Json } from "@/lib/database.types";

/** Guarda la conexión de WhatsApp de la clínica (credenciales + agente). */
export async function guardarIntegracionWhatsapp(input: {
  phone_number_id: string;
  token: string;
  app_secret: string;
  waba_id: string;
  display_phone: string;
  activo: boolean;
  agente: AgenteConfig;
}): Promise<{ error?: string }> {
  if (!(await currentUserHasRole(["owner", "admin"]))) {
    return { error: "Solo el propietario o un administrador pueden configurar WhatsApp." };
  }
  const supabase = await createClient();

  // Conservar secretos ya guardados si llegan vacíos (campos tipo password)
  const { data: existente } = await supabase
    .from("org_integrations")
    .select("config")
    .eq("tipo", "whatsapp")
    .maybeSingle();
  const prev = (existente?.config ?? {}) as WhatsappIntegrationConfig;

  const config: WhatsappIntegrationConfig = {
    token: input.token || prev.token,
    app_secret: input.app_secret || prev.app_secret,
    waba_id: input.waba_id || prev.waba_id,
    display_phone: input.display_phone || prev.display_phone,
    agente: input.agente,
  };

  const { error } = await supabase.from("org_integrations").upsert(
    {
      tipo: "whatsapp",
      external_id: input.phone_number_id.trim() || null,
      activo: input.activo,
      config: config as unknown as Json,
    },
    { onConflict: "organization_id,tipo" },
  );
  if (error) return { error: "No se pudo guardar la configuración." };

  revalidatePath("/configuracion/whatsapp");
  revalidatePath("/whatsapp");
  return {};
}

/** Activa / pausa el agente IA en una conversación concreta. */
export async function toggleAgenteConversacion(
  conversationId: string,
  estado: "activo" | "pausado",
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("wa_conversations")
    .update({ estado_agente: estado })
    .eq("id", conversationId);
  if (error) return { error: "No se pudo cambiar el estado del agente." };
  revalidatePath("/whatsapp");
  return {};
}

/** Envía un mensaje de WhatsApp desde la bandeja usando las credenciales de la clínica. */
export async function enviarMensajeWhatsapp(
  conversationId: string,
  cuerpo: string,
): Promise<{ error?: string }> {
  const texto = cuerpo.trim();
  if (!texto) return { error: "Mensaje vacío." };

  const supabase = await createClient();
  const { data: conv } = await supabase
    .from("wa_conversations")
    .select("telefono")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv) return { error: "Conversación no encontrada." };

  const { data: integ } = await supabase
    .from("org_integrations")
    .select("external_id, config, activo")
    .eq("tipo", "whatsapp")
    .maybeSingle();
  const cfg = (integ?.config ?? {}) as WhatsappIntegrationConfig;

  const resultado = await sendWhatsAppTextAs(
    { token: cfg.token, phoneNumberId: integ?.external_id },
    conv.telefono,
    texto,
  );

  const { error } = await supabase.from("wa_messages").insert({
    conversation_id: conversationId,
    direccion: "out",
    tipo: "texto",
    cuerpo: texto,
    enviado_por: "humano",
    estado_envio: resultado.success ? "enviado" : "error",
    wa_message_id: resultado.messageId ?? null,
  });
  if (error) return { error: "El mensaje no se pudo registrar." };
  if (!resultado.success) return { error: resultado.error ?? "No se pudo enviar por WhatsApp." };
  return {};
}
