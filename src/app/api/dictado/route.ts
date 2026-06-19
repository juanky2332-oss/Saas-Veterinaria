import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geminiAdapter } from "@/lib/adapters/gemini";
import { z } from "zod";

const schema = z.object({
  audioBase64: z.string().min(1),
  mimeType: z.string().default("audio/webm"),
});

/**
 * Dictado por voz: transcribe el audio y devuelve un BORRADOR de informe
 * estructurado. NO guarda nada: el profesional revisa/edita y guarda con
 * `registrarVisita`. El audio no se persiste (RGPD: se transcribe y se descarta).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const profileResult = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle() as { data: { rol: string } | null; error: unknown };

  if (!profileResult.data || !["owner", "admin", "profesional"].includes(profileResult.data.rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json() as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Audio no válido" }, { status: 400 });
  }

  try {
    const transcripcion = await geminiAdapter.transcribirAudio(parsed.data.audioBase64, parsed.data.mimeType);
    const informe = await geminiAdapter.estructurarInforme(transcripcion);
    return NextResponse.json({ transcripcion, informe });
  } catch (err) {
    console.error("[dictado] Error:", (err as Error).message);
    return NextResponse.json({ error: "Error en la transcripción." }, { status: 500 });
  }
}
