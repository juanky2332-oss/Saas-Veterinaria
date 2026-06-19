import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/org";
import { geminiAdapter } from "@/lib/adapters/gemini";
import { z } from "zod";

const schema = z.object({ pregunta: z.string().min(1).max(1000) });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Pregunta inválida" }, { status: 400 });

  const org = await getCurrentOrg();

  // Contexto en vivo (la RLS lo limita automáticamente a la organización del usuario)
  const now = new Date();
  const ini = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
  const fin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

  const [citas, pacientes, recs, stock] = await Promise.all([
    supabase.from("appointments").select("id", { count: "exact", head: true }).gte("inicio", ini).lte("inicio", fin),
    supabase.from("patients").select("id", { count: "exact", head: true }),
    supabase.from("v_recomendaciones_pendientes").select("treatment_nombre").limit(5),
    supabase.from("v_stock_bajo").select("nombre, unidades").limit(5),
  ]);

  const recList = (recs.data ?? []).map((r) => r.treatment_nombre).filter(Boolean).join(", ");
  const stockList = (stock.data ?? []).map((s) => `${s.nombre} (${s.unidades})`).join(", ");

  const contexto = [
    `Clínica: ${org?.nombre ?? "?"} · tipo: ${org?.vertical ?? "general"} · plan: ${org?.plan ?? "trial"}.`,
    `Citas hoy: ${citas.count ?? 0}.`,
    `Pacientes totales: ${pacientes.count ?? 0}.`,
    `Recomendaciones de tratamiento pendientes: ${recs.data?.length ?? 0}${recList ? ` (${recList})` : ""}.`,
    `Productos con stock bajo: ${stock.data?.length ?? 0}${stockList ? ` (${stockList})` : ""}.`,
  ].join(" ");

  try {
    const respuesta = await geminiAdapter.asistirEquipo(parsed.data.pregunta, contexto);
    return NextResponse.json({ respuesta });
  } catch {
    return NextResponse.json({ error: "El asistente no está disponible ahora mismo." }, { status: 500 });
  }
}
