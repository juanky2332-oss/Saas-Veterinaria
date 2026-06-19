"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const itemSchema = z.object({
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  precio_unitario: z.number().min(0),
  descuento_pct: z.number().min(0).max(100).default(0),
  iva_pct: z.number().min(0).max(100),
});

const presupuestoSchema = z.object({
  cliente_nombre: z.string().min(1, "El nombre del cliente es obligatorio."),
  cliente_nif: z.string().optional(),
  cliente_direccion: z.string().optional(),
  patient_id: z.string().uuid().optional().nullable(),
  notas: z.string().optional(),
  fecha: z.string().optional(),
  validez: z.string().optional(),
  items: z.array(itemSchema).min(1, "Añade al menos una línea."),
});

const round2 = (n: number) => Math.round(n * 100) / 100;

function totales(items: z.infer<typeof itemSchema>[]) {
  let subtotal = 0, ivaTotal = 0;
  const lineas = items.map((it) => {
    const base = it.cantidad * it.precio_unitario * (1 - it.descuento_pct / 100);
    const iva = base * (it.iva_pct / 100);
    subtotal += base; ivaTotal += iva;
    return { ...it, importe: round2(base + iva) };
  });
  return { lineas, subtotal: round2(subtotal), ivaTotal: round2(ivaTotal), total: round2(subtotal + ivaTotal) };
}

export async function crearPresupuesto(input: unknown): Promise<{ error?: string; id?: string }> {
  const parsed = presupuestoSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  const d = parsed.data;
  const supabase = await createClient();

  const { count } = await supabase.from("quotes").select("id", { count: "exact", head: true });
  const numero = `PRE-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { lineas, subtotal, ivaTotal, total } = totales(d.items);

  const { data: q, error: qErr } = await supabase
    .from("quotes")
    .insert({
      numero,
      cliente_nombre: d.cliente_nombre,
      cliente_nif: d.cliente_nif ?? null,
      cliente_direccion: d.cliente_direccion ?? null,
      patient_id: d.patient_id ?? null,
      notas: d.notas ?? null,
      fecha: d.fecha || undefined,
      validez: d.validez || null,
      estado: "borrador",
      subtotal, iva_total: ivaTotal, total,
    })
    .select("id")
    .single();
  if (qErr || !q) return { error: "No se pudo crear el presupuesto." };

  const { error: itErr } = await supabase.from("quote_items").insert(
    lineas.map((it) => ({
      quote_id: q.id,
      descripcion: it.descripcion,
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
      descuento_pct: it.descuento_pct,
      iva_pct: it.iva_pct,
      importe: it.importe,
    })),
  );
  if (itErr) return { error: "Presupuesto creado, pero fallaron las líneas." };

  revalidatePath("/presupuestos");
  return { id: q.id };
}

export async function cambiarEstadoPresupuesto(
  id: string,
  estado: "borrador" | "enviado" | "aceptado" | "rechazado",
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").update({ estado }).eq("id", id);
  if (error) return { error: "No se pudo actualizar el presupuesto." };
  revalidatePath("/presupuestos");
  return {};
}

export async function eliminarPresupuesto(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar." };
  revalidatePath("/presupuestos");
  return {};
}

/** Convierte un presupuesto en una factura emitida y enlaza ambos. */
export async function convertirEnFactura(quoteId: string): Promise<{ error?: string; invoiceId?: string }> {
  const supabase = await createClient();

  const { data: q } = await supabase
    .from("quotes")
    .select("*, quote_items(descripcion, cantidad, precio_unitario, descuento_pct, iva_pct, importe)")
    .eq("id", quoteId)
    .maybeSingle();
  if (!q) return { error: "Presupuesto no encontrado." };
  if (q.invoice_id) return { error: "Este presupuesto ya se convirtió en factura." };

  const { data: numero, error: numErr } = await supabase.rpc("siguiente_numero_factura");
  if (numErr || !numero) return { error: "No se pudo generar el número de factura." };

  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .insert({
      numero,
      cliente_nombre: q.cliente_nombre,
      cliente_nif: q.cliente_nif,
      cliente_direccion: q.cliente_direccion,
      patient_id: q.patient_id,
      notas: q.notas,
      subtotal: q.subtotal,
      iva_total: q.iva_total,
      total: q.total,
      estado: "emitida",
    })
    .select("id")
    .single();
  if (invErr || !inv) return { error: "No se pudo crear la factura." };

  const items = (q.quote_items ?? []) as {
    descripcion: string; cantidad: number; precio_unitario: number; descuento_pct: number; iva_pct: number; importe: number;
  }[];
  if (items.length > 0) {
    await supabase.from("invoice_items").insert(
      items.map((it) => ({
        invoice_id: inv.id,
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        descuento_pct: it.descuento_pct,
        iva_pct: it.iva_pct,
        importe: it.importe,
      })),
    );
  }

  await supabase.from("quotes").update({ estado: "facturado", invoice_id: inv.id }).eq("id", quoteId);

  revalidatePath("/presupuestos");
  revalidatePath("/facturacion");
  return { invoiceId: inv.id };
}
