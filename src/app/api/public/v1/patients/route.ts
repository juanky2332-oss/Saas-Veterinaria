import { type NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { authenticateApiKey } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const ctx = await authenticateApiKey(req, "patients:read");
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const telefono = searchParams.get("telefono");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getServiceClient() as any;
  let query = supabase
    .from("patients")
    .select("id, nombre, apellidos, telefono, email, fecha_nacimiento, sexo")
    .eq("organization_id", ctx.organization_id) // scope multi-tenant obligatorio
    .is("deleted_at", null)
    .limit(limit);

  if (telefono) query = query.eq("telefono", telefono);

  const { data, error } = (await query) as { data: unknown[] | null; error: unknown };
  if (error) return NextResponse.json({ error: "Error interno" }, { status: 500 });

  return NextResponse.json({ data: data ?? [], count: data?.length ?? 0 });
}
