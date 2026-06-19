"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Search, Plus, PawPrint, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

type Cliente = {
  id: string;
  nombre: string;
  apellidos: string | null;
  telefono: string | null;
  email: string | null;
  mascotas?: { id: string; nombre: string; especie: string }[];
  created_at: string;
};

interface Props { clientes: Cliente[] }

export function ClientesLista({ clientes }: Props) {
  const [q, setQ] = useState("");

  const filtrados = clientes.filter((c) => {
    const texto = `${c.nombre} ${c.apellidos ?? ""} ${c.telefono ?? ""} ${c.email ?? ""}`.toLowerCase();
    return texto.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-soft)]" />
          <Input
            placeholder="Buscar cliente por nombre, teléfono…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link href="/clientes/nuevo">
            <Plus className="size-4 mr-1" /> Nuevo cliente
          </Link>
        </Button>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "Sin resultados" : "Aún no hay clientes"}
          description={q ? "Prueba con otro nombre." : "Registra el primer propietario de mascota."}
          action={!q ? { label: "Añadir cliente", href: "/clientes/nuevo" } : undefined}
        />
      ) : (
        <div className="grid gap-2">
          {filtrados.map((c) => (
            <Link
              key={c.id}
              href={`/clientes/${c.id}`}
              className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:bg-[var(--brand-tint)] transition-colors"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-[var(--brand-tint)]">
                <Users className="size-4 text-[var(--brand)]" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {c.nombre}{c.apellidos ? ` ${c.apellidos}` : ""}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  {c.telefono && (
                    <span className="text-xs text-[var(--text-soft)] flex items-center gap-1">
                      <Phone className="size-3" /> {c.telefono}
                    </span>
                  )}
                  {c.email && (
                    <span className="text-xs text-[var(--text-soft)] flex items-center gap-1">
                      <Mail className="size-3" /> {c.email}
                    </span>
                  )}
                </div>
              </div>

              {c.mascotas && c.mascotas.length > 0 && (
                <div className="flex items-center gap-1 shrink-0 text-xs text-[var(--text-soft)]">
                  <PawPrint className="size-3.5" />
                  {c.mascotas.length} mascota{c.mascotas.length > 1 ? "s" : ""}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
