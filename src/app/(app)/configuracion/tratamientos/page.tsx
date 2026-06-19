import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { TratamientosCatalogo } from "@/components/modules/tratamientos/tratamientos-catalogo";

export const metadata = { title: "Catálogo de tratamientos — Clinicomatic" };

export default async function TratamientosPage() {
  const supabase = await createClient();
  const { data: tratamientos } = await supabase
    .from("treatments")
    .select("*")
    .order("categoria")
    .order("nombre");

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Catálogo de tratamientos" />
      <div className="flex-1 p-4 md:p-6">
        <TratamientosCatalogo tratamientos={tratamientos ?? []} />
      </div>
    </div>
  );
}
