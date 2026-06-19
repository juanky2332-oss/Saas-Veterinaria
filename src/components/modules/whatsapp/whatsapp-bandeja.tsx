"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, Bot, User, Send, Clock, Wifi, WifiOff, PlugZap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativo, iniciales } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { enviarMensajeWhatsapp, toggleAgenteConversacion } from "@/app/actions/whatsapp";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Conversacion {
  id: string;
  telefono: string;
  estado_agente: string;
  ultima_entrada_at: string | null;
  no_leidos: number;
  patients: { nombre: string; apellidos: string } | null;
}

interface Mensaje {
  id: string;
  conversation_id: string;
  direccion: string;
  tipo: string;
  cuerpo: string | null;
  enviado_por: string;
  creado_at: string;
}

interface WhatsappBandejaProps {
  conversaciones: Conversacion[];
  conectado?: boolean;
}

function estaVentanaAbierta(ultimaEntradaAt: string | null): boolean {
  if (!ultimaEntradaAt) return false;
  return Date.now() - new Date(ultimaEntradaAt).getTime() < 24 * 60 * 60 * 1000;
}

export function WhatsappBandeja({ conversaciones: inicial, conectado = true }: WhatsappBandejaProps) {
  const [convs, setConvs] = useState(inicial);
  const [seleccionada, setSeleccionada] = useState<string | null>(inicial[0]?.id ?? null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [enVivo, setEnVivo] = useState(true);
  const supabase = createClient();

  // Suscripción Realtime
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel("wa_bandeja")
      .on("postgres_changes", { event: "*", schema: "public", table: "wa_conversations" }, (payload) => {
        setConvs((prev) => {
          const updated = payload.new as Conversacion;
          const idx = prev.findIndex((c) => c.id === updated.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...updated };
            return next.sort((a, b) =>
              (b.ultima_entrada_at ?? "").localeCompare(a.ultima_entrada_at ?? "")
            );
          }
          return [updated, ...prev];
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "wa_messages" }, (payload) => {
        const msg = payload.new as Mensaje;
        if (msg.conversation_id === seleccionada) {
          setMensajes((prev) => [...prev, msg]);
        }
      })
      .subscribe((status) => {
        setEnVivo(status === "SUBSCRIBED");
      });

    return () => { supabase.removeChannel(channel); };
  }, [seleccionada, supabase]);

  // Cargar mensajes al seleccionar conversación
  useEffect(() => {
    if (!seleccionada) return;
    let cancelled = false;
    const loadMensajes = async () => {
      setCargandoMensajes(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from("wa_messages") as any)
        .select("*")
        .eq("conversation_id", seleccionada)
        .order("creado_at") as { data: Mensaje[] | null };
      if (!cancelled) {
        setMensajes(data ?? []);
        setCargandoMensajes(false);
      }
    };
    loadMensajes().catch(() => { if (!cancelled) setCargandoMensajes(false); });
    return () => { cancelled = true; };
  }, [seleccionada, supabase]);

  const convActual = convs.find((c) => c.id === seleccionada);
  const ventanaAbierta = estaVentanaAbierta(convActual?.ultima_entrada_at ?? null);

  async function enviarMensaje() {
    if (!texto.trim() || !seleccionada) return;
    const cuerpo = texto.trim();
    setTexto("");

    // Optimista: se pinta ya; el action lo envía por la API de la clínica y lo persiste
    const provisional: Mensaje = {
      id: `tmp-${Date.now()}`,
      conversation_id: seleccionada,
      direccion: "out",
      tipo: "texto",
      cuerpo,
      enviado_por: "humano",
      creado_at: new Date().toISOString(),
    };
    setMensajes((prev) => [...prev, provisional]);

    const res = await enviarMensajeWhatsapp(seleccionada, cuerpo);
    if (res.error) {
      setMensajes((prev) => prev.filter((m) => m.id !== provisional.id));
      setTexto(cuerpo);
      toast.error(res.error);
    }
  }

  async function toggleIA() {
    if (!convActual) return;
    const nuevo = convActual.estado_agente === "activo" ? "pausado" : "activo";
    setConvs((prev) => prev.map((c) => (c.id === convActual.id ? { ...c, estado_agente: nuevo } : c)));
    const res = await toggleAgenteConversacion(convActual.id, nuevo);
    if (res.error) {
      setConvs((prev) => prev.map((c) => (c.id === convActual.id ? { ...c, estado_agente: convActual.estado_agente } : c)));
      toast.error(res.error);
    } else {
      toast.success(nuevo === "activo" ? "Agente IA activado en esta conversación" : "Agente IA pausado");
    }
  }

  return (
    <div className="flex h-full flex-col">
      {!conectado && (
        <Link
          href="/configuracion/whatsapp"
          className="flex items-center gap-2.5 border-b border-[var(--aviso)]/30 bg-[var(--aviso-tint)] px-4 py-2.5 text-sm font-semibold text-[var(--aviso)] transition-colors hover:brightness-95"
        >
          <PlugZap size={16} />
          WhatsApp aún no está conectado: configura tu número y tu agente IA aquí →
        </Link>
      )}
      <div className="flex flex-1 overflow-hidden">
      {/* Lista de conversaciones */}
      <div className="w-full md:w-80 flex-shrink-0 border-r border-[var(--lino)] flex flex-col bg-[var(--blanco-calido)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--lino)]">
          <span className="text-sm font-semibold text-[var(--tinta)]">
            Conversaciones
          </span>
          <div className="flex items-center gap-1.5">
            {enVivo
              ? <Wifi size={13} strokeWidth={1.75} className="text-[var(--exito)]" />
              : <WifiOff size={13} strokeWidth={1.75} className="text-[var(--error)]" />
            }
            <span className="text-xs text-[var(--tinta-suave)]">{enVivo ? "En vivo" : "Sin conexión"}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convs.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center px-4">
              <MessageCircle size={28} strokeWidth={1.5} className="text-[var(--salvia)] mb-3" />
              <p className="text-sm font-semibold text-[var(--tinta)]">Sin mensajes</p>
              <p className="text-xs text-[var(--tinta-suave)] mt-1">
                Los mensajes entrantes de WhatsApp aparecerán aquí en tiempo real.
              </p>
            </div>
          ) : (
            convs.map((conv) => {
              const nombre = conv.patients
                ? `${conv.patients.nombre} ${conv.patients.apellidos}`
                : conv.telefono;
              const isSelected = conv.id === seleccionada;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSeleccionada(conv.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 border-b border-[var(--lino)] text-left transition-colors ${
                    isSelected ? "bg-[var(--salvia-tint)]" : "hover:bg-[var(--arena)]"
                  }`}
                >
                  <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                    <AvatarFallback className="text-xs">
                      {conv.patients ? iniciales(conv.patients.nombre, conv.patients.apellidos) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[var(--tinta)] truncate">{nombre}</p>
                      {conv.no_leidos > 0 && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--terracota)] text-[10px] font-bold text-white ml-1">
                          {conv.no_leidos}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {conv.estado_agente === "humano" && (
                        <span className="text-[10px] font-semibold text-[var(--error)]">⚠ Atención humana</span>
                      )}
                      {conv.ultima_entrada_at && (
                        <span className="text-[10px] text-[var(--tinta-suave)]">
                          {formatRelativo(conv.ultima_entrada_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Conversación activa */}
      <div className="hidden md:flex flex-1 flex-col bg-[var(--crema)]">
        {!seleccionada || !convActual ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageCircle size={40} strokeWidth={1.5} className="text-[var(--salvia)] mx-auto mb-4" />
              <p className="font-display text-lg font-semibold text-[var(--tinta)]">
                Selecciona una conversación
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header de la conv */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--lino)] bg-[var(--blanco-calido)]">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-sm">
                    {convActual.patients
                      ? iniciales(convActual.patients.nombre, convActual.patients.apellidos)
                      : "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-[var(--tinta)]">
                    {convActual.patients
                      ? `${convActual.patients.nombre} ${convActual.patients.apellidos}`
                      : convActual.telefono}
                  </p>
                  <p className="text-xs text-[var(--tinta-suave)]">{convActual.telefono}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={convActual.estado_agente === "activo" ? "oliva" : convActual.estado_agente === "humano" ? "error" : "muted"}>
                  {convActual.estado_agente === "activo" ? (
                    <span className="flex items-center gap-1"><Bot size={10} /> Agente IA</span>
                  ) : convActual.estado_agente === "humano" ? "Requiere atención" : "Pausado"}
                </Badge>
                <Button size="sm" variant="outline" className="text-xs" onClick={toggleIA}>
                  {convActual.estado_agente === "activo" ? "Pausar IA" : "Activar IA"}
                </Button>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cargandoMensajes ? (
                <div className="text-center py-8 text-sm text-[var(--tinta-suave)]">Cargando…</div>
              ) : mensajes.length === 0 ? (
                <div className="text-center py-8 text-sm text-[var(--tinta-suave)]">
                  Sin mensajes aún
                </div>
              ) : (
                mensajes.map((msg) => (
                  <MensajeBurbuja key={msg.id} msg={msg} />
                ))
              )}
            </div>

            {/* Ventana 24h */}
            {!ventanaAbierta && (
              <div className="mx-4 mb-2 flex items-center gap-2 rounded-[10px] bg-[var(--aviso-tint)] px-3 py-2">
                <Clock size={13} strokeWidth={1.75} className="text-[var(--aviso)]" />
                <p className="text-xs font-semibold text-[var(--aviso)]">
                  Ventana de 24h cerrada — solo puedes enviar plantillas
                </p>
              </div>
            )}

            {/* Compositor */}
            <div className="flex items-end gap-2 px-4 py-3 border-t border-[var(--lino)] bg-[var(--blanco-calido)]">
              {ventanaAbierta ? (
                <>
                  <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensaje(); } }}
                    placeholder="Escribe un mensaje… (Enter para enviar)"
                    rows={2}
                    className="flex-1 resize-none rounded-[12px] border border-[var(--lino)] bg-[var(--arena)] px-3 py-2 text-sm text-[var(--tinta)] placeholder:text-[var(--tinta-suave)] focus:outline-none focus:border-[var(--oliva)] focus:ring-2 focus:ring-[rgba(117,128,107,.25)]"
                  />
                  <Button size="icon" disabled={!texto.trim()} onClick={enviarMensaje} className="shrink-0">
                    <Send size={16} strokeWidth={1.75} />
                  </Button>
                </>
              ) : (
                <Button variant="outline" className="w-full">
                  Seleccionar plantilla HSM aprobada
                </Button>
              )}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}

function MensajeBurbuja({ msg }: { msg: Mensaje }) {
  const esEntrante = msg.direccion === "in";
  const esIA = msg.enviado_por === "agente_ia";

  return (
    <div className={`flex ${esEntrante ? "justify-start" : "justify-end"} gap-2`}>
      {esEntrante && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--terracota-tint)] mt-0.5">
          <User size={12} strokeWidth={1.75} className="text-[var(--terracota)]" />
        </div>
      )}
      <div className="max-w-[70%] space-y-1">
        <div className={`rounded-[12px] px-3 py-2 text-sm ${
          esEntrante ? "bg-[var(--blanco-calido)] text-[var(--tinta)] shadow-[var(--shadow-card)]" : "bg-[var(--oliva)] text-white"
        }`}>
          {msg.cuerpo}
        </div>
        <div className={`flex items-center gap-1 ${esEntrante ? "" : "justify-end"}`}>
          {esIA && !esEntrante && (
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--tinta-suave)]">
              <Bot size={10} /> IA
            </span>
          )}
          <span className="text-[10px] text-[var(--tinta-suave)]">
            {formatRelativo(msg.creado_at)}
          </span>
        </div>
      </div>
      {!esEntrante && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--salvia-tint)] mt-0.5">
          {esIA ? <Bot size={12} strokeWidth={1.75} className="text-[var(--oliva)]" /> : <User size={12} strokeWidth={1.75} className="text-[var(--oliva)]" />}
        </div>
      )}
    </div>
  );
}
