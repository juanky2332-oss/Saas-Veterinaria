"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const ProductoSchema = z.object({
  nombre: z.string().min(2, "Nombre obligatorio"),
  categoria: z.string().min(1, "Categoría obligatoria"),
  proveedor: z.string().optional(),
  unidades: z.coerce.number().min(0).default(0),
  umbral_alerta: z.coerce.number().min(0).default(5),
  coste: z.coerce.number().min(0).nullable(),
  lote: z.string().optional(),
  caducidad: z.string().optional().nullable(),
  activo: z.boolean().default(true),
});

export type ProductoInput = z.infer<typeof ProductoSchema>;

export async function crearProducto(data: ProductoInput) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const parsed = ProductoSchema.safeParse(data);
  if (!parsed.success) return { error: "Datos inválidos" };

  const { error } = await db.from("inventory_products").insert({
    nombre: parsed.data.nombre,
    categoria: parsed.data.categoria,
    proveedor: parsed.data.proveedor ?? null,
    unidades: Math.round(parsed.data.unidades),
    umbral_alerta: Math.round(parsed.data.umbral_alerta),
    coste: parsed.data.coste,
    lote: parsed.data.lote ?? null,
    caducidad: parsed.data.caducidad ?? null,
    activo: true,
  });

  if (error) return { error: error.message as string };
  revalidatePath("/inventario");
  return { ok: true };
}

export async function actualizarProducto(id: string, data: Partial<ProductoInput>) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await db.from("inventory_products").update({
    nombre: data.nombre,
    categoria: data.categoria,
    proveedor: data.proveedor ?? null,
    umbral_alerta: data.umbral_alerta != null ? Math.round(data.umbral_alerta) : undefined,
    coste: data.coste ?? null,
    lote: data.lote ?? null,
    caducidad: data.caducidad ?? null,
  }).eq("id", id);

  if (error) return { error: error.message as string };
  revalidatePath("/inventario");
  return { ok: true };
}

const MovimientoSchema = z.object({
  product_id: z.string().uuid(),
  tipo: z.enum(["entrada", "salida", "ajuste"]),
  cantidad: z.coerce.number().min(1, "Cantidad mínima 1"),
  motivo: z.string().optional(),
  appointment_id: z.string().uuid().optional(),
});

export async function registrarMovimientoStock(data: z.infer<typeof MovimientoSchema>) {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const parsed = MovimientoSchema.safeParse(data);
  if (!parsed.success) {
    const errs = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errs).flat().join(", ") || "Datos inválidos" };
  }

  // Insertar movimiento — el trigger aplica el cambio en inventory_products automáticamente
  const { error } = await db.from("stock_movements").insert({
    product_id: parsed.data.product_id,
    tipo: parsed.data.tipo,
    cantidad: Math.round(parsed.data.cantidad),
    motivo: parsed.data.motivo ?? null,
    appointment_id: parsed.data.appointment_id ?? null,
    usuario_id: user.id,
  });

  if (error) return { error: error.message as string };
  revalidatePath("/inventario");
  return { ok: true };
}
