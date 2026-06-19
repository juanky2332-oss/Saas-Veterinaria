import { type NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { authenticateApiKey } from "@/lib/api/auth";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

const createSchema = z.object({
  patient_id: z.string().uuid().optional(),
  telefono: z.string().optional(),
  treatment_id: z.string().uuid().optional(),
  doctora_id: z.string().uuid(),
  sala: z.number().int().min(1).max(3).default(1),
  inicio: z.string().datetime(),
  fin: z.string().datetime(),
  notas: z.string().max(1000).optional(),
});

export async function GET(req: NextRequest) {
  const ctx = await authenticateApiKey(req, "appointments:read");
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const fecha = searchParams.get("fecha");
  const supabase: AnySupabase = getServiceClient();

  let query = supabase
    .from("appointments")
    .select("id, inicio, fin, sala, estado, treatment_id, doctora_id")
    .eq("organization_id", ctx.organization_id)
    .order("inicio");

  if (fecha) query = query.gte("inicio", `${fecha}T00:00:00`).lte("inicio", `${fecha}T23:59:59`);

  const { data } = (await query.limit(200)) as { data: unknown[] | null };
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await authenticateApiKey(req, "appointments:write");
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as unknown;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase: AnySupabase = getServiceClient();
  const d = parsed.data;

  let patientId = d.patient_id;
  if (!patientId && d.telefono) {
    const pResult = (await supabase
      .from("patients")
      .select("id")
      .eq("organization_id", ctx.organization_id)
      .eq("telefono", d.telefono)
      .maybeSingle()) as { data: { id: string } | null };
    patientId = pResult.data?.id;
  }

  if (!patientId) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 422 });

  const insertResult = (await supabase
    .from("appointments")
    .insert({
      organization_id: ctx.organization_id, // service_role: org explícita obligatoria
      patient_id: patientId,
      treatment_id: d.treatment_id ?? null,
      doctora_id: d.doctora_id,
      sala: d.sala,
      inicio: d.inicio,
      fin: d.fin,
      notas: d.notas ?? null,
      origen: "widget",
      estado: "pendiente",
    })
    .select("id, inicio, estado")
    .single()) as { data: { id: string; inicio: string; estado: string } | null; error: unknown };

  if (insertResult.error) return NextResponse.json({ error: "Error al crear cita" }, { status: 500 });
  return NextResponse.json({ data: insertResult.data }, { status: 201 });
}
