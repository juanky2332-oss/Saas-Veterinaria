"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EstadoBadge } from "../_components/ui";

export interface OrgRow {
  id: string;
  nombre: string;
  slug: string;
  plan: string;
  estado: string;
  vertical: string;
  created_at: string;
  usuarios: number;
  max_usuarios: number;
}

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

const FILTROS: { key: string; label: string; match: (e: string) => boolean }[] = [
  { key: "todas", label: "Todas", match: () => true },
  { key: "active", label: "Activas", match: (e) => e === "active" },
  { key: "trialing", label: "En prueba", match: (e) => e === "trialing" },
  { key: "otras", label: "Inactivas", match: (e) => e !== "active" && e !== "trialing" },
];

export function OrgsTable({ rows }: { rows: OrgRow[] }) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState("todas");

  const filtradas = useMemo(() => {
    const f = FILTROS.find((x) => x.key === filtro)!;
    const term = q.trim().toLowerCase();
    return rows.filter((r) => f.match(r.estado) && (!term || r.nombre.toLowerCase().includes(term) || r.slug.toLowerCase().includes(term)));
  }, [rows, q, filtro]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o slug…"
            className="h-10 w-full rounded-[10px] border border-white/10 bg-white/[0.04] pl-9 pr-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-400/50"
          />
        </div>
        <div className="flex items-center gap-1 rounded-[10px] border border-white/10 bg-white/[0.04] p-1">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={cn("rounded-[7px] px-2.5 py-1.5 text-xs font-semibold transition-colors", filtro === f.key ? "bg-white/15 text-white" : "text-white/55 hover:text-white")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-white/45">
              <th className="px-4 py-3 font-semibold">Clínica</th>
              <th className="px-4 py-3 font-semibold">Especialidad</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Usuarios</th>
              <th className="px-4 py-3 font-semibold">Alta</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((o) => (
              <tr key={o.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <Link href={`/superadmin/organizations/${o.id}`} className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white/[0.06] text-white/55"><Building2 size={15} /></span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{o.nombre}</p>
                      <p className="truncate text-xs text-white/40">/{o.slug}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize text-white/70">{o.vertical}</td>
                <td className="px-4 py-3 text-white/70">{o.plan}</td>
                <td className="px-4 py-3 tabular-nums text-white/70">{o.usuarios}/{o.max_usuarios}</td>
                <td className="px-4 py-3 tabular-nums text-white/55">{fecha(o.created_at)}</td>
                <td className="px-4 py-3"><EstadoBadge estado={o.estado} /></td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-white/45">Sin resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
