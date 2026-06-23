import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth/org";
import { ConsentimientosClient } from "./consentimientos-client";

export const metadata = { title: "Consentimientos — VetClinic" };

export default async function ConsentimientosPage() {
  const supabase = await createClient();
  const [tplRes, org] = await Promise.all([
    supabase
      .from("consent_templates")
      .select("id, titulo, tipo, especialidad, cuerpo_richtext, variables, archivo_path, updated_at")
      .eq("activo", true)
      .order("updated_at", { ascending: false }),
    getCurrentOrg(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--text)]">Consentimientos</h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          Plantillas de consentimiento informado por especialidad, editables con variables de tu clínica. También puedes subir tu propio Word o PDF.
        </p>
      </div>
      <ConsentimientosClient
        misPlantillas={(tplRes.data ?? []) as never}
        orgId={org?.id ?? ""}
        vertical={org?.vertical ?? null}
      />
    </div>
  );
}
