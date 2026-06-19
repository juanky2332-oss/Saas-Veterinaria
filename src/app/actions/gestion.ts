"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const txt = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
};
const numOrNull = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/* ──────────────────────── Mutuas ──────────────────────── */

export async function crearMutua(form: FormData): Promise<{ error?: string }> {
  const nombre = txt(form.get("nombre"));
  if (!nombre) return { error: "El nombre es obligatorio." };
  const supabase = await createClient();
  const { error } = await supabase.from("mutuas").insert({
    nombre,
    cif: txt(form.get("cif")),
    telefono: txt(form.get("telefono")),
    email: txt(form.get("email")),
    descuento_pct: numOrNull(form.get("descuento_pct")),
    condiciones: txt(form.get("condiciones")),
  });
  if (error) return { error: "No se pudo crear la mutua." };
  revalidatePath("/mutuas");
  return {};
}

export async function eliminarMutua(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("mutuas").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar." };
  revalidatePath("/mutuas");
  return {};
}

/* ─────────────────────── Proveedores ─────────────────────── */

export async function crearProveedor(form: FormData): Promise<{ error?: string }> {
  const nombre = txt(form.get("nombre"));
  if (!nombre) return { error: "El nombre es obligatorio." };
  const supabase = await createClient();
  const { error } = await supabase.from("proveedores").insert({
    nombre,
    cif: txt(form.get("cif")),
    contacto: txt(form.get("contacto")),
    telefono: txt(form.get("telefono")),
    email: txt(form.get("email")),
    categoria: txt(form.get("categoria")),
    notas: txt(form.get("notas")),
  });
  if (error) return { error: "No se pudo crear el proveedor." };
  revalidatePath("/proveedores");
  return {};
}

export async function eliminarProveedor(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("proveedores").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar." };
  revalidatePath("/proveedores");
  return {};
}

/* ──────────────────────── Cuotas ──────────────────────── */

export async function crearCuota(form: FormData): Promise<{ error?: string }> {
  const concepto = txt(form.get("concepto"));
  const importe = numOrNull(form.get("importe"));
  if (!concepto || importe == null) return { error: "Concepto e importe son obligatorios." };
  const supabase = await createClient();
  const { error } = await supabase.from("cuotas").insert({
    concepto,
    importe,
    periodicidad: txt(form.get("periodicidad")) ?? "mensual",
    proximo_cobro: txt(form.get("proximo_cobro")),
    metodo: txt(form.get("metodo")),
    patient_id: txt(form.get("patient_id")),
  });
  if (error) return { error: "No se pudo crear la cuota." };
  revalidatePath("/cuotas");
  return {};
}

export async function toggleCuota(id: string, activo: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("cuotas").update({ activo }).eq("id", id);
  if (error) return { error: "No se pudo actualizar." };
  revalidatePath("/cuotas");
  return {};
}

export async function eliminarCuota(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("cuotas").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar." };
  revalidatePath("/cuotas");
  return {};
}

/* ──────────────────────── Bonos ───────────────────────── */

export async function crearBono(form: FormData): Promise<{ error?: string }> {
  const patient_id = txt(form.get("patient_id"));
  const nombre = txt(form.get("nombre"));
  const sesiones = numOrNull(form.get("sesiones_total"));
  if (!patient_id) return { error: "Selecciona un paciente." };
  if (!nombre) return { error: "El nombre del bono es obligatorio." };
  const supabase = await createClient();
  const { error } = await supabase.from("bonos").insert({
    patient_id,
    nombre,
    sesiones_total: sesiones && sesiones > 0 ? Math.round(sesiones) : 1,
    precio: numOrNull(form.get("precio")) ?? 0,
    caducidad: txt(form.get("caducidad")),
    treatment_id: txt(form.get("treatment_id")),
    notas: txt(form.get("notas")),
  });
  if (error) return { error: "No se pudo crear el bono." };
  revalidatePath("/bonos");
  return {};
}

/* ──────────────── Plantillas de bono (tipos predeterminados) ──────────────── */

