import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Service role client para route handlers que no tienen contexto de usuario
export function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
