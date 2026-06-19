import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { PacientesLista } from "@/components/modules/pacientes/pacientes-lista";

export const metadata = { title: "Pacientes — Clinicomatic" };

export default async function PacientesPage() {
  const supabase = await createClient();
  const { data: pacientes } = await supabase
    .from("patients")
    .select("id, nombre, apellidos, telefono, email, fecha_nacimiento, sexo, created_at, origen")
    .is("deleted_at", null)
    .order("apellidos");

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Pacientes" />
      <div className="flex-1 p-4 md:p-6">
        <PacientesLista pacientes={pacientes ?? []} />
      </div>
    </div>
  );
}
