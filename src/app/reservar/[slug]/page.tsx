import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServiceClient } from "@/lib/supabase/service";
import { resolveTenantTheme, themeToStyle, type VerticalPreset } from "@/lib/theme/themes";
import { ReservaForm } from "./reserva-form";

export const metadata: Metadata = { title: "Reservar cita", robots: { index: false } };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export default async function ReservarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase: AnySupabase = getServiceClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, nombre, vertical, brand_color, accent_color")
    .eq("slug", slug)
    .maybeSingle();

  if (!org) notFound();

  const { data: treatments } = await supabase
    .from("treatments")
    .select("id, nombre, duracion_min, precio_orientativo")
    .eq("organization_id", org.id)
    .eq("activo", true)
    .order("nombre");

  const theme = resolveTenantTheme({
    vertical: (org.vertical as VerticalPreset) ?? "general",
    brandColor: org.brand_color,
    accentColor: org.accent_color,
  });

  return (
    <div style={themeToStyle(theme)} className="min-h-dvh bg-[var(--bg)] px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-[14px] bg-[var(--brand)] text-white text-xl font-display font-bold">
            {org.nombre.charAt(0).toUpperCase()}
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold text-[var(--text)]">{org.nombre}</h1>
          <p className="mt-1 text-sm text-[var(--text-soft)]">Reserva tu cita online</p>
        </div>
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
          <ReservaForm slug={slug} treatments={treatments ?? []} />
        </div>
      </div>
    </div>
  );
}
