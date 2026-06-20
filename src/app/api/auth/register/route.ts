import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  // Crea el usuario con email ya confirmado (bypassa el flujo de email)
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    const msg = error.message?.includes("already registered")
      ? "Ese correo ya tiene cuenta."
      : error.message ?? "No se pudo crear la cuenta.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ userId: data.user?.id });
}
