import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Syringe, Bug, AlertCircle } from "lucide-react";
import Link from "next/link";
import { format, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";

export const metadata = { title: "Vacunaciones — Veteriblandenguer" };

export default async function VacunacionesPage() {
  const supabase = await createClient();
  const hoy = new Date();
  const en30 = addDays(hoy, 30).toISOString().slice(0, 10);

  const [{ data: vacunas }, { data: desparasitaciones }] = await Promise.all([
    supabase
      .from("vacunaciones_vet")
      .select("id, vacuna, fecha_aplicacion, fecha_proxima, mascotas(id, nombre, especie)")
      .lte("fecha_proxima", en30)
      .order("fecha_proxima"),
    supabase
      .from("desparasitaciones_vet")
      .select("id, tipo, producto, fecha_aplicacion, fecha_proxima, mascotas(id, nombre, especie)")
      .lte("fecha_proxima", en30)
      .order("fecha_proxima"),
  ]);

  function estadoBadge(fecha: string | null) {
    if (!fecha) return null;
    const vencida = isBefore(new Date(fecha), hoy);
    const proxima = isBefore(new Date(fecha), addDays(hoy, 7));
    return (
      <Badge variant={vencida ? "error" : proxima ? "aviso" : "muted"} className="text-xs">
        {vencida && <AlertCircle className="size-3 mr-1" />}
        {format(new Date(fecha), "d MMM yyyy", { locale: es })}
      </Badge>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Vacunaciones próximas" />
      <div className="flex-1 p-4 md:p-6 space-y-6">
        <section className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Syringe className="size-4 text-[var(--brand)]" />
            Vacunas con renovación en los próximos 30 días ({vacunas?.length ?? 0})
          </h2>
          {!vacunas?.length ? (
            <p className="text-sm text-[var(--text-soft)]">No hay vacunas pendientes de renovar en los próximos 30 días.</p>
          ) : (
            <div className="space-y-2">
              {vacunas.map((v) => (
                <Card key={v.id} className="p-3 flex items-center gap-3">
                  <Syringe className="size-4 text-[var(--brand)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{v.vacuna}</p>
                    <Link href={`/mascotas/${(v.mascotas as {id:string;nombre:string})?.id}`} className="text-xs text-[var(--brand)] hover:underline">
                      {(v.mascotas as {id:string;nombre:string})?.nombre}
                    </Link>
                  </div>
                  {estadoBadge(v.fecha_proxima)}
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Bug className="size-4 text-amber-600" />
            Desparasitaciones próximas ({desparasitaciones?.length ?? 0})
          </h2>
          {!desparasitaciones?.length ? (
            <p className="text-sm text-[var(--text-soft)]">No hay desparasitaciones pendientes en los próximos 30 días.</p>
          ) : (
            <div className="space-y-2">
              {desparasitaciones.map((d) => (
                <Card key={d.id} className="p-3 flex items-center gap-3">
                  <Bug className="size-4 text-amber-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm capitalize">{d.tipo}{d.producto ? ` · ${d.producto}` : ""}</p>
                    <Link href={`/mascotas/${(d.mascotas as {id:string;nombre:string})?.id}`} className="text-xs text-[var(--brand)] hover:underline">
                      {(d.mascotas as {id:string;nombre:string})?.nombre}
                    </Link>
                  </div>
                  {estadoBadge(d.fecha_proxima)}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
