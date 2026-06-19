"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PhoneCall, Sparkles, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guardarVoz } from "@/app/actions/voz";
import { VOZ_TONOS, VOCES, normalizarVoz, type VozAgenteConfig } from "@/lib/voz/agente";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  initial: Partial<VozAgenteConfig>;
  retellApiKeySet: boolean;
  twilioNumber: string;
  activo: boolean;
  agentId: string | null;
  modo: "mock" | "live";
}

export function VozConfigClient({ initial, retellApiKeySet, twilioNumber, activo: activoIni, agentId, modo }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const base = normalizarVoz(initial);

  const [activo, setActivo] = useState(activoIni);
  const [apiKey, setApiKey] = useState("");
  const [numero, setNumero] = useState(twilioNumber);
  const [a, setA] = useState<VozAgenteConfig>(base);

  function set<K extends keyof VozAgenteConfig>(k: K, v: VozAgenteConfig[K]) {
    setA((s) => ({ ...s, [k]: v }));
  }

  function guardar() {
    startTransition(async () => {
      const res = await guardarVoz({ retell_api_key: apiKey, twilio_number: numero, activo, agente: a });
      if (res.error) { toast.error(res.error); return; }
      toast.success(`Agente de voz guardado y sincronizado (${res.modo}).`);
      setApiKey("");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {/* Conexión */}
        <section className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center gap-2">
            <PhoneCall size={17} className="text-[var(--brand)]" />
            <h2 className="font-display font-semibold text-[var(--text)]">Conexión (Retell + Twilio)</h2>
          </div>
          {modo === "mock" && (
            <p className="mb-3 rounded-[10px] bg-[var(--aviso-tint)] px-3 py-2 text-xs text-[var(--aviso)]">
              Modo demostración: el agente se simula. Para activarlo de verdad, configura <code>RETELL_MODE=live</code> y la API key de Retell.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>API key de Retell</Label>
              <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={retellApiKeySet ? "•••••••• (guardada)" : "key_..."} />
            </div>
            <div className="space-y-1.5">
              <Label>Número Twilio</Label>
              <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="+34 ..." />
            </div>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
            Agente de voz activo
          </label>
          {agentId && <p className="mt-2 text-[11px] text-[var(--text-soft)]">Agente Retell: <span className="font-mono">{agentId}</span></p>}
        </section>

        {/* Base de conocimiento */}
        <section className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={17} className="text-[var(--brand)]" />
            <h2 className="font-display font-semibold text-[var(--text)]">Base de conocimiento del agente</h2>
          </div>
          <p className="mb-4 text-sm text-[var(--text-soft)]">
            El prompt base ya está escrito. Aquí solo defines lo tuyo: tono, voz, servicios, horario y contexto.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tono</Label>
              <select value={a.tono} onChange={(e) => set("tono", e.target.value as VozAgenteConfig["tono"])} className="h-10 w-full rounded-[12px] border border-[var(--border)] bg-white px-3 text-sm">
                {VOZ_TONOS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Voz</Label>
              <select value={a.voz_id} onChange={(e) => set("voz_id", e.target.value)} className="h-10 w-full rounded-[12px] border border-[var(--border)] bg-white px-3 text-sm">
                {VOCES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Servicios y precios orientativos</Label>
              <textarea value={a.servicios} onChange={(e) => set("servicios", e.target.value)} rows={3} placeholder="p. ej. Limpieza dental 50€, ortodoncia desde 2.000€…" className="w-full rounded-[12px] border border-[var(--border)] bg-white px-3 py-2 text-sm focus-visible:border-[var(--brand)] focus-visible:outline-none" />
            </div>
            <div className="space-y-1.5">
              <Label>Horario</Label>
              <Input value={a.horario} onChange={(e) => set("horario", e.target.value)} placeholder="L-V 9-20h, S 10-14h" />
            </div>
            <div className="space-y-1.5">
              <Label>Contexto de la clínica</Label>
              <textarea value={a.contexto} onChange={(e) => set("contexto", e.target.value)} rows={3} placeholder="Ubicación, parking, cómo llegar, preparación de visitas, política de cancelación…" className="w-full rounded-[12px] border border-[var(--border)] bg-white px-3 py-2 text-sm focus-visible:border-[var(--brand)] focus-visible:outline-none" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={a.puede_agendar} onChange={(e) => set("puede_agendar", e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
              El agente puede ayudar a reservar citas
            </label>
          </div>

          <div className="mt-5">
            <Button className="gap-1.5" disabled={pending} onClick={guardar}>
              <Save size={15} /> {pending ? "Guardando…" : "Guardar y sincronizar agente"}
            </Button>
          </div>
        </section>
      </div>

      {/* Cómo funciona */}
      <aside>
        <div className="sticky top-6 space-y-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h3 className="font-display font-semibold text-[var(--text)]">Cómo funciona</h3>
          <ol className="space-y-2 text-sm text-[var(--text-soft)]">
            <li><b className="text-[var(--text)]">1.</b> Conecta tu cuenta Retell y tu número Twilio.</li>
            <li><b className="text-[var(--text)]">2.</b> Rellena la base de conocimiento (tono, servicios, horario, contexto).</li>
            <li><b className="text-[var(--text)]">3.</b> Al guardar, creamos/actualizamos tu agente en Retell con el prompt base + tu información.</li>
            <li><b className="text-[var(--text)]">4.</b> Las llamadas entran por tu número; al colgar, recibimos la transcripción y el resumen y los verás en <b className="text-[var(--text)]">Agente de voz</b>, vinculados al paciente.</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}
