// Crea (o reutiliza) una clínica DEMO con datos de muestra para ver la app viva.
// Uso: node scripts/seed-demo.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY, SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL = "demo@clinicflow.app";
const PASSWORD = "ClinicFlow2026!";

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });

// 1. Usuario demo (idempotente)
let userId;
{
  const { data: created, error } = await admin.auth.admin.createUser({ email: EMAIL, password: PASSWORD, email_confirm: true });
  if (created?.user) userId = created.user.id;
  else {
    // ya existe → buscarlo
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
    userId = list.users.find((u) => u.email === EMAIL)?.id;
    if (error && !userId) { console.error(error); process.exit(1); }
  }
}
console.log("usuario demo:", userId);

const user = createClient(URL_, ANON, { auth: { persistSession: false } });
await user.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });

// 2. Organización (si no tiene)
let orgId;
{
  const { data: prof } = await user.from("profiles").select("organization_id").eq("id", userId).maybeSingle();
  orgId = prof?.organization_id;
  if (!orgId) {
    const { data, error } = await user.rpc("create_organization_with_owner", {
      p_org_name: "Clínica Demo", p_slug: `clinica-demo-${Date.now()}`, p_vertical: "dental", p_user_name: "Dra. Demo",
    });
    if (error) { console.error("rpc", error); process.exit(1); }
    orgId = data;
  }
}
console.log("org:", orgId);

// 3. Seed de datos (solo si está vacío)
const { count } = await user.from("patients").select("id", { count: "exact", head: true });
if ((count ?? 0) > 0) { console.log("ya tiene datos, no reseedeo. count=", count); process.exit(0); }

const now = new Date();
const iso = (d) => d.toISOString();
const addDays = (n) => new Date(now.getTime() + n * 864e5);
const addH = (base, h) => new Date(base.getTime() + h * 36e5);

// Tratamientos (dental)
const { data: trs } = await user.from("treatments").insert([
  { nombre: "Limpieza dental", categoria: "otro", duracion_min: 45, precio_orientativo: 60, periodicidad_meses: 6 },
  { nombre: "Revisión + diagnóstico", categoria: "otro", duracion_min: 30, precio_orientativo: 40, periodicidad_meses: 12 },
  { nombre: "Blanqueamiento", categoria: "otro", duracion_min: 60, precio_orientativo: 290, periodicidad_meses: 18 },
  { nombre: "Ortodoncia (revisión)", categoria: "otro", duracion_min: 30, precio_orientativo: 50, periodicidad_meses: 2 },
]).select("id,nombre");
const tr = Object.fromEntries((trs ?? []).map((t) => [t.nombre, t.id]));

// Pacientes
const { data: pac } = await user.from("patients").insert([
  { nombre: "Laura", apellidos: "Giménez Ruiz", telefono: "+34 600 111 222", email: "laura@example.com", sexo: "femenino", alergias: "Penicilina" },
  { nombre: "Marcos", apellidos: "Pérez Soler", telefono: "+34 600 333 444", email: "marcos@example.com", sexo: "masculino" },
  { nombre: "Nuria", apellidos: "Díaz Campos", telefono: "+34 600 555 666", email: "nuria@example.com", sexo: "femenino" },
  { nombre: "Javier", apellidos: "Romero Lis", telefono: "+34 600 777 888", sexo: "masculino" },
]).select("id,nombre");

// Citas de hoy
if (pac && pac.length) {
  await user.from("appointments").insert([
    { patient_id: pac[0].id, treatment_id: tr["Limpieza dental"], doctora_id: userId, sala: 1, inicio: iso(addH(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0), 0)), fin: iso(addH(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 45), 0)), estado: "confirmada", origen: "manual" },
    { patient_id: pac[1].id, treatment_id: tr["Revisión + diagnóstico"], doctora_id: userId, sala: 2, inicio: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0)), fin: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30)), estado: "pendiente", origen: "widget" },
    { patient_id: pac[2].id, treatment_id: tr["Blanqueamiento"], doctora_id: userId, sala: 1, inicio: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 30)), fin: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 30)), estado: "confirmada", origen: "whatsapp" },
  ]);

  // Recomendación vencida: tratamiento recurrente con última sesión hace 8 meses (period 6) → vencido
  await user.from("patient_treatments").insert({
    patient_id: pac[0].id, treatment_id: tr["Limpieza dental"], periodicidad_meses: 6, ultima_sesion_at: iso(addDays(-240)), estado: "activo",
  });
  await user.from("patient_treatments").insert({
    patient_id: pac[2].id, treatment_id: tr["Ortodoncia (revisión)"], periodicidad_meses: 2, ultima_sesion_at: iso(addDays(-120)), estado: "activo",
  });
}

// Inventario (uno por debajo del umbral)
await user.from("inventory_products").insert([
  { nombre: "Guantes nitrilo (caja)", categoria: "Material", unidades: 3, umbral_alerta: 5, proveedor: "DentalSupply", coste: 8.5 },
  { nombre: "Anestesia articaína", categoria: "Fármacos", unidades: 24, umbral_alerta: 10, proveedor: "Normon", coste: 1.2 },
  { nombre: "Pasta profilaxis", categoria: "Material", unidades: 2, umbral_alerta: 6, proveedor: "DentalSupply", coste: 4.0 },
]);

console.log("✅ seed demo completado");
console.log(`   login: ${EMAIL} / ${PASSWORD}`);
