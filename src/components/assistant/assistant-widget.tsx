"use client";

import { useRef, useState } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; text: string };

const SUGERENCIAS = [
  "¿Qué citas tengo hoy?",
  "¿Qué tratamientos toca renovar?",
  "¿Hay productos con stock bajo?",
];

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function enviar(texto: string) {
    const q = texto.trim();
    if (!q || loading) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta: q }),
      });
      const data = (await res.json()) as { respuesta?: string; error?: string };
      setMsgs((m) => [...m, { role: "assistant", text: data.respuesta ?? data.error ?? "No he podido responder." }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: "Error de conexión. Inténtalo de nuevo." }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }));
    }
  }

  return (
    <>
      {/* Botón flotante — gradiente de IA (índigoâ†’violeta) con estado */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Asistente IA"
        className={cn(
          "group fixed z-50 bottom-24 right-5 md:bottom-6 md:right-6",
          "flex h-14 w-14 items-center justify-center rounded-[18px] text-white",
          "shadow-[0_14px_30px_-10px_rgba(99,102,241,.65)] transition-all duration-200 hover:scale-105 hover:brightness-[1.05] active:scale-95",
        )}
        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
      >
        {open ? <X size={22} strokeWidth={2} /> : <Sparkles size={22} strokeWidth={2} className="fill-white/90" />}
        {!open && <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[var(--exito)]" />}
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed z-50 bottom-40 right-5 md:bottom-24 md:right-6 w-[min(92vw,380px)]",
          "flex flex-col rounded-[18px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-pop)] overflow-hidden",
          "transition-all duration-300 origin-bottom-right",
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none",
        )}
        style={{ height: "min(70vh, 540px)" }}
      >
        <div className="flex items-center gap-2.5 px-4 py-3.5 text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/15">
            <Sparkles size={17} strokeWidth={2} className="fill-white/80" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">Asistente Veteriblandenguer</p>
            <p className="text-[11px] text-white/70">IA · conoce los datos de tu clínica</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgs.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-soft)]">Hola ðŸ‘‹ Soy tu asistente. Pregúntame sobre tu día:</p>
              <div className="flex flex-col gap-2">
                {SUGERENCIAS.map((s) => (
                  <button key={s} onClick={() => enviar(s)} className="text-left text-sm rounded-[10px] border border-[var(--border)] px-3 py-2 text-[var(--text)] hover:bg-[var(--brand-tint)] hover:border-[var(--brand-soft)] transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-[var(--brand)] text-white rounded-br-sm"
                    : "bg-[var(--surface-2)] text-[var(--text)] rounded-bl-sm",
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-[14px] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--text-soft)]">Pensando…</div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); enviar(input); }}
          className="flex items-center gap-2 border-t border-[var(--border)] p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta…"
            className="flex-1 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
          />
          <button type="submit" disabled={loading || !input.trim()} className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--brand)] text-white disabled:opacity-50">
            <Send size={16} strokeWidth={2} />
          </button>
        </form>
      </div>
    </>
  );
}
