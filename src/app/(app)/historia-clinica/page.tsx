import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const metadata = { title: "Historia clínica — VetClinic" };

const ESTADO_VARIANT: Record<string, "success" | "aviso" | "error" | "muted"> = {
  confirmada: "success",
  completada: "success",
  pendiente:  "aviso",
  cancelada:  "error",
  ausente:    "error",
};

export default async function HistoriaClinicaPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("id, inicio, notas, estado, patients(id, nombre, apellidos), treatments(nombre)")
    .order("inicio", { ascending: false })
    .limit(300);

  const registros = data ?? [];

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Historia clínica" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <p className="text-sm text-[var(--text-soft)]">
            Historial global de visitas de todos los pacientes, ordenado por fecha más reciente.
          </p>

          {registros.length === 0 ? (
            <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-5 py-12 text-center shadow-[var(--shadow-card)]">
              <ClipboardList size={28} className="mx-auto mb-3 text-[var(--brand-soft)]" />
              <p className="text-sm text-[var(--text-soft)]">Aún no hay visitas registradas.</p>
              <p className="text-xs text-[var(--text-soft)] mt-1">Las citas aparecerán aquí a medida que se registren.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-soft)]">
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Paciente</th>
                    <th className="px-4 py-3 font-semibold">Tratamiento / Motivo</th>
                    <th className="px-4 py-3 font-semibold">Notas</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => {
                    const p = r.patients as { id: string; nombre: string; apellidos: string } | null;
                    const t = r.treatments as { nombre: string } | null;
                    const estado = r.estado ?? "pendiente";
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--surface-2)]/40 transition-colors"
                      >
                        <td className="px-4 py-3 tabular-nums text-[var(--text-soft)] whitespace-nowrap">
                          {format(new Date(r.inicio), "d MMM yyyy · HH:mm", { locale: es })}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {p ? (
                            <Link href={`/pacientes/${p.id}`} className="text-[var(--brand)] hover:underline">
                              {p.nombre} {p.apellidos}
                            </Link>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-soft)]">{t?.nombre ?? "—"}</td>
                        <td className="px-4 py-3 text-[var(--text-soft)] max-w-xs truncate">{r.notas ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={ESTADO_VARIANT[estado] ?? "muted"}
                            className="text-xs capitalize"
                          >
                            {estado}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
