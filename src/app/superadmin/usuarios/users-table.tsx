"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { setSuperadmin } from "@/app/actions/superadmin";

export interface UserRow {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  is_superadmin: boolean;
  organizacion: string;
  created_at: string;
}

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
const ROL_LABEL: Record<string, string> = { owner: "Propietario", admin: "Administrador", profesional: "Profesional", recepcion: "Recepción", contable: "Contable" };

export function UsersTable({ rows, yo }: { rows: UserRow[]; yo: string }) {
  const [q, setQ] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtradas = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => r.nombre.toLowerCase().includes(term) || r.email.toLowerCase().includes(term) || r.organizacion.toLowerCase().includes(term));
  }, [rows, q]);

  function toggle(u: UserRow) {
    startTransition(async () => {
      const res = await setSuperadmin(u.id, !u.is_superadmin);
      if (res.error) { toast.error(res.error); return; }
      toast.success(u.is_superadmin ? "Permisos de superadmin retirados." : "Usuario promovido a superadmin.");
    });
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email o clínica…"
          className="h-10 w-full rounded-[10px] border border-white/10 bg-white/[0.04] pl-9 pr-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-indigo-400/50"
        />
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-white/10 bg-white/[0.03]">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-white/45">
              <th className="px-4 py-3 font-semibold">Usuario</th>
              <th className="px-4 py-3 font-semibold">Clínica</th>
              <th className="px-4 py-3 font-semibold">Rol</th>
              <th className="px-4 py-3 font-semibold">Alta</th>
              <th className="px-4 py-3 font-semibold text-right">Plataforma</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((u) => (
              <tr key={u.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-white/70">
                      {u.nombre?.charAt(0).toUpperCase() ?? "?"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{u.nombre}{!u.activo && <span className="ml-1.5 text-[11px] text-white/40">(inactivo)</span>}</p>
                      <p className="truncate text-xs text-white/40">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-white/70">{u.organizacion}</td>
                <td className="px-4 py-3 text-white/70">{ROL_LABEL[u.rol] ?? u.rol}</td>
                <td className="px-4 py-3 tabular-nums text-white/55">{fecha(u.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  {u.id === yo ? (
                    <span className="text-xs text-white/40">Tú</span>
                  ) : (
                    <button
                      onClick={() => toggle(u)}
                      disabled={isPending}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40",
                        u.is_superadmin ? "bg-violet-500/15 text-violet-300 hover:bg-violet-500/25" : "bg-white/[0.06] text-white/55 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      {u.is_superadmin ? <><ShieldCheck size={13} /> Superadmin</> : <><ShieldOff size={13} /> Promover</>}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-white/45">Sin resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
