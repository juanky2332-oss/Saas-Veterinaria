"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPulse, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { guardarDatosMedicos } from "@/app/actions/pacientes";
import { toast } from "sonner";
import type { Database } from "@/lib/database.types";

type Paciente = Database["public"]["Tables"]["patients"]["Row"];

interface Props {
  paciente: Paciente;
  /** Si la clínica tiene activada la sección de mutua. */
  conMutua: boolean;
}

const GRUPOS = ["0-", "0+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

export function TabDatosMedicos({ paciente, conMutua }: Props) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [f, setF] = useState({
    antecedentes: paciente.antecedentes ?? "",
    alergias: paciente.alergias ?? "",
    medicacion: paciente.medicacion ?? "",
    grupo_sanguineo: paciente.grupo_sanguineo ?? "",
    profesion: paciente.profesion ?? "",
    mutua: paciente.mutua ?? "",
    num_poliza: paciente.num_poliza ?? "",
  });

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((s) => ({ ...s, [k]: v }));
  }

  async function guardar() {
    setGuardando(true);
    const res = await guardarDatosMedicos(paciente.id, {
      antecedentes: f.antecedentes,
      alergias: f.alergias,
      medicacion: f.medicacion,
      grupo_sanguineo: f.grupo_sanguineo,
      profesion: f.profesion,
      mutua: f.mutua,
      num_poliza: f.num_poliza,
    });
    setGuardando(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Datos médicos guardados.");
    router.refresh();
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HeartPulse size={16} strokeWidth={1.9} className="text-[var(--oliva)]" />
            <CardTitle>Historia clínica</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Campo label="Antecedentes / patologías" hint="Enfermedades previas, cirugías, condiciones crónicas…">
            <textarea
              value={f.antecedentes}
              onChange={(e) => set("antecedentes", e.target.value)}
              rows={3}
              placeholder="Sin antecedentes relevantes registrados."
              className="w-full rounded-[12px] border border-[var(--lino)] bg-white px-3 py-2 text-sm text-[var(--tinta)] placeholder:text-[var(--tinta-suave)] focus-visible:border-[var(--oliva)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(117,128,107,.25)]"
            />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Alergias" hint="Se destaca en la cabecera de la ficha.">
              <Input value={f.alergias} onChange={(e) => set("alergias", e.target.value)} placeholder="p. ej. penicilina, látex…" />
            </Campo>
            <Campo label="Medicación habitual">
              <Input value={f.medicacion} onChange={(e) => set("medicacion", e.target.value)} placeholder="p. ej. anticoagulantes…" />
            </Campo>
            <Campo label="Grupo sanguíneo">
              <select
                value={f.grupo_sanguineo}
                onChange={(e) => set("grupo_sanguineo", e.target.value)}
                className="h-10 w-full rounded-[12px] border border-[var(--lino)] bg-white px-3 text-sm text-[var(--tinta)] focus-visible:border-[var(--oliva)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(117,128,107,.25)]"
              >
                <option value="">—</option>
                {GRUPOS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Profesión">
              <Input value={f.profesion} onChange={(e) => set("profesion", e.target.value)} placeholder="p. ej. docente" />
            </Campo>
          </div>
        </CardContent>
      </Card>

      {conMutua && (
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} strokeWidth={1.9} className="text-[var(--oliva)]" />
              <CardTitle>Mutua / aseguradora</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Entidad">
                <Input value={f.mutua} onChange={(e) => set("mutua", e.target.value)} placeholder="p. ej. Sanitas, Adeslas…" />
              </Campo>
              <Campo label="Nº de póliza">
                <Input value={f.num_poliza} onChange={(e) => set("num_poliza", e.target.value)} placeholder="Número de póliza o tarjeta" />
              </Campo>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="md:col-span-2">
        <Button onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar datos médicos"}
        </Button>
      </div>
    </div>
  );
}

function Campo({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-[var(--tinta-suave)]">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-[var(--tinta-suave)]">{hint}</p>}
    </div>
  );
}
