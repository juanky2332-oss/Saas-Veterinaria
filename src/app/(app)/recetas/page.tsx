import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Pill, Printer, ChevronRight } from "lucide-react";
import { formatFecha } from "@/lib/utils";

export const metadata = { title: "Recetas — VetClinic" };

export default async function RecetasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipes")
    .select("id, fecha, diagnostico, patients(nombre, apellidos), recipe_items(id)")
    .order("fecha", { ascending: false })
    .limit(200);

  const recetas = data ?? [];

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Recetas" />
      <div className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-sm text-[var(--text-soft)]">
            Prescripciones emitidas. Crea recetas desde la ficha del paciente (pestaña Recetas).
          </p>
          {recetas.length === 0 ? (
            <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-5 py-12 text-center shadow-[var(--shadow-card)]">
              <Pill size={26} className="mx-auto mb-2 text-[var(--brand-soft)]" />
              <p className="text-sm text-[var(--text-soft)]">Aún no hay recetas.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-soft)]">
                    <th className="px-4 py-3 font-semibold">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Paciente</th>
                    <th className="px-4 py-3 font-semibold">Diagnóstico</th>
                    <th className="px-4 py-3 font-semibold text-center">Fármacos</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {recetas.map((r) => {
                    const p = r.patients as { nombre: string; apellidos: string } | null;
                    const n = (r.recipe_items as { id: string }[] | null)?.length ?? 0;
                    return (
                      <tr key={r.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--surface-2)]/40">
                        <td className="px-4 py-3 tabular-nums text-[var(--text-soft)]">{formatFecha(r.fecha)}</td>
                        <td className="px-4 py-3 font-medium text-[var(--text)]">{p ? `${p.nombre} ${p.apellidos}` : "—"}</td>
                        <td className="px-4 py-3 text-[var(--text-soft)]">{r.diagnostico ?? "—"}</td>
                        <td className="px-4 py-3 text-center tabular-nums">{n}</td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/recetas/${r.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand)] hover:underline">
                            <Printer size={13} /> Abrir <ChevronRight size={13} />
                          </Link>
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
