import { type NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import crypto from "node:crypto";

export interface ApiKeyContext {
  id: string;
  organization_id: string;
  scopes: string[];
}

/**
 * Autentica una API key (Bearer) y devuelve su contexto (incluida la
 * organización). La API pública usa service_role (salta RLS), así que TODAS las
 * consultas deben filtrarse por `organization_id` del contexto devuelto.
 * Devuelve null si la key es inválida, inactiva o no tiene el scope requerido.
 */
export async function authenticateApiKey(
  req: NextRequest,
  requiredScope: string,
): Promise<ApiKeyContext | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const key = auth.slice(7);
  const hash = crypto.createHash("sha256").update(key).digest("hex");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getServiceClient() as any;
  const { data } = (await supabase
    .from("api_keys")
    .select("id, organization_id, scopes, activo")
    .eq("hash_key", hash)
    .maybeSingle()) as {
    data: { id: string; organization_id: string; scopes: string[]; activo: boolean } | null;
  };

  if (!data?.activo) return null;
  if (!data.scopes.includes(requiredScope) && !data.scopes.includes("*")) return null;

  await supabase
    .from("api_keys")
    .update({ ultima_uso_at: new Date().toISOString() })
    .eq("id", data.id);

  return { id: data.id, organization_id: data.organization_id, scopes: data.scopes };
}
