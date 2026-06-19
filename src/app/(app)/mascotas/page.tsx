import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { MascotasLista } from "@/components/modules/mascotas/mascotas-lista";

export const metadata = { title: "Mascotas — Veteriblandenguer" };

export default async function MascotasPage() {
  const supabase = await createClient();
  const { data: mascotas } = await supabase
    .from("mascotas")
    .select("id, nombre, especie, raza, sexo, peso_kg, esterilizado, cliente_id, created_at, clientes(nombre, apellidos)")
    .is("deleted_at", null)
    .order("nombre");

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Mascotas" />
      <div className="flex-1 p-4 md:p-6">
        <MascotasLista mascotas={mascotas ?? []} />
      </div>
    </div>
  );
}
