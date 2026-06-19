"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { actualizarOrganizacion } from "@/app/actions/superadmin";
import type { PlanKey } from "@/lib/plans";

const PLANES: { key: PlanKey | "trial"; label: string }[] = [
  { key: "trial", label: "Trial" },
  { key: "starter", label: "Starter" },
  { key: "pro", label: "Pro" },
  { key: "clinica", label: "Clínica" },
];
const ESTADOS = ["trialing", "active", "past_due", "canceled"];

export function OrgActions({ id, plan, estado, maxUsuarios }: { id: string; plan: string; estado: string; maxUsuarios: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [p, setP] = useState(plan);
  const [e, setE] = useState(estado);
  const [m, setM] = useState(maxUsuarios);

  const dirty = p !== plan || e !== estado || m !== maxUsuarios;

  function guardar() {
    startTransition(async () => {
      const res = await actualizarOrganizacion(id, {
        plan: p === "trial" ? undefined : (p as PlanKey),
        subscription_status: e,
        max_usuarios: m,
      });
      if (res.error) { toast.error(res.error); return; }
      toast.success("Organización actualizada.");
      router.refresh();
    });
  }

  const sel = "h-10 w-full rounded-[10px] border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none focus:border-indigo-400/50";
  const lbl = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/45";

  return (
    <div className="space-y-3">
      <div>
        <label className={lbl}>Plan</label>
        <select value={p} onChange={(ev) => setP(ev.target.value)} className={sel}>
          {PLANES.map((x) => <option key={x.key} value={x.key} className="bg-[#0f1729]">{x.label}</option>)}
        </select>
      </div>
      <div>
        <label className={lbl}>Estado de suscripción</label>
        <select value={e} onChange={(ev) => setE(ev.target.value)} className={sel}>
          {ESTADOS.map((x) => <option key={x} value={x} className="bg-[#0f1729]">{x}</option>)}
        </select>
      </div>
      <div>
        <label className={lbl}>Máx. usuarios</label>
        <input type="number" min={1} max={500} value={m} onChange={(ev) => setM(Number(ev.target.value))} className={sel} />
      </div>
      <button
        onClick={guardar}
        disabled={!dirty || isPending}
        className="w-full rounded-[10px] bg-indigo-500 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-400 disabled:opacity-40"
      >
        {isPending ? "Guardando…" : "Guardar cambios"}
      </button>
    </div>
  );
}
