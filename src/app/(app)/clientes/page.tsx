import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { ClientesLista } from "@/components/modules/clientes/clientes-lista";

export const metadata = { title: "Clientes — Veteriblandenguer" };

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nombre, apellidos, telefono, email, created_at, mascotas(id, nombre, especie)")
    .is("deleted_at", null)
    .order("apellidos");

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Clientes" />
      <div className="flex-1 p-4 md:p-6">
        <ClientesLista clientes={clientes ?? []} />
      </div>
    </div>
  );
}
