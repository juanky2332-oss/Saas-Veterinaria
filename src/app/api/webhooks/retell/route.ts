import { type NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";

/**
 * Webhook de Retell. Al finalizar y analizarse una llamada (evento
 * `call_analyzed`), guardamos la transcripción, el resumen, el sentimiento y la
 * grabación en voice_calls, resolviendo la clínica por el agent_id (o el número)
 * y el paciente por su teléfono.
 *
 * Multi-tenant: cada clínica tiene su agente Retell en org_integrations(tipo='voz').
 */

interface RetellCall {
  call_id?: string;
  agent_id?: string;
  direction?: string;
  from_number?: string;
  to_number?: string;
  transcript?: string;
  recording_url?: string;
  start_timestamp?: number;
  end_timestamp?: number;
  duration_ms?: number;
  call_analysis?: { call_summary?: string; user_sentiment?: string };
}
interface RetellEvent {
  event?: string;
  call?: RetellCall;
}

export async function POST(req: NextRequest) {
  let body: RetellEvent;
  try {
    body = (await req.json()) as RetellEvent;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Solo nos interesa la llamada ya analizada (con transcripción + resumen).
  if (body.event && body.event !== "call_analyzed" && body.event !== "call_ended") {
    return NextResponse.json({ status: "ignored" });
  }
  const call = body.call;
  if (!call) return NextResponse.json({ status: "ignored" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getServiceClient() as any;

  // Resolver la clínica por agent_id; si no, por el número (to/from contra external_id).
  let integ: { organization_id: string } | null = null;
  if (call.agent_id) {
    const { data } = await supabase
      .from("org_integrations")
      .select("organization_id")
      .eq("tipo", "voz")
      .eq("config->>retell_agent_id", call.agent_id)
      .maybeSingle();
    integ = data ?? null;
  }
  if (!integ) {
    const numero = call.to_number || call.from_number;
    if (numero) {
      const { data } = await supabase
        .from("org_integrations")
        .select("organization_id")
        .eq("tipo", "voz")
        .eq("external_id", numero)
        .maybeSingle();
      integ = data ?? null;
    }
  }
  if (!integ) return NextResponse.json({ status: "ignored" }); // ninguna clínica reclama esta llamada

  const orgId = integ.organization_id;
  const esEntrante = (call.direction ?? "inbound") === "inbound";
  const telefonoPaciente = esEntrante ? call.from_number : call.to_number;

  // Resolver paciente por teléfono dentro de la organización.
  let patientId: string | null = null;
  if (telefonoPaciente) {
    const soloDigitos = telefonoPaciente.replace(/\D/g, "");
    const { data: paciente } = await supabase
      .from("patients")
      .select("id")
      .eq("organization_id", orgId)
      .or(`telefono.eq.${telefonoPaciente},telefono.ilike.%${soloDigitos.slice(-9)}`)
      .is("deleted_at", null)
      .maybeSingle();
    patientId = paciente?.id ?? null;
  }

  const duracionSeg = call.duration_ms
    ? Math.round(call.duration_ms / 1000)
    : call.start_timestamp && call.end_timestamp
      ? Math.round((call.end_timestamp - call.start_timestamp) / 1000)
      : null;

  // Idempotencia: si ya existe la llamada (mismo retell_call_id), actualizar.
  const { data: existente } = call.call_id
    ? await supabase.from("voice_calls").select("id").eq("retell_call_id", call.call_id).maybeSingle()
    : { data: null };

  const fila = {
    organization_id: orgId,
    retell_call_id: call.call_id ?? null,
    direccion: esEntrante ? "inbound" : "outbound",
    from_number: call.from_number ?? null,
    to_number: call.to_number ?? null,
    patient_id: patientId,
    duracion_seg: duracionSeg,
    estado: "finalizada",
    resumen: call.call_analysis?.call_summary ?? null,
    transcripcion: call.transcript ?? null,
    grabacion_url: call.recording_url ?? null,
    sentimiento: call.call_analysis?.user_sentiment ?? null,
    ended_at: call.end_timestamp ? new Date(call.end_timestamp).toISOString() : new Date().toISOString(),
  };

  if (existente?.id) {
    await supabase.from("voice_calls").update(fila).eq("id", existente.id);
  } else {
    await supabase.from("voice_calls").insert(fila);
  }

  return NextResponse.json({ status: "ok" });
}
