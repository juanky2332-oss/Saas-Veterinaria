// Seed v2: enriquece la clínica DEMO con facturas (6 meses), CRM con
// oportunidades, más pacientes/citas, informe clínico e integración WhatsApp
// (mock). Idempotente: si ya hay facturas, no duplica.
// Uso: node scripts/seed-demo2.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const EMAIL = "demo@clinicflow.app";
const PASSWORD = "ClinicFlow2026!";

const user = createClient(URL_, ANON, { auth: { persistSession: false } });
const { error: loginErr } = await user.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
if (loginErr) { console.error("login", loginErr.message); process.exit(1); }
const { data: { user: u } } = await user.auth.getUser();
const userId = u.id;
const { data: prof } = await user.from("profiles").select("organization_id").eq("id", userId).maybeSingle();
const orgId = prof?.organization_id;
console.log("org demo:", orgId);

const iso = (d) => d.toISOString();
const dia = (d) => d.toISOString().slice(0, 10);
const ahora = new Date();
const mesRel = (rel, day, h = 10) => new Date(ahora.getFullYear(), ahora.getMonth() + rel, day, h, 0, 0);

/* ── 1. Datos fiscales ── */
await user.from("billing_settings").upsert({
  razon_social: "Clínica Demo S.L.",
  nif: "B12345678",
  direccion: "Calle de la Salud 12, 28001 Madrid",
  serie: "F26",
  iva_default: 21,
}, { onConflict: "organization_id" });
console.log("✓ datos fiscales");

/* ── 2. Más pacientes ── */
const { data: pacPrev } = await user.from("patients").select("id, nombre, apellidos").order("created_at");
let pacientes = pacPrev ?? [];
if (pacientes.length < 10) {
  const nuevos = [
    ["Carmen", "Vidal Ortega", "+34 611 111 001"], ["Hugo", "Lorente Gil", "+34 611 111 002"],
    ["Lucía", "Andrés Peña", "+34 611 111 003"], ["Pablo", "Iglesias Mora", "+34 611 111 004"],
    ["Sara", "Cano Bravo", "+34 611 111 005"], ["Iván", "Mateo Rubio", "+34 611 111 006"],
    ["Elena", "Pastor Vega", "+34 611 111 007"], ["Raúl", "Serrano Cruz", "+34 611 111 008"],
  ];
  for (const [nombre, apellidos, telefono] of nuevos) {
    await user.from("patients").insert({ nombre, apellidos, telefono, origen: "manual" });
  }
  const ref = await user.from("patients").select("id, nombre, apellidos").order("created_at");
  pacientes = ref.data ?? [];
  console.log("✓ pacientes:", pacientes.length);
}

/* ── 3. Tratamientos (ids) ── */
const { data: trats } = await user.from("treatments").select("id, nombre, precio_orientativo");
const tratamientos = trats ?? [];

/* ── 4. Citas repartidas en 6 meses ── */
const { count: nCitas } = await user.from("appointments").select("id", { count: "exact", head: true });
if ((nCitas ?? 0) < 15) {
  const estados = ["completada", "completada", "completada", "confirmada", "pendiente", "cancelada", "no_show"];
  let k = 0;
  for (let m = -5; m <= 0; m++) {
    const nMes = m === 0 ? 6 : 5;
    for (let j = 0; j < nMes; j++) {
      const p = pacientes[k % pacientes.length];
      const t = tratamientos[k % Math.max(tratamientos.length, 1)];
      const ini = mesRel(m, 3 + j * 4, 9 + (k % 8));
      const fin = new Date(ini.getTime() + 45 * 60000);
      const estado = m === 0 && j >= 3 ? (j === 3 ? "confirmada" : "pendiente") : estados[k % estados.length];
      await user.from("appointments").insert({
        patient_id: p.id, treatment_id: t?.id ?? null, doctora_id: userId,
        sala: 1 + (k % 3), inicio: iso(ini), fin: iso(fin), estado, origen: "manual",
      });
      k++;
    }
  }
  console.log("✓ citas:", k);
}

/* ── 5. Facturas (6 meses, estados variados) ── */
const { count: nInv } = await user.from("invoices").select("id", { count: "exact", head: true });
if ((nInv ?? 0) === 0) {
  const formas = ["Tarjeta", "Efectivo", "Transferencia", "Bizum"];
  let creadas = 0;
  for (let m = -5; m <= 0; m++) {
    const nMes = 3 + ((m + 7) % 3);
    for (let j = 0; j < nMes; j++) {
      const p = pacientes[(creadas + j) % pacientes.length];
      const t = tratamientos[(creadas + j) % Math.max(tratamientos.length, 1)];
      const precio = Number(t?.precio_orientativo ?? 60) + j * 15;
      const fecha = mesRel(m, 4 + j * 6);
      const venc = new Date(fecha.getTime() + 15 * 864e5);
      // estado: meses pasados→pagada mayormente; alguna emitida (vencida) y este mes pendientes
      let estado = "pagada";
      if (m === 0) estado = j === 0 ? "pagada" : "emitida";
      else if (j === nMes - 1 && (m === -1 || m === -3)) estado = "emitida"; // quedarán vencidas

      const { data: numero } = await user.rpc("siguiente_numero_factura");
      const base = precio;
      const ivaTot = Math.round(base * 21) / 100;
      const { data: inv } = await user.from("invoices").insert({
        numero, fecha: dia(fecha), vencimiento: dia(venc),
        cliente_nombre: `${p.nombre} ${p.apellidos}`,
        patient_id: p.id, forma_pago: formas[creadas % formas.length],
        subtotal: base, iva_total: ivaTot, total: Math.round((base + ivaTot) * 100) / 100,
        estado,
      }).select("id").single();
      if (inv) {
        await user.from("invoice_items").insert({
          invoice_id: inv.id, descripcion: t?.nombre ?? "Consulta",
          cantidad: 1, precio_unitario: precio, descuento_pct: 0, iva_pct: 21,
          importe: Math.round(precio * 1.21 * 100) / 100,
        });
      }
      creadas++;
    }
  }
  console.log("✓ facturas:", creadas);
}

