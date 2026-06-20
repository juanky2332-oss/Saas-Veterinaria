import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { WhatsappBandeja } from "@/components/modules/whatsapp/whatsapp-bandeja";

export const metadata = { title: "WhatsApp — Veteriblandenguer" };

export default async function WhatsappPage() {
  const supabase = await createClient();

  const [convsRes, integRes] = await Promise.all([
    supabase
      .from("wa_conversations")
      .select("*, patients(nombre, apellidos)")
      .order("ultima_entrada_at", { ascending: false }),
    supabase
      .from("org_integrations")
      .select("external_id, activo")
      .eq("tipo", "whatsapp")
      .maybeSingle(),
  ]);

  const conectado = Boolean(integRes.data?.external_id && integRes.data?.activo);

  return (
    <div className="flex flex-col min-h-full h-[calc(100dvh-0px)]">
      <Header title="WhatsApp" />
      <div className="flex-1 overflow-hidden">
        <WhatsappBandeja conversaciones={convsRes.data ?? []} conectado={conectado} />
      </div>
    </div>
  );
}
