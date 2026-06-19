"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { invitarMiembro, cambiarRol, toggleActivoMiembro } from "@/app/actions/equipo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Miembro = { id: string; nombre: string; rol: string; activo: boolean };

const ROLES_ASIGNABLES = ["admin", "profesional", "recepcion", "contable"];
const ROL_LABEL: Record<string, string> = {
  owner: "Propietario", admin: "Administrador", profesional: "Profesional", recepcion: "Recepción", contable: "Contable",
};

export function EquipoClient({ miembros }: { miembros: Miembro[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("recepcion");
  const [loading, setLoading] = useState(false);

  async function invitar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await invitarMiembro(email, nombre, rol);
    setLoading(false);
    if (res.error) return toast.error(res.error);
    toast.success("Invitación enviada");
    setEmail(""); setNombre("");
    router.refresh();
  }

  async function onRol(userId: string, nuevo: string) {
    const res = await cambiarRol(userId, nuevo);
    if (res.error) return toast.error(res.error);
    toast.success("Rol actualizado");
    router.refresh();
  }

  async function onActivo(userId: string, activo: boolean) {
    const res = await toggleActivoMiembro(userId, activo);
    if (res.error) return toast.error(res.error);
    router.refresh();
  }

  const selectCls = "rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]";

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[12.5px] font-semibold uppercase tracking-wide text-[var(--text-soft)]">
              <th className="px-5 py-3">Miembro</th>
              <th className="px-5 py-3">Rol</th>
              <th className="px-5 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {miembros.map((m) => (
              <tr key={m.id}>
                <td className="px-5 py-3 font-medium text-[var(--text)]">{m.nombre}</td>
                <td className="px-5 py-3">
                  {m.rol === "owner" ? (
                    <Badge variant="oliva">Propietario</Badge>
                  ) : (
                    <select className={selectCls} value={m.rol} onChange={(e) => onRol(m.id, e.target.value)}>
                      {ROLES_ASIGNABLES.map((r) => (
                        <option key={r} value={r}>{ROL_LABEL[r]}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-5 py-3">
                  {m.rol === "owner" ? (
                    <span className="text-xs text-[var(--text-soft)]">—</span>
                  ) : (
                    <button onClick={() => onActivo(m.id, !m.activo)} className="text-sm font-medium text-[var(--brand)] hover:underline">
                      {m.activo ? "Activo" : "Inactivo"} · cambiar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={invitar} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="mb-4 flex items-center gap-2 font-display font-semibold text-[var(--text)]">
          <UserPlus size={18} className="text-[var(--brand)]" /> Invitar a un miembro
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="i-email">Email</Label>
            <Input id="i-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="persona@clinica.com" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="i-nombre">Nombre</Label>
            <Input id="i-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="i-rol">Rol</Label>
            <select id="i-rol" className={`${selectCls} w-full`} value={rol} onChange={(e) => setRol(e.target.value)}>
              {ROLES_ASIGNABLES.map((r) => (
                <option key={r} value={r}>{ROL_LABEL[r]}</option>
              ))}
            </select>
          </div>
        </div>
        <Button type="submit" className="mt-4" disabled={loading}>
          {loading ? "Invitando…" : "Enviar invitación"}
        </Button>
      </form>
    </div>
  );
}
