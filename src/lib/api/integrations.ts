import { getServiceClient } from "@/lib/supabase/service";

/**
 * Resuelve a qué organización pertenece un webhook entrante (WhatsApp/GHL) a
 * partir de su identificador externo (phone_number_id / location_id), usando la
 * tabla org_integrations. Devuelve null si ninguna clínica lo tiene configurado
 * → el webhook debe responder 200 y no hacer nada (evita errores y reintentos).
 */
export async function resolveOrgByIntegration(tipo: string, externalId: string | null | undefined): Promise<string | null> {
  if (!externalId) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = getServiceClient() as any;
  const { data } = await svc
    .from("org_integrations")
    .select("organization_id")
    .eq("tipo", tipo)
    .eq("external_id", externalId)
    .eq("activo", true)
    .maybeSingle();
  return (data?.organization_id as string | undefined) ?? null;
}