export async function crearBonoTipo(form: FormData): Promise<{ error?: string }> {
  const nombre = txt(form.get("nombre"));
  const sesiones = numOrNull(form.get("sesiones"));
  if (!nombre) return { error: "El nombre del bono es obligatorio." };
  if (!sesiones || sesiones < 1) return { error: "Indica el número de sesiones." };
  const supabase = await createClient();
  const { error } = await supabase.from("bono_tipos").insert({
    nombre,
    sesiones: Math.round(sesiones),
    precio: numOrNull(form.get("precio")) ?? 0,
    treatment_id: txt(form.get("treatment_id")),
    caducidad_meses: numOrNull(form.get("caducidad_meses")) ? Math.round(numOrNull(form.get("caducidad_meses"))!) : null,
  });
  if (error) return { error: "No se pudo crear la plantilla de bono." };
  revalidatePath("/bonos");
  return {};
}

export async function eliminarBonoTipo(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("bono_tipos").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar la plantilla." };
  revalidatePath("/bonos");
  return {};
}

/** Registra el consumo de una sesión de un bono (incrementa usadas y marca agotado). */
export async function consumirSesion(bonoId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: bono } = await supabase
    .from("bonos")
    .select("sesiones_total, sesiones_usadas, estado")
    .eq("id", bonoId)
    .maybeSingle();
  if (!bono) return { error: "Bono no encontrado." };
  if (bono.sesiones_usadas >= bono.sesiones_total) return { error: "El bono ya está agotado." };

  const nuevasUsadas = bono.sesiones_usadas + 1;
  const agotado = nuevasUsadas >= bono.sesiones_total;

  const { error: cErr } = await supabase.from("bono_consumos").insert({ bono_id: bonoId });
  if (cErr) return { error: "No se pudo registrar el consumo." };

  await supabase
    .from("bonos")
    .update({ sesiones_usadas: nuevasUsadas, estado: agotado ? "agotado" : "activo" })
    .eq("id", bonoId);

  revalidatePath("/bonos");
  return {};
}

export async function eliminarBono(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("bonos").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar." };
  revalidatePath("/bonos");
  return {};
}

/* ──────────────────────── Caja ───────────────────────── */

export async function abrirCaja(apertura: number): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // ¿Ya hay una caja abierta?
  const { data: abierta } = await supabase
    .from("cash_sessions")
    .select("id")
    .eq("estado", "abierta")
    .maybeSingle();
  if (abierta) return { error: "Ya hay una caja abierta. Ciérrala antes de abrir otra." };

  const { error } = await supabase.from("cash_sessions").insert({
    apertura: Number.isFinite(apertura) ? apertura : 0,
    abierta_por: user?.id ?? null,
  });
  if (error) return { error: "No se pudo abrir la caja." };
  revalidatePath("/caja");
  return {};
}

export async function cerrarCaja(sessionId: string, cierre: number): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cash_sessions")
    .update({ estado: "cerrada", cierre, closed_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) return { error: "No se pudo cerrar la caja." };
  revalidatePath("/caja");
  return {};
}

export async function registrarMovimiento(form: FormData): Promise<{ error?: string }> {
  const concepto = txt(form.get("concepto"));
  const importe = numOrNull(form.get("importe"));
  if (!concepto || importe == null) return { error: "Concepto e importe son obligatorios." };
  const supabase = await createClient();

  // Asociar a la caja abierta si existe.
  const { data: sesion } = await supabase
    .from("cash_sessions")
    .select("id")
    .eq("estado", "abierta")
    .maybeSingle();

  const { error } = await supabase.from("cash_movements").insert({
    session_id: sesion?.id ?? null,
    tipo: txt(form.get("tipo")) ?? "ingreso",
    concepto,
    metodo: txt(form.get("metodo")) ?? "efectivo",
    importe,
    patient_id: txt(form.get("patient_id")),
  });
  if (error) return { error: "No se pudo registrar el movimiento." };
  revalidatePath("/caja");
  return {};
}
