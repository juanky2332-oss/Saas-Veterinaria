"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

type Treatment = { id: string; nombre: string; duracion_min: number; precio_orientativo: number | null };

export function ReservaForm({ slug, treatments }: { slug: string; treatments: Treatment[] }) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", telefono: "", email: "", treatment_id: "", fecha: "", notas: "" });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.nombre || !form.telefono || !form.fecha) {
      setError("Completa nombre, teléfono y fecha.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/public/booking/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          telefono: form.telefono,
          email: form.email || undefined,
          treatment_id: form.treatment_id || undefined,
          inicio: new Date(form.fecha).toISOString(),
          notas: form.notas || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo enviar la reserva.");
        return;
      }
      setDone(true);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--exito-tint)]">
          <CheckCircle2 size={28} className="text-[var(--exito)]" />
        </div>
        <h3 className="font-display text-xl font-bold text-[var(--text)]">¡Reserva recibida!</h3>
        <p className="mt-2 text-sm text-[var(--text-soft)]">La clínica confirmará tu cita en breve. Gracias por confiar en nosotros.</p>
      </div>
    );
  }

  const inputCls = "w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--brand)]";

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text)]">Nombre y apellidos *</label>
        <input className={inputCls} value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Tu nombre" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text)]">Teléfono *</label>
          <input className={inputCls} value={form.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="+34 ..." />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text)]">Email</label>
          <input type="email" className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="opcional" />
        </div>
      </div>
      {treatments.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--text)]">Tratamiento</label>
          <select className={inputCls} value={form.treatment_id} onChange={(e) => set("treatment_id", e.target.value)}>
            <option value="">Sin especificar</option>
            {treatments.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}{t.precio_orientativo ? ` · ${t.precio_orientativo}€` : ""}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text)]">Fecha y hora preferida *</label>
        <input type="datetime-local" className={inputCls} value={form.fecha} onChange={(e) => set("fecha", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--text)]">Comentario</label>
        <textarea className={inputCls} rows={2} value={form.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Opcional" />
      </div>
      {error && <p className="rounded-[10px] bg-[var(--error-tint)] px-3 py-2 text-sm text-[var(--error)]">{error}</p>}
      <button type="submit" disabled={loading} className="w-full rounded-[12px] bg-[var(--brand)] px-5 py-3 font-semibold text-white transition-colors hover:bg-[var(--brand-strong)] disabled:opacity-60">
        {loading ? "Enviando…" : "Solicitar cita"}
      </button>
      <p className="text-center text-[11px] text-[var(--text-soft)]">Tus datos se tratan conforme al RGPD. Reserva gestionada con Clinicomatic.</p>
    </form>
  );
}
