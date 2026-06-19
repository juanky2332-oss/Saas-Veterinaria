"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Plus, Trash2, Power, AlertTriangle } from "lucide-react";
import { generarApiKey, revocarApiKey, eliminarApiKey } from "@/app/actions/api-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CopyField } from "@/components/configuracion/copy-field";
import { toast } from "sonner";

export interface ApiKeyRow {
  id: string;
  nombre: string;
  scopes: string[];
  activo: boolean;
  ultima_uso_at: string | null;
  created_at: string;
}

const SCOPES = [
  { id: "patients:read", label: "Pacientes · lectura" },
  { id: "appointments:read", label: "Citas · lectura" },
  { id: "appointments:write", label: "Citas · crear" },
  { id: "*", label: "Acceso total" },
];

export function ApiClient({ keys }: { keys: ApiKeyRow[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [scopes, setScopes] = useState<string[]>(["patients:read"]);
  const [nuevaKey, setNuevaKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleScope(id: string) {
    setScopes((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function crear() {
    startTransition(async () => {
      const res = await generarApiKey(nombre, scopes);
      if (res.error) { toast.error(res.error); return; }
      setNuevaKey(res.key ?? null);
      setNombre("");
      router.refresh();
    });
  }

  function toggleActiva(k: ApiKeyRow) {
    startTransition(async () => {
      const res = await revocarApiKey(k.id, !k.activo);
      if (res.error) { toast.error(res.error); return; }
      toast.success(k.activo ? "Clave desactivada" : "Clave reactivada");
      router.refresh();
    });
  }

  function eliminar(k: ApiKeyRow) {
    startTransition(async () => {
      const res = await eliminarApiKey(k.id);
      if (res.error) { toast.error(res.error); return; }
      toast.success("Clave eliminada");
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--text-soft)]">{keys.length} clave{keys.length !== 1 ? "s" : ""}</p>
        <Button size="sm" className="gap-1.5" onClick={() => { setNuevaKey(null); setDialogOpen(true); }}>
          <Plus size={14} /> Nueva clave
        </Button>
      </div>

      {keys.length === 0 ? (
        <div className="flex flex-col items-center rounded-[16px] border border-dashed border-[var(--border)] py-12 text-center">
          <KeyRound size={24} className="mb-2 text-[var(--text-soft)]" />
          <p className="font-display text-sm font-semibold text-[var(--text)]">Sin claves todavía</p>
          <p className="mt-1 max-w-xs text-xs text-[var(--text-soft)]">
            Crea una clave para conectar tu web, tu CRM externo o cualquier otra aplicación.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[11px] font-bold uppercase tracking-wide text-[var(--text-soft)]">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Permisos</th>
                <th className="px-4 py-3">Último uso</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {keys.map((k) => (
                <tr key={k.id} className="group">
                  <td className="px-4 py-3 font-semibold text-[var(--text)]">{k.nombre}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {k.scopes.map((s) => (
                        <Badge key={s} variant={s === "*" ? "terracota" : "muted"} className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-soft)]">
                    {k.ultima_uso_at ? new Date(k.ultima_uso_at).toLocaleString("es-ES") : "Nunca"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={k.activo ? "exito" : "muted"}>{k.activo ? "Activa" : "Revocada"}</Badge>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => toggleActiva(k)} disabled={isPending} title={k.activo ? "Revocar" : "Reactivar"}
                        className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-soft)] hover:bg-[var(--aviso-tint)] hover:text-[var(--aviso)]">
                        <Power size={14} />
                      </button>
                      <button onClick={() => eliminar(k)} disabled={isPending} title="Eliminar"
                        className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-soft)] hover:bg-[var(--error-tint)] hover:text-[var(--error)]">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setNuevaKey(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{nuevaKey ? "Tu nueva clave" : "Nueva API key"}</DialogTitle>
          </DialogHeader>
          {nuevaKey ? (
            <div className="space-y-3 pt-1">
              <p className="flex items-start gap-2 rounded-[10px] bg-[var(--aviso-tint)] px-3 py-2.5 text-xs font-semibold text-[var(--aviso)]">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                Cópiala ahora: por seguridad no volverá a mostrarse.
              </p>
              <CopyField value={nuevaKey} />
              <DialogFooter>
                <Button onClick={() => { setDialogOpen(false); setNuevaKey(null); }}>Hecho</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Web de la clínica" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Permisos</Label>
                <div className="space-y-1.5">
                  {SCOPES.map((s) => (
                    <label key={s.id} className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-2)]">
                      <input type="checkbox" checked={scopes.includes(s.id)} onChange={() => toggleScope(s.id)} className="h-4 w-4 accent-[var(--brand)]" />
                      <span className="flex-1 text-[var(--text)]">{s.label}</span>
                      <code className="text-[10px] text-[var(--text-soft)]">{s.id}</code>
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={crear} disabled={isPending}>{isPending ? "Generando…" : "Generar clave"}</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
