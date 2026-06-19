"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Bot, BookOpen, CheckCircle2, Eye } from "lucide-react";
import { guardarIntegracionWhatsapp } from "@/app/actions/whatsapp";
import { buildAgenteContexto, TONOS, FUNCIONES_AGENTE, type AgenteConfig } from "@/lib/whatsapp/agente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CopyField } from "@/components/configuracion/copy-field";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Inicial {
  conectado: boolean;
  activo: boolean;
  phone_number_id: string;
  waba_id: string;
  display_phone: string;
  tieneToken: boolean;
  tieneSecret: boolean;
  agente: AgenteConfig;
}

export function WhatsappConfigClient({ inicial, webhookUrl, verifyToken }: {
  inicial: Inicial;
  webhookUrl: string;
  verifyToken: string;
}) {
  const router = useRouter();
  const [phoneNumberId, setPhoneNumberId] = useState(inicial.phone_number_id);
  const [wabaId, setWabaId] = useState(inicial.waba_id);
  const [displayPhone, setDisplayPhone] = useState(inicial.display_phone);
  const [token, setToken] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [activo, setActivo] = useState(inicial.activo);
  const [agente, setAgente] = useState<AgenteConfig>(inicial.agente);
  const [verPrompt, setVerPrompt] = useState(false);
  const [isPending, startTransition] = useTransition();

  const promptPreview = useMemo(() => buildAgenteContexto("tu clínica", agente), [agente]);

  function toggleFuncion(id: string) {
    setAgente((a) => ({
      ...a,
      funciones: a.funciones.includes(id) ? a.funciones.filter((f) => f !== id) : [...a.funciones, id],
    }));
  }

  function guardar() {
    if (!phoneNumberId.trim()) { toast.error("Indica el Phone Number ID de tu número."); return; }
    startTransition(async () => {
      const res = await guardarIntegracionWhatsapp({
        phone_number_id: phoneNumberId,
        token,
        app_secret: appSecret,
        waba_id: wabaId,
        display_phone: displayPhone,
        activo,
        agente,
      });
      if (res.error) { toast.error(res.error); return; }
      toast.success("WhatsApp configurado para tu clínica");
      setToken("");
      setAppSecret("");
      router.refresh();
    });
  }

  const inputCls = "h-10 w-full rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--brand)]";

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text)]">WhatsApp</h1>
          <p className="mt-1 text-sm text-[var(--text-soft)]">Conecta el número de tu clínica y configura tu agente IA.</p>
        </div>
        <div className="flex-1" />
        {inicial.conectado ? (
          <Badge variant="exito" className="gap-1"><CheckCircle2 size={11} /> Conectado</Badge>
        ) : (
          <Badge variant="aviso">Sin conectar</Badge>
        )}
      </div>

      {/* ── Conexión ── */}
      <section className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="flex items-center gap-2 font-display font-semibold text-[var(--text)]">
          <MessageCircle size={18} className="text-[var(--brand)]" /> Conexión con WhatsApp Cloud API
        </h2>
        <p className="mt-1 mb-4 text-sm text-[var(--text-soft)]">
          Datos de tu número en Meta. Sigue la guía de abajo si aún no los tienes.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Phone Number ID *</Label>
            <Input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="1065xxxxxxxxxxx" />
          </div>
          <div className="space-y-1.5">
            <Label>Número visible</Label>
            <Input value={displayPhone} onChange={(e) => setDisplayPhone(e.target.value)} placeholder="+34 600 000 000" />
          </div>
          <div className="space-y-1.5">
            <Label>WABA ID (opcional)</Label>
            <Input value={wabaId} onChange={(e) => setWabaId(e.target.value)} placeholder="1023xxxxxxxxxxx" />
          </div>
          <div className="space-y-1.5">
            <Label>Token permanente {inicial.tieneToken && <span className="text-[var(--exito)]">· guardado</span>}</Label>
            <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder={inicial.tieneToken ? "•••••••• (dejar vacío para mantener)" : "EAAG…"} />
          </div>
          <div className="space-y-1.5">
            <Label>App Secret {inicial.tieneSecret && <span className="text-[var(--exito)]">· guardado</span>}</Label>
            <Input type="password" value={appSecret} onChange={(e) => setAppSecret(e.target.value)} placeholder={inicial.tieneSecret ? "•••••••• (dejar vacío para mantener)" : "Secreto de tu app de Meta"} />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--text)]">
              <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
              Integración activa
            </label>
          </div>
        </div>

        <div className="mt-5 space-y-3 rounded-[12px] bg-[var(--surface-2)] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-soft)]">Webhook para Meta</p>
          <div className="space-y-2">
            <p className="text-xs text-[var(--text-soft)]">URL de callback</p>
            <CopyField value={webhookUrl} />
            <p className="text-xs text-[var(--text-soft)]">Verify token</p>
            <CopyField value={verifyToken} />
          </div>
        </div>
      </section>

      {/* ── Agente IA ── */}
      <section className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display font-semibold text-[var(--text)]">
            <Bot size={18} className="text-[var(--brand)]" /> Agente IA
          </h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <input
              type="checkbox"
              checked={agente.activo}
              onChange={(e) => setAgente((a) => ({ ...a, activo: e.target.checked }))}
              className="h-4 w-4 accent-[var(--brand)]"
            />
            Responder automáticamente
          </label>
        </div>
        <p className="mt-1 mb-4 text-sm text-[var(--text-soft)]">
          Un prompt base común se adapta a tu clínica con el tono, funciones e instrucciones que elijas.
        </p>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Tono</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {TONOS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setAgente((a) => ({ ...a, tono: t.id }))}
                  className={cn(
                    "rounded-[11px] border px-3 py-2.5 text-left text-sm font-semibold transition-all",
                    agente.tono === t.id
                      ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-strong)]"
                      : "border-[var(--border)] text-[var(--text-soft)] hover:bg-[var(--surface-2)]",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Funciones del agente</Label>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {FUNCIONES_AGENTE.map((f) => (
                <label key={f.id} className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--text)] transition-colors hover:bg-[var(--surface-2)]">
                  <input
                    type="checkbox"
                    checked={agente.funciones.includes(f.id)}
                    onChange={() => toggleFuncion(f.id)}
                    className="h-4 w-4 accent-[var(--brand)]"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Horario de la clínica</Label>
              <input value={agente.horario} onChange={(e) => setAgente((a) => ({ ...a, horario: e.target.value }))} placeholder="L-V 9:00-20:00, S 9:00-14:00" className={inputCls} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Instrucciones específicas de tu clínica</Label>
            <textarea
              value={agente.instrucciones}
              onChange={(e) => setAgente((a) => ({ ...a, instrucciones: e.target.value }))}
              rows={4}
              placeholder="Ej.: La primera consulta es gratuita. Estamos en Calle Mayor 1, con parking. Los blanqueamientos cuestan desde 250€…"
              className="w-full resize-none rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
            />
          </div>

          <button onClick={() => setVerPrompt((v) => !v)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)] hover:underline">
            <Eye size={13} /> {verPrompt ? "Ocultar" : "Ver"} el prompt que usará tu agente
          </button>
          {verPrompt && (
            <p className="whitespace-pre-wrap rounded-[12px] bg-[var(--surface-2)] p-4 text-xs leading-relaxed text-[var(--text-soft)]">
              {promptPreview}
            </p>
          )}
        </div>
      </section>

      <Button size="lg" onClick={guardar} disabled={isPending}>
        {isPending ? "Guardando…" : "Guardar configuración"}
      </Button>

      {/* ── Guía Meta ── */}
      <section className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="flex items-center gap-2 font-display font-semibold text-[var(--text)]">
          <BookOpen size={18} className="text-[var(--brand)]" /> Cómo conectar tu número (guía Meta)
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-[var(--text-soft)]">
          <li>
            Entra en <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="font-semibold text-[var(--brand)] hover:underline">developers.facebook.com</a> con la cuenta de tu negocio y crea una <strong>App</strong> de tipo <strong>Business</strong> (gratis).
          </li>
          <li>
            En el panel de la app, añade el producto <strong>WhatsApp</strong>. Meta te creará una cuenta de WhatsApp Business (WABA) con un número de prueba.
          </li>
          <li>
            En <strong>WhatsApp → API Setup</strong>, añade y verifica el <strong>número real de tu clínica</strong> (debe poder recibir SMS/llamada y no estar activo en la app normal de WhatsApp).
          </li>
          <li>
            Copia el <strong>Phone Number ID</strong> (aparece bajo el número) y pégalo arriba.
          </li>
          <li>
            Genera un <strong>token permanente</strong>: en <a href="https://business.facebook.com/settings" target="_blank" rel="noreferrer" className="font-semibold text-[var(--brand)] hover:underline">Business Settings</a> → Usuarios → <strong>System Users</strong>, crea uno (rol admin), asígnale tu app y tu WABA, y genera un token con los permisos <code className="rounded bg-[var(--surface-2)] px-1">whatsapp_business_messaging</code> y <code className="rounded bg-[var(--surface-2)] px-1">whatsapp_business_management</code>. Pégalo arriba.
          </li>
          <li>
            Copia el <strong>App Secret</strong> de tu app (App Settings → Basic) y pégalo arriba: sirve para verificar que los mensajes vienen de Meta.
          </li>
          <li>
            Configura el <strong>webhook</strong> de WhatsApp en tu app: pega la <strong>URL de callback</strong> y el <strong>verify token</strong> de arriba, y suscríbete al campo <strong>messages</strong>.
          </li>
          <li>
            Guarda esta configuración y envía un WhatsApp a tu número: aparecerá en tu bandeja y, si el agente está activo, responderá solo. Para enviar mensajes fuera de la ventana de 24h necesitarás <strong>plantillas aprobadas</strong> por Meta.
          </li>
        </ol>
        <p className="mt-4 rounded-[10px] bg-[var(--info-tint)] px-3 py-2.5 text-xs text-[var(--info)]">
          Cada clínica conecta su propio número y credenciales: tus conversaciones y tu agente son solo tuyos.
        </p>
      </section>
    </div>
  );
}
