"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, SlidersHorizontal, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatFecha, iniciales } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type Paciente = Pick<
  Database["public"]["Tables"]["patients"]["Row"],
  "id" | "nombre" | "apellidos" | "telefono" | "email" | "fecha_nacimiento" | "sexo" | "created_at" | "origen"
>;

interface PacientesListaProps {
  pacientes: Paciente[];
}

export function PacientesLista({ pacientes }: PacientesListaProps) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return pacientes;
    const q = busqueda.toLowerCase();
    return pacientes.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.apellidos.toLowerCase().includes(q) ||
        p.telefono.includes(q) ||
        (p.email ?? "").toLowerCase().includes(q)
    );
  }, [pacientes, busqueda]);

  return (
    <div className="space-y-4 max-w-[1200px] mx-auto">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tinta-suave)]" />
          <Input
            placeholder="Buscar por nombre, teléfono…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <SlidersHorizontal size={14} strokeWidth={1.75} />
          Filtrar
        </Button>
        <div className="flex-1" />
        <Link href="/pacientes/nueva">
          <Button size="sm" className="gap-1.5">
            <Plus size={14} strokeWidth={2} />
            Nueva paciente
          </Button>
        </Link>
      </div>

      {/* Contador */}
      <p className="text-xs font-semibold text-[var(--tinta-suave)]">
        {filtrados.length} paciente{filtrados.length !== 1 ? "s" : ""}
        {busqueda && ` · búsqueda: "${busqueda}"`}
      </p>

      {/* Tabla */}
      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--salvia-tint)] mb-4">
            <User size={28} strokeWidth={1.5} className="text-[var(--salvia)]" />
          </div>
          <h3 className="font-display text-lg font-semibold text-[var(--tinta)]">
            {busqueda ? "Sin resultados" : "Aún no hay pacientes"}
          </h3>
          <p className="mt-1 text-sm text-[var(--tinta-suave)] max-w-xs">
            {busqueda
              ? `No encontramos coincidencias para "${busqueda}". Prueba con otro término.`
              : "Empieza añadiendo tu primera paciente."}
          </p>
          {!busqueda && (
            <Link href="/pacientes/nueva" className="mt-4">
              <Button size="sm">Añadir primera paciente</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-[16px] border border-[var(--lino)] bg-[var(--blanco-calido)] overflow-hidden shadow-[var(--shadow-card)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--lino)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--tinta-suave)]">
                  Paciente
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--tinta-suave)]">
                  Contacto
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--tinta-suave)]">
                  Origen
                </th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--tinta-suave)]">
                  Alta
                </th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p, i) => (
                <tr
                  key={p.id}
                  className={`group transition-colors hover:bg-[var(--arena)] ${
                    i < filtrados.length - 1 ? "border-b border-[var(--lino)]" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <Link href={`/pacientes/${p.id}`} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className={i % 2 === 0 ? "" : "bg-[var(--salvia-tint)] text-[var(--oliva)]"}>
                          {iniciales(p.nombre, p.apellidos)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-[var(--tinta)] group-hover:text-[var(--oliva-oscuro)]">
                          {p.apellidos}, {p.nombre}
                        </p>
                        {p.fecha_nacimiento && (
                          <p className="text-xs text-[var(--tinta-suave)]">
                            {formatFecha(p.fecha_nacimiento)}
                          </p>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3">
                    <p className="text-sm text-[var(--tinta)] tabular-nums">{p.telefono}</p>
                    {p.email && (
                      <p className="text-xs text-[var(--tinta-suave)] truncate max-w-[200px]">{p.email}</p>
                    )}
                  </td>
                  <td className="hidden lg:table-cell px-4 py-3">
                    {p.origen && (
                      <Badge variant="muted" className="capitalize">
                        {p.origen}
                      </Badge>
                    )}
                  </td>
                  <td className="hidden lg:table-cell px-4 py-3 text-sm text-[var(--tinta-suave)] tabular-nums">
                    {formatFecha(p.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
