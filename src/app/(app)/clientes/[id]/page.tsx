import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { PawPrint, Phone, Mail, MapPin, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("clientes").select("nombre, apellidos").eq("id", id).maybeSingle();
  return { title: data ? `${data.nombre} ${data.apellidos ?? ""}`.trim() + " — Veteriblandenguer" : "Cliente" };
}

export default async function FichaClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!cliente) notFound();

  const { data: mascotas } = await supabase
    .from("mascotas")
    .select("id, nombre, especie, raza, esterilizado")
    .eq("cliente_id", id)
    .is("deleted_at", null)
    .order("nombre");

  const nombreCompleto = `${cliente.nombre}${cliente.apellidos ? ` ${cliente.apellidos}` : ""}`;

  return (
    <div className="flex flex-col min-h-full">
      <Header title={nombreCompleto} back="/clientes" subtitle="Cliente" />
      <div className="flex-1 p-4 md:p-6 space-y-4 max-w-3xl">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Datos de contacto */}
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">Datos de contacto</h3>
            <dl className="space-y-2">
              {[
                { icon: Phone, label: "Teléfono", value: cliente.telefono },
                { icon: Mail,  label: "Email",    value: cliente.email },
                { icon: MapPin,label: "Dirección", value: cliente.direccion ? `${cliente.direccion}${cliente.ciudad ? `, ${cliente.ciudad}` : ""}` : null },
                { icon: FileText, label: "NIF",   value: cliente.nif },
              ].filter((f) => f.value).map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <Icon className="size-4 text-[var(--text-soft)] shrink-0" />
                  <span className="text-[var(--text-soft)]">{label}:</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </dl>
            {cliente.notas && (
              <p className="text-xs text-[var(--text-soft)] border-t pt-2 mt-2">{cliente.notas}</p>
            )}
          </Card>

          {/* Mascotas */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <PawPrint className="size-4 text-[var(--brand)]" />
                Mascotas ({mascotas?.length ?? 0})
              </h3>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/mascotas/nueva`}>+ Añadir</Link>
              </Button>
            </div>

            {mascotas && mascotas.length > 0 ? (
              <div className="space-y-2">
                {mascotas.map((m) => (
                  <Link
                    key={m.id}
                    href={`/mascotas/${m.id}`}
                    className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2 hover:bg-[var(--brand-tint)] transition-colors"
                  >
                    <PawPrint className="size-4 text-[var(--brand)]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.nombre}</p>
                      <p className="text-xs text-[var(--text-soft)]">
                        {m.especie}{m.raza ? ` · ${m.raza}` : ""}
                        {m.esterilizado ? " · Esterilizado" : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-soft)]">Este cliente aún no tiene mascotas registradas.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
