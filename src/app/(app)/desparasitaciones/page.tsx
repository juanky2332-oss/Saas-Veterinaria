import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bug, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";

export const metadata = { title: "Desparasitaciones — VetClinic" };

export default async function DesparasitacionesPage() {
  const supabase = await createClient();
  const hoy = new Date();

  const { data } = await supabase
    .from("desparasitaciones_vet")
    .select("id, tipo, producto, fecha_aplicacion, fecha_proxima, notas, mascotas(id, nombre, especie)")
    .order("fecha_proxima", { ascending: true, nullsFirst: false });

  const todas = data ?? [];
  const proximas30 = todas.filter(
    (d) => d.fecha_proxima && isBefore(new Date(d.fecha_proxima + "T00:00:00"), addDays(hoy, 30)),
  );

  function estadoBadge(fecha: string | null) {
    if (!fecha) return <Badge variant="muted" className="text-xs">Sin fecha</Badge>;
    const vencida = isBefore(new Date(fecha + "T00:00:00"), hoy);
    const proxima7 = !vencida && isBefore(new Date(fecha + "T00:00:00"), addDays(hoy, 7));
    return (
      <Badge variant={vencida ? "error" : proxima7 ? "aviso" : "muted"} className="text-xs">
        {vencida && <AlertCircle className="size-3 mr-1 inline" />}
        {format(new Date(fecha + "T00:00:00"), "d MMM yyyy", { locale: es })}
      </Badge>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Desparasitaciones" />
      <div className="flex-1 p-4 md:p-6 space-y-6">
        <p className="text-sm text-[var(--text-soft)] max-w-2xl">
          Seguimiento de tratamientos antiparasitarios. Regístralos desde la ficha de cada mascota.
        </p>

        {proximas30.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-500" />
              Renovaciones en los próximos 30 días ({proximas30.length})
            </h2>
            <div className="space-y-2 max-w-2xl">
              {proximas30.map((d) => {
                const m = d.mascotas as { id: string; nombre: string; especie: string } | null;
                return (
                  <Card key={d.id} className="p-3 flex items-center gap-3">
                    <Bug className="size-4 text-amber-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm capitalize">
                        {d.tipo}{d.producto ? ` · ${d.producto}` : ""}
                      </p>
                      {m && (
                        <Link href={`/mascotas/${m.id}`} className="text-xs text-[var(--brand)] hover:underline">
                          {m.nombre} · {m.especie}
                        </Link>
                      )}
                    </div>
                    {estadoBadge(d.fecha_proxima)}
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Bug className="size-4 text-[var(--brand)]" />
            Historial completo ({todas.length})
          </h2>
          {todas.length === 0 ? (
            <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-5 py-12 text-center shadow-[var(--shadow-card)]">
              <Bug size={28} className="mx-auto mb-3 text-[var(--brand-soft)]" />
              <p className="text-sm text-[var(--text-soft)]">Aún no hay desparasitaciones registradas.</p>
              <p className="text-xs text-[var(--text-soft)] mt-1">
                Regístralas desde la pestaña &ldquo;Desparasitaciones&rdquo; de cada mascota.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-soft)]">
                    <th className="px-4 py-3 font-semibold">Mascota</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Producto</th>
                    <th className="px-4 py-3 font-semibold">Aplicación</th>
                    <th className="px-4 py-3 font-semibold">Próxima</th>
                  </tr>
                </thead>
                <tbody>
                  {todas.map((d) => {
                    const m = d.mascotas as { id: string; nombre: string } | null;
                    return (
                      <tr
                        key={d.id}
                        className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--surface-2)]/40 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          {m ? (
                            <Link href={`/mascotas/${m.id}`} className="text-[var(--brand)] hover:underline">
                              {m.nombre}
                            </Link>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 capitalize text-[var(--text-soft)]">{d.tipo}</td>
                        <td className="px-4 py-3 text-[var(--text-soft)]">{d.producto ?? "—"}</td>
                        <td className="px-4 py-3 tabular-nums text-[var(--text-soft)]">
                          {d.fecha_aplicacion
                            ? format(new Date(d.fecha_aplicacion + "T00:00:00"), "d MMM yyyy", { locale: es })
                            : "—"}
                        </td>
                        <td className="px-4 py-3">{estadoBadge(d.fecha_proxima)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
