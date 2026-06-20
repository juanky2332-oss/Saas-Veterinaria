"use client";

import { useState } from "react";
import Link from "next/link";
import { PawPrint, Search, Plus, Dog, Cat, Bird, Rabbit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

type Mascota = {
  id: string;
  nombre: string;
  especie: string;
  raza: string | null;
  sexo: string | null;
  peso_kg: number | null;
  esterilizado: boolean;
  cliente_id: string | null;
  clientes: { nombre: string; apellidos: string | null } | null;
  created_at: string;
};

interface Props {
  mascotas: Mascota[];
}

function EspecieIcon({ especie }: { especie: string }) {
  if (especie === "perro") return <Dog className="size-4 text-amber-600" />;
  if (especie === "gato")  return <Cat className="size-4 text-purple-600" />;
  if (especie === "ave")   return <Bird className="size-4 text-sky-600" />;
  if (especie === "conejo")return <Rabbit className="size-4 text-pink-600" />;
  return <PawPrint className="size-4 text-[var(--brand)]" />;
}

const ESPECIE_LABEL: Record<string, string> = {
  perro: "Perro", gato: "Gato", conejo: "Conejo", ave: "Ave",
  reptil: "Reptil", roedor: "Roedor", pez: "Pez", otro: "Otro",
};

export function MascotasLista({ mascotas }: Props) {
  const [q, setQ] = useState("");

  const filtradas = mascotas.filter((m) => {
    const texto = `${m.nombre} ${m.raza ?? ""} ${m.clientes?.nombre ?? ""}`.toLowerCase();
    return texto.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-soft)]" />
          <Input
            placeholder="Buscar por nombre, raza o propietario…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link href="/mascotas/nueva">
            <Plus className="size-4 mr-1" /> Nueva mascota
          </Link>
        </Button>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title={q ? "Sin resultados" : "Aún no hay mascotas"}
          description={q ? "Prueba con otro nombre o raza." : "Registra la primera mascota de tu clínica."}
          action={!q ? <Button asChild><Link href="/mascotas/nueva"><Plus className="size-4 mr-1" /> Añadir mascota</Link></Button> : undefined}
        />
      ) : (
        <div className="grid gap-2">
          {filtradas.map((m) => (
            <Link
              key={m.id}
              href={`/mascotas/${m.id}`}
              className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:bg-[var(--brand-tint)] transition-colors"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-[var(--brand-tint)]">
                <EspecieIcon especie={m.especie} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{m.nombre}</p>
                <p className="text-xs text-[var(--text-soft)] truncate">
                  {ESPECIE_LABEL[m.especie] ?? m.especie}
                  {m.raza ? ` · ${m.raza}` : ""}
                  {m.clientes ? ` · ${m.clientes.nombre}${m.clientes.apellidos ? ` ${m.clientes.apellidos}` : ""}` : ""}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {m.esterilizado && (
                  <Badge variant="muted" className="text-xs">Esterilizado</Badge>
                )}
                {m.peso_kg && (
                  <span className="text-xs text-[var(--text-soft)]">{m.peso_kg} kg</span>
                )}
                {m.sexo && (
                  <Badge variant="default" className="text-xs capitalize">{m.sexo}</Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
