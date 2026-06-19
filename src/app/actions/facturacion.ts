"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifactiAdapter, fechaExpedicionHoy, type VerifactiLinea, type VerifactiCreatePayload, type Regimen, type TerritorioTbai } from "@/lib/adapters/verifacti";
import { currentUserHasRole } from "@/lib/auth/org";
import type { Json } from "@/lib/database.types";

const itemSchema = z.object({
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  precio_unitario: z.number().min(0),
  descuento_pct: z.number().min(0).max(100).default(0),
  iva_pct: z.number().min(0).max(100),
});

const facturaSchema = z.object({
  cliente_nombre: z.string().min(1, "El nombre del cliente es obligatorio."),
  cliente_nif: z.string().optional(),
  cliente_direccion: z.string().optional(),
  patient_id: z.string().uuid().optional().nullable(),
  notas: z.string().optional(),
  fecha: z.string().optional(),        // yyyy-mm-dd
  vencimiento: z.string().optional(),  // yyyy-mm-dd
  forma_pago: z.string().optional(),
  estado: z.enum(["borrador", "emitida"]).default("emitida"),
  items: z.array(itemSchema).min(1, "Añade al menos una línea."),
});

const round2 = (n: number) => Math.round(n * 100) / 100;

function calcularTotales(items: z.infer<typeof itemSchema>[]) {
  let subtotal = 0;
  let ivaTotal = 0;
  const lineas = items.map((it) => {
    const base = it.cantidad * it.precio_unitario * (1 - it.descuento_pct / 100);
    const iva = base * (it.iva_pct / 100);
    subtotal += base;
    ivaTotal += iva;
    return { ...it, importe: round2(base + iva) };
  });
  return { lineas, subtotal: round2(subtotal), ivaTotal: round2(ivaTotal), total: round2(subtotal + ivaTotal) };
}

export async function crearFactura(input: unknown): Promise<{ error?: string; id?: string }> {
  const parsed = facturaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos de factura inválidos." };
  }
  const d = parsed.data;
  const supabase = await createClient();

  // El número oficial solo se consume al emitir; los borradores llevan número provisional
  let numero: string;
  if (d.estado === "emitida") {
    const { data, error } = await supabase.rpc("siguiente_numero_factura");
    if (error || !data) return { error: "No se pudo generar el número de factura." };
    numero = data;
  } else {
    numero = `BOR-${Date.now().toString(36).toUpperCase()}`;
  }

  const { lineas, subtotal, ivaTotal, total } = calcularTotales(d.items);

  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .insert({
      numero,
      fecha: d.fecha || undefined,
      vencimiento: d.vencimiento || null,
      forma_pago: d.forma_pago || null,
      cliente_nombre: d.cliente_nombre,
      cliente_nif: d.cliente_nif ?? null,
      cliente_direccion: d.cliente_direccion ?? null,
      patient_id: d.patient_id ?? null,
      notas: d.notas ?? null,
      subtotal,
      iva_total: ivaTotal,
      total,
      estado: d.estado,
    })
    .select("id")
    .single();

  if (invErr || !inv) return { error: "No se pudo crear la factura." };

  const { error: itErr } = await supabase.from("invoice_items").insert(
    lineas.map((it) => ({
      invoice_id: inv.id,
      descripcion: it.descripcion,
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
      descuento_pct: it.descuento_pct,
      iva_pct: it.iva_pct,
      importe: it.importe,
    })),
  );
  if (itErr) return { error: "Factura creada, pero fallaron las líneas." };

  revalidatePath("/facturacion");
  return { id: inv.id };
}

/** Emite un borrador: le asigna número oficial y pasa a estado "emitida". */
export async function emitirFactura(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: inv } = await supabase.from("invoices").select("estado").eq("id", id).maybeSingle();
  if (!inv) return { error: "Factura no encontrada." };
  if (inv.estado !== "borrador") return { error: "Solo se pueden emitir borradores." };

  const { data: numero, error: numErr } = await supabase.rpc("siguiente_numero_factura");
  if (numErr || !numero) return { error: "No se pudo generar el número." };

  const { error } = await supabase.from("invoices").update({ numero, estado: "emitida" }).eq("id", id);
  if (error) return { error: "No se pudo emitir la factura." };
  revalidatePath("/facturacion");
  revalidatePath(`/facturacion/${id}`);
  return {};
}

