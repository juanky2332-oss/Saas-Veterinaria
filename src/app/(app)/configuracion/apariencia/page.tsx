import { getCurrentOrg } from "@/lib/auth/org";
import { AparienciaClient } from "./apariencia-client";

export const metadata = { title: "Apariencia — VetClinic" };

export default async function AparienciaPage() {
  const org = await getCurrentOrg();
  if (!org) return null;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--text)]">Apariencia</h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          Personaliza la app con la identidad de tu clínica: tema, colores y logo.
        </p>
      </div>
      <AparienciaClient
        orgId={org.id}
        clinicName={org.nombre}
        vertical={org.vertical}
        brandColor={org.brand_color}
        accentColor={org.accent_color}
        logoUrl={org.logo_path}
        timezone={org.timezone}
      />
    </div>
  );
}