/* ── 6. CRM: pipeline + oportunidades ── */
let { data: stages } = await user.from("crm_stages").select("id, nombre, orden").order("orden");
if (!stages || stages.length === 0) {
  await user.rpc("seed_default_pipeline", { p_org: orgId });
  const r = await user.from("crm_stages").select("id, nombre, orden").order("orden");
  stages = r.data ?? [];
}
const { count: nOpp } = await user.from("crm_opportunities").select("id", { count: "exact", head: true });
if ((nOpp ?? 0) === 0 && stages.length >= 5) {
  const ops = [
    ["Marta Núñez", "+34 622 000 111", "web", 350, 0], ["Jorge Ferrer", "+34 622 000 112", "instagram", 580, 0],
    ["Alba Soto", "+34 622 000 113", "recomendación", 120, 1], ["Daniel Marín", "+34 622 000 114", "teléfono", 890, 1],
    ["Noa Castillo", "+34 622 000 115", "web", 240, 2], ["Pedro Alarcón", "+34 622 000 116", "whatsapp", 460, 3],
    ["Inés Robles", "+34 622 000 117", "instagram", 720, 4], ["Tomás Gallego", "+34 622 000 118", "web", 150, 5],
  ];
  for (const [nombre, tel, origen, valor, stageIdx] of ops) {
    await user.from("crm_opportunities").insert({
      stage_id: stages[stageIdx].id, nombre_contacto: nombre, telefono: tel,
      origen, valor, notas: origen === "web" ? "Llegó desde el formulario de la web." : null,
    });
  }
  console.log("✓ oportunidades:", ops.length);
}

/* ── 7. Integración WhatsApp (mock) + conversaciones ── */
const { data: integ } = await user.from("org_integrations").select("id").eq("tipo", "whatsapp").maybeSingle();
if (!integ) {
  await user.from("org_integrations").insert({
    tipo: "whatsapp", external_id: "demo-phone-001", activo: true,
    config: {
      display_phone: "+34 600 123 456",
      agente: {
        activo: true, tono: "cercano",
        funciones: ["faqs", "citas", "captura", "derivar"],
        instrucciones: "La primera consulta de valoración es gratuita. Estamos en Calle de la Salud 12, Madrid.",
        horario: "L-V 9:00-20:00",
      },
    },
  });
  console.log("✓ integración WhatsApp (mock)");
}
const { count: nConvs } = await user.from("wa_conversations").select("id", { count: "exact", head: true });
if ((nConvs ?? 0) === 0) {
  const p0 = pacientes[0];
  const { data: conv } = await user.from("wa_conversations").insert({
    telefono: "+34 600 111 222", patient_id: p0?.id ?? null,
    ultima_entrada_at: iso(new Date(ahora.getTime() - 35 * 60000)), no_leidos: 1,
  }).select("id").single();
  if (conv) {
    await user.from("wa_messages").insert([
      { conversation_id: conv.id, direccion: "in", tipo: "texto", cuerpo: "Hola, ¿tenéis hueco esta semana para una limpieza?", enviado_por: "humano", creado_at: iso(new Date(ahora.getTime() - 40 * 60000)) },
      { conversation_id: conv.id, direccion: "out", tipo: "texto", cuerpo: "¡Hola! 😊 Sí, nos quedan huecos el jueves por la tarde. ¿Te va bien a las 17:00?", enviado_por: "agente_ia", estado_envio: "enviado", creado_at: iso(new Date(ahora.getTime() - 38 * 60000)) },
      { conversation_id: conv.id, direccion: "in", tipo: "texto", cuerpo: "Perfecto, jueves a las 17:00 👍", enviado_por: "humano", creado_at: iso(new Date(ahora.getTime() - 35 * 60000)) },
    ]);
  }
  console.log("✓ conversación WhatsApp demo");
}

/* ── 8. Informe clínico de ejemplo ── */
const { count: nRep } = await user.from("clinical_reports").select("id", { count: "exact", head: true });
if ((nRep ?? 0) === 0) {
  const { data: citaComp } = await user.from("appointments").select("id, patient_id").eq("estado", "completada").limit(1).maybeSingle();
  if (citaComp) {
    await user.from("clinical_reports").insert({
      patient_id: citaComp.patient_id, appointment_id: citaComp.id, doctora_id: userId,
      contenido: {
        motivo: "Revisión semestral y limpieza.",
        tratamiento: "Limpieza dental completa con ultrasonidos y pulido.",
        producto_lote: "Pasta profilaxis · Lote PD-2026-04",
        observaciones: "Encías ligeramente inflamadas en sector inferior. Sin caries nuevas.",
        pauta_seguimiento: "Revisión en 6 meses. Reforzar higiene interdental con cepillos interproximales.",
      },
      transcripcion_origen: "voz", version: 1,
    });
    console.log("✓ informe clínico demo");
  }
}

console.log("✅ seed v2 completado");
