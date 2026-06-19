import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { PresupuestosLista } from "./presupuestos-lista";

export const metadata = { title: "Presupuestos — Clinicomatic" };

export default async function PresupuestosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select("id, numero, cliente_nombre, fecha, validez, estado, total, invoice_id")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Presupuestos" />
      <div className="flex-1 p-4 md:p-6">
        <PresupuestosLista rows={data ?? []} />
      </div>
    </div>
  );
}
