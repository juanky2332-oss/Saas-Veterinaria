import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/org";
import { PresupuestoDoc } from "./presupuesto-doc";

export const metadata = { title: "Presupuesto — Clinicomatic" };

// Tipo explícito de la línea (el join embebido se infiere distinto según la
// versión de @supabase/supabase-js; tiparlo evita "implicit any" en el build).
type ItemRow = { id: string; descripcion: string; cantidad: number; precio_unitario: number; descuento_pct: number; iva_pct: number; importe: number };

export default async function PresupuestoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [quoteRes, settingsRes, org] = await Promise.all([
    supabase
      .from("quotes")
      .select("*, quote_items(id, descripcion, cantidad, precio_unitario, descuento_pct, iva_pct, importe)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("billing_settings").select("razon_social, nif, direccion, plantilla, pie_documento, color_documento").maybeSingle(),
    getCurrentOrg(),
  ]);

  const q = quoteRes.data;
  if (!q) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <Link href="/presupuestos" className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--text-soft)] hover:text-[var(--text)] print:hidden">
        <ArrowLeft size={15} /> Presupuestos
      </Link>
      <PresupuestoDoc
        presupuesto={{
          id: q.id,
          numero: q.numero,
          fecha: q.fecha,
          validez: q.validez,
          estado: q.estado,
          notas: q.notas,
          cliente_nombre: q.cliente_nombre,
          cliente_nif: q.cliente_nif,
          cliente_direccion: q.cliente_direccion,
          invoice_id: q.invoice_id,
          subtotal: Number(q.subtotal),
          iva_total: Number(q.iva_total),
          total: Number(q.total),
          items: ((q.quote_items ?? []) as ItemRow[]).map((it) => ({
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
