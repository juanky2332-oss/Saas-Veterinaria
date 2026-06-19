import { createClient } from "@/lib/supabase/server";
import { VerifactuClient } from "./verifactu-client";
import { verifactiModo } from "@/lib/adapters/verifacti";

export const metadata = { title: "Verifactu — Clinicomatic" };

export default async function VerifactuPage() {
  const supabase = await createClient();
  const [integRes, bsRes] = await Promise.all([
    supabase.from("org_integrations").select("config, activo").eq("tipo", "verifacti").maybeSingle(),
    supabase.from("billing_settings").select("nif, razon_social").maybeSingle(),
  ]);

  const cfg = (integRes.data?.config ?? {}) as { api_key?: string; nif?: string; regimen?: "verifactu" | "ticketbai" };

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--text)]">Verifactu / TicketBAI</h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          Facturación verificable ante la AEAT (Verifactu) y la Hacienda Foral del País Vasco (TicketBAI). La conexión se gestiona automáticamente: tú no introduces ninguna clave.
        </p>
      </div>
      <VerifactuClient
        conectado={Boolean(cfg.api_key)}
        nifConectado={cfg.nif ?? null}
        regimenConectado={cfg.regimen ?? null}
        nifFiscal={bsRes.data?.nif ?? null}
        razonSocial={bsRes.data?.razon_social ?? null}
        activo={integRes.data?.activo ?? false}
        modoLive={verifactiModo() === "live"}
      />
    </div>
  );
}
