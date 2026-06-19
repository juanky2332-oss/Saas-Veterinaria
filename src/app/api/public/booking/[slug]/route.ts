import { type NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

async function resolveOrg(slug: string) {
  const supabase: AnySupabase = getServiceClient();
  const { data } = await supabase
    .from("organizations")
    .select("id, nombre, owner_id, vertical, brand_color")
    .eq("slug", slug)
    .maybeSingle();
  return data as { id: string; nombre: string; owner_id: string | null; vertical: string; brand_color: string | null } | null;
}

// GET → tratamientos activos de la clínica (para el formulario del widget)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await resolveOrg(slug);
  if (!org) return NextResponse.json({ error: "Clínica no encontrada" }, { status: 404, headers: CORS });

  const supabase: AnySupabase = getServiceClient();
  const { data: tratamientos } = await supabase
    .from("treatments")
    .select("id, nombre, duracion_min, precio_orientativo")
    .eq("organization_id", org.id)
    .eq("activo", true)
    .order("nombre");

  return NextResponse.json({ clinica: org.nombre, vertical: org.vertical, tratamientos: tratamientos ?? [] }, { headers: CORS });
}

const reservaSchema = z.object({
  nombre: z.string().min(1).max(120),
  telefono: z.string().min(6).max(30),
  email: z.string().email().optional().or(z.literal("")),
  treatment_id: z.string().uuid().optional(),
  inicio: z.string().datetime(),
  notas: z.string().max(500).optional(),
});

// POST → crea una cita "pendiente" desde el widget (lead entrante)
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await resolveOrg(slug);
  if (!org) return NextResponse.json({ error: "Clínica no encontrada" }, { status: 404, headers: CORS });
  if (!org.owner_id) return NextResponse.json({ error: "Clínica no disponible para reservas" }, { status: 409, headers: CORS });

  const parsed = reservaSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400, headers: CORS });
  const d = parsed.data;

  const supabase: AnySupabase = getServiceClient();

  // Buscar/crear paciente por teléfono dentro de la organización
  const partes = d.nombre.trim().split(" ");
  const nombre = partes[0];
  const apellidos = partes.slice(1).join(" ") || "—";

  let patientId: string | undefined;
  const { data: existing } = await supabase
    .from("patients")
    .select("id")
    .eq("organization_id", org.id)
    .eq("telefono", d.telefono)
    .is("deleted_at", null)
    .maybeSingle();
  patientId = existing?.id;

  if (!patientId) {
    const { data: nuevo, error } = await supabase
      .from("patients")
      .insert({ organization_id: org.id, nombre, apellidos, telefono: d.telefono, email: d.email || null, origen: "widget" })
      .select("id")
      .single();
    if (error || !nuevo) return NextResponse.json({ error: "No se pudo registrar" }, { status: 500, headers: CORS });
    patientId = nuevo.id;
  }

  // Duración según tratamiento (o 30 min)
  let dur = 30;
  if (d.treatment_id) {
    const { data: t } = await supabase.from("treatments").select("duracion_min").eq("id", d.treatment_id).maybeSingle();
    if (t?.duracion_min) dur = t.duracion_min;
  }
  const inicio = new Date(d.inicio);
  const fin = new Date(inicio.getTime() + dur * 60000);

  const { error: aptErr } = await supabase.from("appointments").insert({
    organization_id: org.id,
    patient_id: patientId,
    treatment_id: d.treatment_id ?? null,
    doctora_id: org.owner_id,
    sala: 1,
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    estado: "pendiente",
    origen: "widget",
    notas: d.notas ?? null,
  });
  if (aptErr) return NextResponse.json({ error: "No se pudo crear la reserva" }, { status: 500, headers: CORS });

  return NextResponse.json({ ok: true, mensaje: "Reserva recibida. La clínica la confirmará en breve." }, { status: 201, headers: CORS });
}
