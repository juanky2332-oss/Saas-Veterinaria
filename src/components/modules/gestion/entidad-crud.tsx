"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface CampoCrud {
  name: string;
  label: string;
  type?: "text" | "number" | "email" | "date" | "select" | "textarea";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  ancho?: "full" | "half";
}

export interface ColumnaCrud<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  alinear?: "left" | "right";
}

interface Props<T extends { id: string }> {
  titulo: string;
  descripcion?: string;
  addLabel?: string;
  rows: T[];
  campos: CampoCrud[];
  columnas: ColumnaCrud<T>[];
  crear: (form: FormData) => Promise<{ error?: string }>;
  eliminar?: (id: string) => Promise<{ error?: string }>;
  vacioTexto?: string;
}

export function EntidadCrud<T extends { id: string }>({
  titulo,
  descripcion,
  addLabel = "Añadir",
  rows,
  campos,
  columnas,
  crear,
  eliminar,
  vacioTexto = "Aún no hay registros.",
}: Props<T>) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await crear(fd);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${titulo}: registro creado.`);
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  }

  function borrar(id: string) {
    if (!eliminar) return;
    if (typeof window !== "undefined" && !window.confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) return;
    startTransition(async () => {
      const res = await eliminar(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Registro eliminado.");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text)]">{titulo}</h1>
          {descripcion && <p className="mt-1 text-sm text-[var(--text-soft)]">{descripcion}</p>}
        </div>
        <Button className="gap-1.5" onClick={() => setOpen((o) => !o)}>
          {open ? <X size={15} /> : <Plus size={15} />} {open ? "Cerrar" : addLabel}
        </Button>
      </div>

      {open && (
        <form
          ref={formRef}
          onSubmit={onSubmit}
          className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {campos.map((c) => (
              <div key={c.name} className={cn(c.ancho === "full" && "sm:col-span-2")}>
                <label className="mb-1 block text-xs font-semibold text-[var(--text-soft)]">
                  {c.label}{c.required && " *"}
                </label>
                {c.type === "select" ? (
                  <select
                    name={c.name}
                    required={c.required}
                    defaultValue=""
                    className="h-10 w-full rounded-[12px] border border-[var(--border)] bg-white px-3 text-sm text-[var(--text)] focus-visible:border-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/20"
                  >
                    <option value="">—</option>
                    {c.options?.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : c.type === "textarea" ? (
                  <textarea
                    name={c.name}
                    required={c.required}
                    placeholder={c.placeholder}
                    rows={2}
                    className="w-full rounded-[12px] border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus-visible:border-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/20"
                  />
                ) : (
                  <Input
                    name={c.name}
                    type={c.type ?? "text"}
                    required={c.required}
                    placeholder={c.placeholder}
                    inputMode={c.type === "number" ? "decimal" : undefined}
                    step={c.type === "number" ? "any" : undefined}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar"}</Button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-[var(--text-soft)]">{vacioTexto}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-soft)]">
                {columnas.map((col) => (
                  <th key={col.key} className={cn("px-4 py-3 font-semibold", col.alinear === "right" && "text-right")}>
                    {col.label}
                  </th>
                ))}
                {eliminar && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--border)]/60 last:border-0 hover:bg-[var(--surface-2)]/40">
                  {columnas.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-[var(--text)]", col.alinear === "right" && "text-right tabular-nums")}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "—")}
                    </td>
                  ))}
                  {eliminar && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => borrar(row.id)}
                        disabled={pending}
                        className="text-[var(--text-soft)] transition-colors hover:text-[var(--error)]"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
