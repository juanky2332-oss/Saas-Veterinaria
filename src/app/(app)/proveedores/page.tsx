import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ProveedoresView } from "@/components/modules/gestion/proveedores-view";

export const metadata = { title: "Proveedores — Clinicomatic" };

export default async function ProveedoresPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("proveedores")
    .select("id, nombre, cif, contacto, telefono, email, categoria")
    .order("nombre");

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Proveedores" />
      <div className="flex-1 p-4 md:p-6">
        <ProveedoresView rows={data ?? []} />
      </div>
    </div>
  );
}
