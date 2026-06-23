import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { MutuasView } from "@/components/modules/gestion/mutuas-view";

export const metadata = { title: "Mutuas — VetClinic" };

export default async function MutuasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mutuas")
    .select("id, nombre, cif, telefono, email, descuento_pct")
    .order("nombre");

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Mutuas" />
      <div className="flex-1 p-4 md:p-6">
        <MutuasView rows={data ?? []} />
      </div>
    </div>
  );
}
