import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/org";
import { FacturaDoc } from "./factura-doc";

export const metadata = { title: "Factura — Clinicomatic" };

// Tipo explícito de la línea (el join embebido se infiere distinto según la
// versión de @supabase/supabase-js; tiparlo evita "implicit any" en el build).
type ItemRow = { id: string; descripcion: string; cantidad: number; precio_unitario: number; descuento_pct: number; iva_pct: number; importe: number };

export default async function FacturaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [facturaRes, settingsRes, org] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, invoice_items(id, descripcion, cantidad, precio_unitario, descuento_pct, iva_pct, importe)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("billing_settings").select("razon_social, nif, direccion, plantilla, pie_documento, color_documento").maybeSingle(),
    getCurrentOrg(),
  ]);

  const factura = facturaRes.data;
  if (!factura) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <Link href="/facturacion" className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--text-soft)] hover:text-[var(--text)] print:hidden">
        <ArrowLeft size={15} /> Facturas de venta
      </Link>
      <FacturaDoc
        factura={{
          id: factura.id,
          numero: factura.numero,
          fecha: factura.fecha,
          vencimiento: factura.vencimiento,
          estado: factura.estado,
          forma_pago: factura.forma_pago,
          notas: factura.notas,
          cliente_nombre: factura.cliente_nombre,
          cliente_nif: factura.cliente_nif,
          cliente_direccion: factura.cliente_direccion,
          tipo: factura.tipo,
          verifacti_estado: factura.verifacti_estado,
          verifacti_qr: factura.verifacti_qr,
          verifacti_url: factura.verifacti_url,
          subtotal: Number(factura.subtotal),
          iva_total: Number(factura.iva_total),
          total: Number(factura.total),
          items: ((factura.invoice_items ?? []) as ItemRow[]).map((it) => ({
            id: it.id,
            descripcion: it.descripcion,
            cantidad: Number(it.cantidad),
            precio_unitario: Number(it.precio_unitario),
            descuento_pct: Number(it.descuento_pct),
            iva_pct: Number(it.iva_pct),
            importe: Number(it.importe),
          })),
        }}
        emisor={{
          nombre: settingsRes.data?.razon_social || org?.nombre || "Mi clínica",
          nif: settingsRes.data?.nif ?? null,
          direccion: settingsRes.data?.direccion ?? null,
          logoUrl: org?.logo_path ?? null,
          brandColor: settingsRes.data?.color_documento || org?.brand_color || "#0e9f8e",
          pie: settingsRes.data?.pie_documento ?? null,
        }}
        plantillaInicial={(settingsRes.data?.plantilla as "moderna" | "clasica" | "minimal") ?? "moderna"}
      />
    </div>
  );
}
