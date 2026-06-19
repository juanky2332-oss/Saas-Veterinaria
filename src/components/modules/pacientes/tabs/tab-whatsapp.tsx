"use client";

import { useState } from "react";
import { Send, MessageCircle, Bot, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativo } from "@/lib/utils";

interface Mensaje {
  id: string;
  direccion: string;
  tipo: string;
  cuerpo: string | null;
  enviado_por: string;
  creado_at: string;
}

interface Conversacion {
  id: string;
  estado_agente: string;
  ultima_entrada_at: string | null;
  no_leidos: number;
  wa_messages: Mensaje[];
}

interface TabWhatsappProps {
  conversacion: Record<string, unknown> | null;
  telefono: string;
}

export function TabWhatsapp({ conversacion, telefono }: TabWhatsappProps) {
  const [mensaje, setMensaje] = useState("");
  const conv = conversacion as Conversacion | null;

  const ahora = new Date();
  const ventanaAbierta = conv?.ultima_entrada_at
    ? (ahora.getTime() - new Date(conv.ultima_entrada_at).getTime()) < 24 * 60 * 60 * 1000
    : false;

  if (!conv) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--salvia-tint)] mb-4">
          <MessageCircle size={24} strokeWidth={1.5} className="text-[var(--salvia)]" />
        </div>
        <h3 className="font-display text-lg font-semibold text-[var(--tinta)]">Sin conversación vinculada</h3>
        <p className="mt-1.5 text-sm text-[var(--tinta-suave)] max-w-sm">
          El hilo aparece aquí automáticamente cuando esta paciente escribe al número de la clínica por WhatsApp.
          La vinculación es automática por teléfono (<span className="font-semibold text-[var(--tinta)]">{telefono}</span>).
        </p>
        <div className="mt-2 rounded-[10px] bg-[var(--info-tint)] px-4 py-3 text-left max-w-sm">
          <p className="text-xs font-semibold text-[var(--info)] mb-1">¿Ya existe una conversación sin vincular?</p>
          <p className="text-xs text-[var(--tinta-suave)]">
            Ve a la bandeja de WhatsApp, abre el hilo y usa el botón "Vincular a paciente" para asignarlo manualmente.
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" className="gap-1.5">
            <Send size={13} strokeWidth={1.75} />
            Iniciar mensaje
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-[16px] border border-[var(--lino)] bg-[var(--blanco-calido)] shadow-[var(--shadow-card)] overflow-hidden" style={{ height: "500px" }}>
      {/* Header de la conversación */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--lino)] bg-[var(--arena)]">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} strokeWidth={1.75} className="text-[var(--oliva)]" />
          <span className="text-sm font-semibold text-[var(--tinta)]">{telefono}</span>
        </div>
        <div className="flex items-center gap-2">
          {conv.no_leidos > 0 && (
            <Badge variant="terracota">{conv.no_leidos} nuevo{conv.no_leidos !== 1 ? "s" : ""}</Badge>
          )}
          <Badge variant={conv.estado_agente === "humano" ? "error" : conv.estado_agente === "activo" ? "oliva" : "muted"}>
            {conv.estado_agente === "humano" ? "Requiere atención" : conv.estado_agente === "activo" ? "Agente IA activo" : "Pausado"}
          </Badge>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(conv.wa_messages ?? []).map((msg) => (
          <MensajeBurbuja key={msg.id} mensaje={msg} />
        ))}
      </div>

      {/* Ventana 24h banner */}
      {!ventanaAbierta && (
        <div className="px-4 py-2 bg-[var(--aviso-tint)] border-t border-[var(--aviso)]/30">
          <div className="flex items-center gap-2">
            <Clock size={13} strokeWidth={1.75} className="text-[var(--aviso)]" />
            <p className="text-xs font-semibold text-[var(--aviso)]">
              Ventana de 24h cerrada — solo puedes enviar plantillas aprobadas
            </p>
          </div>
        </div>
      )}

      {/* Compositor */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-[var(--lino)]">
        {ventanaAbierta ? (
          <>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe un mensaje…"
              rows={2}
              className="flex-1 resize-none rounded-[12px] border border-[var(--lino)] bg-[var(--arena)] px-3 py-2 text-sm text-[var(--tinta)] placeholder:text-[var(--tinta-suave)] focus:outline-none focus:border-[var(--oliva)] focus:ring-2 focus:ring-[rgba(117,128,107,.25)]"
            />
            <Button size="icon" disabled={!mensaje.trim()} className="shrink-0">
              <Send size={16} strokeWidth={1.75} />
            </Button>
          </>
        ) : (
          <div className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              Seleccionar plantilla HSM
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function MensajeBurbuja({ mensaje }: { mensaje: Mensaje }) {
  const esEntrante = mensaje.direccion === "in";
  const esIA = mensaje.enviado_por === "agente_ia";

  return (
    <div className={`flex ${esEntrante ? "justify-start" : "justify-end"} gap-2`}>
      {esEntrante && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--terracota-tint)] mt-0.5">
          <User size={12} strokeWidth={1.75} className="text-[var(--terracota)]" />
        </div>
      )}
      <div className={`max-w-[75%] space-y-1`}>
        <div
          className={`rounded-[12px] px-3 py-2 text-sm ${
            esEntrante
              ? "bg-[var(--arena)] text-[var(--tinta)]"
              : "bg-[var(--oliva)] text-white"
          }`}
        >
          {mensaje.cuerpo}
        </div>
        <div className={`flex items-center gap-1 ${esEntrante ? "" : "justify-end"}`}>
          {esIA && !esEntrante && (
            <div className="flex items-center gap-0.5">
              <Bot size={10} strokeWidth={1.75} className="text-[var(--tinta-suave)]" />
              <span className="text-[10px] text-[var(--tinta-suave)]">Agente IA</span>
            </div>
          )}
          <span className="text-[10px] text-[var(--tinta-suave)]">
            {formatRelativo(mensaje.creado_at)}
          </span>
        </div>
      </div>
      {!esEntrante && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--salvia-tint)] mt-0.5">
          {esIA
            ? <Bot size={12} strokeWidth={1.75} className="text-[var(--oliva)]" />
            : <User size={12} strokeWidth={1.75} className="text-[var(--oliva)]" />
          }
        </div>
      )}
    </div>
  );
}