export async function cambiarEstadoFactura(
  id: string,
  estado: "emitida" | "pagada" | "anulada",
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").update({ estado }).eq("id", id);
  if (error) return { error: "No se pudo actualizar la factura." };
  revalidatePath("/facturacion");
  revalidatePath(`/facturacion/${id}`);
  return {};
}

/**
 * Resuelve la clave de facturación (vf_) del NIF de la clínica. Si todavía no
 * está aprovisionada, registra+activa el NIF en Verifacti con la clave maestra
 * (vfn_) y guarda la clave del NIF para futuras facturas. El cliente no toca nada.
 * Devuelve key=undefined si no hay clave pero existe respaldo global del entorno.
 */
async function claveVerifactiDeLaOrg(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<{ key?: string; regimen: Regimen; error?: string }> {
  const { data: integ } = await supabase
    .from("org_integrations")
    .select("config")
    .eq("tipo", "verifacti")
    .maybeSingle();
  const cfg = (integ?.config ?? {}) as { api_key?: string; regimen?: Regimen };
  const regimen: Regimen = cfg.regimen === "ticketbai" ? "ticketbai" : "verifactu";
  if (cfg.api_key) return { key: cfg.api_key, regimen };

  const { data: bs } = await supabase
    .from("billing_settings")
    .select("nif, razon_social, direccion")
    .maybeSingle();
  if (!bs?.nif) {
    return process.env.VERIFACTI_API_KEY
      ? { key: undefined, regimen }
      : { regimen, error: "Configura primero tus datos fiscales (NIF) para activar Verifactu." };
  }

  const prov = await verifactiAdapter.aprovisionarNif({
    nif: bs.nif,
    nombre: bs.razon_social ?? undefined,
    direccion: bs.direccion ?? undefined,
  });
  if (prov.error || !prov.vfKey) {
    return process.env.VERIFACTI_API_KEY ? { key: undefined, regimen } : { regimen, error: prov.error ?? "No se pudo aprovisionar el NIF en Verifacti." };
  }

  await supabase.from("org_integrations").upsert(
    { tipo: "verifacti", activo: true, config: { api_key: prov.vfKey, nif: prov.nif, entorno: prov.entorno, regimen: prov.regimen } as unknown as Json },
    { onConflict: "organization_id,tipo" },
  );
  await supabase.from("billing_settings").upsert({ verifacti_enabled: true }, { onConflict: "organization_id" });
  return { key: prov.vfKey, regimen: prov.regimen };
}

/**
 * Envía una factura emitida a Verifactu (vía Verifacti) para su homologación
 * ante la AEAT. Guarda el UUID, el estado, el QR y la URL de validación.
 */
export async function enviarVerifactu(id: string): Promise<{ error?: string; estado?: string }> {
  const supabase = await createClient();

  const { data: inv } = await supabase
    .from("invoices")
    .select("*, invoice_items(descripcion, cantidad, precio_unitario, descuento_pct, iva_pct)")
    .eq("id", id)
    .maybeSingle();
  if (!inv) return { error: "Factura no encontrada." };
  if (inv.estado === "borrador") return { error: "Emite la factura antes de enviarla a Verifactu." };
  if (inv.verifacti_id) return { error: "Esta factura ya está registrada en Verifactu." };

  const items = (inv.invoice_items ?? []) as {
    descripcion: string; cantidad: number; precio_unitario: number; descuento_pct: number; iva_pct: number;
  }[];
  if (items.length === 0) return { error: "La factura no tiene líneas." };

  const lineas: VerifactiLinea[] = items.map((it) => {
    const base = round2(Number(it.cantidad) * Number(it.precio_unitario) * (1 - Number(it.descuento_pct) / 100));
    const cuota = round2(base * (Number(it.iva_pct) / 100));
    return {
      base_imponible: base.toFixed(2),
      tipo_impositivo: String(Number(it.iva_pct)),
      cuota_repercutida: cuota.toFixed(2),
      descripcion: it.descripcion,
    };
  });

  // Clave de facturación del NIF de la clínica (se aprovisiona automáticamente
  // la primera vez); si no se puede, cae a la clave global de respaldo del entorno.
  const clave = await claveVerifactiDeLaOrg(supabase);
  if (clave.error) return { error: clave.error };

  // Factura rectificativa: tipo R1 + referencia a la original (estilo Holded).
  let tipoFactura = "F1";
  let rectFields: Partial<VerifactiCreatePayload> = {};
  if (inv.tipo === "rectificativa" && inv.rectifica_id) {
    const { data: orig } = await supabase.from("invoices").select("numero").eq("id", inv.rectifica_id).maybeSingle();
    tipoFactura = "R1";
    rectFields = {
      tipo_rectificativa: "I",
      importe_rectificativa: Number(inv.total).toFixed(2),
      facturas_rectificadas: orig ? [{ numero: orig.numero }] : [],
    };
  }

  const res = await verifactiAdapter.crear(
    {
      serie: "",
      numero: inv.numero,
      fecha_expedicion: fechaExpedicionHoy(),
      tipo_factura: tipoFactura,
      descripcion: `${inv.tipo === "rectificativa" ? "Factura rectificativa" : "Factura"} ${inv.numero} — ${inv.cliente_nombre}`.slice(0, 250),
      nif: inv.cliente_nif || undefined,
      nombre: inv.cliente_nombre || undefined,
      validar_destinatario: false,
      lineas,
      importe_total: Number(inv.total).toFixed(2),
      ...rectFields,
    },
    clave.key,
    clave.regimen,
  );

  if (res.error) return { error: `Verifactu: ${res.error}` };

  const { error } = await supabase
    .from("invoices")
    .update({
      verifacti_id: res.uuid,
      verifacti_estado: res.estado,
      verifacti_qr: res.qr || null,
      verifacti_url: res.url || null,
      verifacti_enviado_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: "Registrada en Verifactu, pero no se pudo guardar el resultado." };

  revalidatePath(`/facturacion/${id}`);
  revalidatePath("/facturacion");
  return { estado: res.estado };
}

/**
 * Activa Verifactu para la clínica: registra y activa su NIF en Verifacti con la
 * clave maestra de la plataforma y guarda internamente la clave del NIF. El
 * cliente NO introduce ninguna clave. Requiere tener el NIF en datos fiscales.
 * Owner/admin.
 */
export async function aprovisionarVerifacti(
  input?: { regimen?: Regimen; territorio?: TerritorioTbai },
): Promise<{ error?: string; nif?: string; estado?: string; regimen?: Regimen }> {
  if (!(await currentUserHasRole(["owner", "admin"]))) {
    return { error: "Solo el propietario o un administrador pueden activar Verifactu." };
  }
  const supabase = await createClient();

  const { data: bs } = await supabase
    .from("billing_settings")
    .select("nif, razon_social, direccion")
    .maybeSingle();
  if (!bs?.nif) return { error: "Configura primero tus datos fiscales (NIF) en Facturación." };

  // Para TicketBAI hace falta el territorio foral.
  const esTbai = input?.regimen === "ticketbai";
  if (esTbai && !input?.territorio) return { error: "Para TicketBAI indica el territorio foral (Álava, Bizkaia o Gipuzkoa)." };

  const prov = await verifactiAdapter.aprovisionarNif({
    nif: bs.nif,
    nombre: bs.razon_social ?? undefined,
    direccion: bs.direccion ?? undefined,
    territorio: esTbai ? input?.territorio : undefined,
  });
  if (prov.error || !prov.vfKey) return { error: prov.error ?? "No se pudo activar Verifactu." };

  const { error } = await supabase.from("org_integrations").upsert(
    { tipo: "verifacti", activo: true, config: { api_key: prov.vfKey, nif: prov.nif, entorno: prov.entorno, regimen: prov.regimen } as unknown as Json },
    { onConflict: "organization_id,tipo" },
  );
  if (error) return { error: "NIF activado, pero no se pudo guardar la conexión." };
  await supabase.from("billing_settings").upsert({ verifacti_enabled: true }, { onConflict: "organization_id" });

  revalidatePath("/configuracion/verifactu");
  revalidatePath("/facturacion");
  return { nif: prov.nif, estado: prov.estado, regimen: prov.regimen };
}

/** Activa / pausa el envío automático a Verifactu (sin desconectar el NIF). Owner/admin. */
export async function toggleVerifacti(activo: boolean): Promise<{ error?: string }> {
  if (!(await currentUserHasRole(["owner", "admin"]))) {
    return { error: "Solo el propietario o un administrador pueden cambiar este ajuste." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("org_integrations").update({ activo }).eq("tipo", "verifacti");
  if (error) return { error: "No se pudo actualizar el ajuste." };
  await supabase.from("billing_settings").upsert({ verifacti_enabled: activo }, { onConflict: "organization_id" });
  revalidatePath("/configuracion/verifactu");
  return {};
}

/**
 * Crea una factura RECTIFICATIVA (borrador) a partir de una ya emitida/registrada,
 * copiando sus líneas y enlazándola con la original (estilo Holded). Luego se edita,
 * se emite y se envía como R1 vinculada a la original.
 */
export async function rectificarFactura(id: string): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: orig } = await supabase
    .from("invoices")
    .select("*, invoice_items(descripcion, cantidad, precio_unitario, descuento_pct, iva_pct, importe)")
    .eq("id", id)
    .maybeSingle();
  if (!orig) return { error: "Factura no encontrada." };
  if (orig.tipo === "rectificativa") return { error: "Una factura rectificativa no se puede rectificar." };
  if (orig.estado === "borrador") return { error: "Solo se rectifican facturas ya emitidas." };

  const numero = `BOR-R-${Date.now().toString(36).toUpperCase()}`;
  const { data: nueva, error } = await supabase
    .from("invoices")
    .insert({
      numero,
      cliente_nombre: orig.cliente_nombre,
      cliente_nif: orig.cliente_nif,
      cliente_direccion: orig.cliente_direccion,
      patient_id: orig.patient_id,
      notas: `Factura rectificativa de la ${orig.numero}.`,
      subtotal: orig.subtotal,
      iva_total: orig.iva_total,
      total: orig.total,
      estado: "borrador",
      tipo: "rectificativa",
      rectifica_id: orig.id,
    })
    .select("id")
    .single();
  if (error || !nueva) return { error: "No se pudo crear la rectificativa." };

  const items = (orig.invoice_items ?? []) as {
    descripcion: string; cantidad: number; precio_unitario: number; descuento_pct: number; iva_pct: number; importe: number;
  }[];
  if (items.length > 0) {
    await supabase.from("invoice_items").insert(
      items.map((it) => ({
        invoice_id: nueva.id,
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        descuento_pct: it.descuento_pct,
        iva_pct: it.iva_pct,
        importe: it.importe,
      })),
    );
  }
  revalidatePath("/facturacion");
  return { id: nueva.id };
}

/** Guarda los datos fiscales / serie / IVA + personalización del documento (pie, color). */
export async function guardarDatosFiscales(input: {
  razon_social: string;
  nif: string;
  direccion: string;
  serie: string;
  iva_default: number;
  pie_documento?: string;
  color_documento?: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("billing_settings").upsert(
    {
      razon_social: input.razon_social || null,
      nif: input.nif || null,
      direccion: input.direccion || null,
      serie: input.serie?.trim() || "A",
      iva_default: Number.isFinite(input.iva_default) ? input.iva_default : 21,
      pie_documento: input.pie_documento?.trim() || null,
      color_documento: input.color_documento?.trim() || null,
    },
    { onConflict: "organization_id" },
  );
  if (error) return { error: "No se pudieron guardar los datos fiscales." };
  revalidatePath("/facturacion");
  return {};
}

/** Cambia la plantilla de documento de la clínica. */
export async function guardarPlantilla(plantilla: "moderna" | "clasica" | "minimal"): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("billing_settings")
    .upsert({ plantilla }, { onConflict: "organization_id" });
  if (error) return { error: "No se pudo cambiar la plantilla." };
  revalidatePath("/facturacion");
  return {};
}
