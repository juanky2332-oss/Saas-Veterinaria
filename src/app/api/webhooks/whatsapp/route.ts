import { type NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import {
  whatsappAdapter,
  sendWhatsAppTextAs,
  validateSignatureWith,
  isWhatsAppLive,
} from "@/lib/adapters/whatsapp";
import { geminiAdapter } from "@/lib/adapters/gemini";
import { buildAgenteContexto, type WhatsappIntegrationConfig } from "@/lib/whatsapp/agente";

interface WaChange {
  value?: {
    metadata?: { phone_number_id?: string };
    messages?: { from: string; id: string; type: string; text?: { body: string } }[];
  };
}
interface WaWebhookPayload {
  entry?: { changes?: WaChange[] }[];
}

// GET: verificación del webhook Meta (verify token global de la plataforma)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && whatsappAdapter.verifyWebhook(token ?? "")) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verificación fallida" }, { status: 403 });
}

// POST: mensajes entrantes — multi-tenant por phone_number_id
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") ?? "";

  let body: WaWebhookPayload;
  try {
    body = JSON.parse(rawBody) as WaWebhookPayload;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getServiceClient() as any;

  // Resolver la clínica por el phone_number_id del payload
  const phoneNumberId = body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
  if (!phoneNumberId) return NextResponse.json({ status: "ignored" });

  const { data: integ } = await supabase
    .from("org_integrations")
    .select("organization_id, external_id, config, activo")
    .eq("tipo", "whatsapp")
    .eq("external_id", phoneNumberId)
    .eq("activo", true)
    .maybeSingle();

  if (!integ) return NextResponse.json({ status: "ignored" }); // número sin clínica configurada

  const orgId: string = integ.organization_id;
  const cfg = (integ.config ?? {}) as WhatsappIntegrationConfig;

  // Firma: en live se valida con el app secret de la clínica (o el global como fallback)
  if (isWhatsAppLive()) {
    const valido = cfg.app_secret
      ? validateSignatureWith(cfg.app_secret, rawBody, signature)
      : whatsappAdapter.validateSignature(rawBody, signature);
    if (!valido) return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const { data: org } = await supabase.from("organizations").select("nombre").eq("id", orgId).maybeSingle();
  const nombreClinica = (org?.nombre as string) ?? "la clínica";
  const agenteOrgActivo = cfg.agente?.activo !== false;
  const contextoAgente = buildAgenteContexto(nombreClinica, cfg.agente);
  const creds = { token: cfg.token, phoneNumberId: integ.external_id as string };

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const msg of change.value?.messages ?? []) {
        const telefono = msg.from;
        const texto = msg.text?.body ?? "";
        const soloDigitos = telefono.replace(/\D/g, "");

        // Paciente (scoped a la organización)
        const { data: paciente } = await supabase
          .from("patients")
          .select("id")
          .eq("organization_id", orgId)
          .or(`telefono.eq.${telefono},telefono.eq.+${soloDigitos},telefono.ilike.%${soloDigitos.slice(-9)}`)
          .is("deleted_at", null)
          .maybeSingle();
        const patientId: string | null = paciente?.id ?? null;

        // Conversación (scoped a la organización)
        const { data: existingConv } = await supabase
          .from("wa_conversations")
          .select("id, estado_agente, no_leidos, patient_id")
          .eq("organization_id", orgId)
          .eq("telefono", telefono)
          .maybeSingle();

        let convId: string;
        let estadoAgente: string;

        if (existingConv) {
          convId = existingConv.id as string;
          estadoAgente = existingConv.estado_agente as string;
          const update: Record<string, unknown> = {
            ultima_entrada_at: new Date().toISOString(),
            no_leidos: ((existingConv.no_leidos as number) ?? 0) + 1,
          };
          if (!existingConv.patient_id && patientId) update.patient_id = patientId;
          await supabase.from("wa_conversations").update(update).eq("id", convId);
        } else {
          const { data: newConv } = await supabase
            .from("wa_conversations")
            .insert({
              organization_id: orgId,
              telefono,
              patient_id: patientId,
              ultima_entrada_at: new Date().toISOString(),
              no_leidos: 1,
            })
            .select("id, estado_agente")
            .single();
          if (!newConv) continue;
          convId = (newConv as { id: string }).id;
          estadoAgente = (newConv as { estado_agente: string }).estado_agente;
        }

        await supabase.from("wa_messages").insert({
          organization_id: orgId,
          conversation_id: convId,
          direccion: "in",
          tipo: "texto",
          cuerpo: texto,
          wa_message_id: msg.id,
          enviado_por: "humano",
        });

        // Agente IA (interruptor de la clínica + estado de la conversación)
        if (agenteOrgActivo && estadoAgente === "activo" && texto) {
          const necesitaHumano = ["hablar con persona", "atencion humana", "atención humana", "persona real"].some((k) =>
            texto.toLowerCase().includes(k),
          );
          if (necesitaHumano) {
            await supabase.from("wa_conversations").update({ estado_agente: "humano" }).eq("id", convId);
            continue;
          }
          const respuesta = await geminiAdapter.responderWhatsapp(texto, contextoAgente);
          await sendWhatsAppTextAs(creds, telefono, respuesta);
          await supabase.from("wa_messages").insert({
            organization_id: orgId,
            conversation_id: convId,
            direccion: "out",
            tipo: "texto",
            cuerpo: respuesta,
            enviado_por: "agente_ia",
            estado_envio: "enviado",
          });
        }
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
