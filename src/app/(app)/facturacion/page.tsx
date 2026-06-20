import { createClient } from "@/lib/supabase/server";
import { FacturacionLista, type FacturaRow } from "./facturacion-lista";

export const metadata = { title: "Facturación — Veteriblandenguer" };

// Tipo explícito del resultado (el join embebido invoice_items se infiere como
// `any` en algunos entornos de build â†’ evita "implicit any" en el .map).
type FacturaSrc = {
  id: string; numero: string; fecha: string; vencimiento: string | null;
  cliente_nombre: string; subtotal: number; iva_total: number; total: number;
  estado: string; forma_pago: string | null; invoice_items: { descripcion: string }[] | null;
};

export default async function FacturacionPage() {
  const supabase = await createClient();

  const [facturasRes, settingsRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, numero, fecha, vencimiento, cliente_nombre, subtotal, iva_total, total, estado, forma_pago, invoice_items(descripcion)")
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("billing_settings").select("razon_social, nif, direccion, serie, iva_default, pie_documento, color_documento").maybeSingle(),
  ]);

  const facturas: FacturaRow[] = ((facturasRes.data ?? []) as FacturaSrc[]).map((f) => ({
    id: f.id,
    numero: f.numero,
    fecha: f.fecha,
    vencimiento: f.vencimiento,
    cliente_nombre: f.cliente_nombre,
    subtotal: Number(f.subtotal),
    iva_total: Number(f.iva_total),
    total: Number(f.total),
    estado: f.estado,
    forma_pago: f.forma_pago,
    descripcion: f.invoice_items?.[0]?.descripcion ?? null,
  }));

  return (
    <FacturacionLista
      facturas={facturas}
      fiscales={{
        razon_social: settingsRes.data?.razon_social ?? "",
        nif: settingsRes.data?.nif ?? "",
        direccion: settingsRes.data?.direccion ?? "",
        serie: settingsRes.data?.serie ?? "A",
        iva_default: Number(settingsRes.data?.iva_default ?? 21),
        pie_documento: settingsRes.data?.pie_documento ?? "",
        color_documento: settingsRes.data?.color_documento ?? "",
      }}
    />
  );
}
