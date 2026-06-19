// Verificación end-to-end del flujo multi-tenant contra la BBDD live.
// Uso: node scripts/verify-flow.mjs   (lee .env.local)
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// --- cargar .env.local ---
const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !ANON || !SERVICE) { console.error("Faltan vars de Supabase"); process.exit(1); }

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const stamp = Date.now();
const email = `demo+${stamp}@clinicflow.test`;
const password = "clinicflow-demo-123";
let userId, orgId;

function ok(label, cond, extra = "") { console.log(`${cond ? "✅" : "❌"} ${label}${extra ? " — " + extra : ""}`); if (!cond) process.exitCode = 1; }

try {
  // 1. Crear usuario confirmado (service role)
  const { data: created, error: e1 } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  ok("admin.createUser", !e1 && !!created?.user, e1?.message);
  userId = created.user.id;

  // 2. Login como el usuario (cliente anon)
  const user = createClient(URL_, ANON, { auth: { persistSession: false } });
  const { error: e2 } = await user.auth.signInWithPassword({ email, password });
  ok("signInWithPassword", !e2, e2?.message);

  // 3. RPC: alta de organización + perfil owner
  const { data: rpcOrg, error: e3 } = await user.rpc("create_organization_with_owner", {
    p_org_name: "Clínica Demo", p_slug: `clinica-demo-${stamp}`, p_vertical: "dental", p_user_name: "Dra. Demo",
  });
  ok("rpc create_organization_with_owner", !e3 && !!rpcOrg, e3?.message);
  orgId = rpcOrg;

  // 4. RLS: el usuario ve SU organización y su perfil owner
  const { data: org } = await user.from("organizations").select("id,nombre,vertical,plan,subscription_status").eq("id", orgId).maybeSingle();
  ok("lee su organización (RLS)", org?.id === orgId, `${org?.nombre} · ${org?.vertical} · ${org?.plan}/${org?.subscription_status}`);
  const { data: prof } = await user.from("profiles").select("rol,organization_id").eq("id", userId).maybeSingle();
  ok("perfil owner creado", prof?.rol === "owner" && prof?.organization_id === orgId, prof?.rol);

  // 5. Trigger auto-org-id: insertar paciente SIN organization_id → se autoasigna
  const tel = `+34600${String(stamp).slice(-6)}`;
  const { data: pat, error: e5 } = await user.from("patients").insert({ nombre: "Ana", apellidos: "Prueba", telefono: tel }).select("id,organization_id").single();
  ok("insert paciente (trigger auto-org)", !e5 && pat?.organization_id === orgId, e5?.message ?? `org=${pat?.organization_id?.slice(0,8)}`);

  // 6. Aislamiento: otra organización NO ve este paciente
  const email2 = `demo2+${stamp}@clinicflow.test`;
  const { data: c2 } = await admin.auth.admin.createUser({ email: email2, password, email_confirm: true });
  const user2 = createClient(URL_, ANON, { auth: { persistSession: false } });
  await user2.auth.signInWithPassword({ email: email2, password });
  await user2.rpc("create_organization_with_owner", { p_org_name: "Otra Clínica", p_slug: `otra-${stamp}`, p_vertical: "estetica", p_user_name: "Otro" });
  const { data: leak } = await user2.from("patients").select("id").eq("telefono", tel);
  ok("aislamiento RLS (otra org no ve el paciente)", Array.isArray(leak) && leak.length === 0, `filas visibles: ${leak?.length}`);

  // cleanup
  const { data: prof2 } = await user2.from("profiles").select("organization_id").eq("id", c2.user.id).maybeSingle();
  if (prof2?.organization_id) await admin.from("organizations").delete().eq("id", prof2.organization_id);
  await admin.from("organizations").delete().eq("id", orgId);
  await admin.auth.admin.deleteUser(userId);
  await admin.auth.admin.deleteUser(c2.user.id);
  console.log("🧹 cleanup hecho");
} catch (err) {
  console.error("EXCEPTION", err);
  process.exitCode = 1;
}
