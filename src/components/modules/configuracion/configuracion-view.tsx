"use client";

import { useState } from "react";
import { Settings, Key, Users, Bell, Bot, Package, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFechaHora } from "@/lib/utils";

interface ConfiguracionViewProps {
  rol: string;
  settings: { clave: string; valor: unknown }[];
  apiKeys: { id: string; nombre: string; scopes: string[]; activo: boolean; ultima_uso_at: string | null; created_at: string }[];
}

export function ConfiguracionView({ rol, settings, apiKeys }: ConfiguracionViewProps) {
  const isAdmin = rol === "admin";
  const [seccion, setSeccion] = useState("general");

  const secciones = [
    { id: "general", label: "General", icon: Settings },
    { id: "usuarios", label: "Usuarios y roles", icon: Users, adminOnly: true },
    { id: "recordatorios", label: "Recordatorios", icon: Bell },
    { id: "agente", label: "Agente IA", icon: Bot },
    { id: "integraciones", label: "Integraciones", icon: Package, adminOnly: true },
    { id: "api", label: "API keys", icon: Key, adminOnly: true },
    { id: "rgpd", label: "RGPD y privacidad", icon: Shield, adminOnly: true },
  ].filter((s) => !s.adminOnly || isAdmin);

  // Accesos directos a subsecciones
  const subsecciones = [
    { href: "/configuracion/tratamientos", label: "Catálogo de tratamientos", descripcion: "Gestionar todos los tratamientos disponibles" },
    { href: "/configuracion/importar", label: "Importar desde Clinic Cloud", descripcion: "Migración de datos desde el sistema anterior" },
  ];

  const getSetting = (clave: string) => {
    const s = settings.find((s) => s.clave === clave);
    return s?.valor;
  };

  return (
    <div className="flex gap-6 max-w-[1200px] mx-auto">
      {/* Sidebar de secciones */}
      <nav className="hidden md:flex flex-col w-52 gap-0.5 shrink-0">
        {secciones.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setSeccion(s.id)}
              className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-sm font-semibold text-left transition-colors ${
                seccion === s.id
                  ? "bg-[var(--salvia-tint)] text-[var(--oliva-oscuro)]"
                  : "text-[var(--tinta-suave)] hover:bg-[var(--arena)]"
              }`}
            >
              <Icon size={15} strokeWidth={1.75} />
              {s.label}
            </button>
          );
        })}
      </nav>

      {/* Contenido */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Accesos rápidos siempre visibles */}
      <div className="flex flex-wrap gap-2 mb-1">
        {subsecciones.map(s => (
          <a key={s.href} href={s.href}
            className="flex items-center gap-2 rounded-[10px] border border-[var(--lino)] bg-[var(--blanco-calido)] px-3 py-2 text-sm font-semibold text-[var(--tinta)] hover:bg-[var(--salvia-tint)] hover:text-[var(--oliva-oscuro)] hover:border-[var(--salvia)] transition-all duration-150 shadow-[var(--shadow-card)]">
            → {s.label}
          </a>
        ))}
      </div>

      {seccion === "general" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Información de la clínica</CardTitle>
                <CardDescription>Datos que usa el agente IA y los recordatorios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Nombre" value={String(getSetting("nombre_clinica") ?? "Clinicomatic")} />
                <InfoRow label="Teléfono" value={String(getSetting("telefono_clinica") ?? "+34 968 000 000")} />
                <InfoRow label="Dirección" value={String(getSetting("direccion_clinica") ?? "Paseo Almte. Fajardo de Guevara 9, Murcia")} />
                <InfoRow label="Zona horaria" value={String(getSetting("timezone") ?? "Europe/Madrid")} />
                <Button size="sm" variant="outline" className="mt-2">Editar</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Horario de la clínica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {[
                    { dia: "Lunes", h: "10:00 – 17:00" },
                    { dia: "Martes", h: "11:00 – 20:30" },
                    { dia: "Miércoles", h: "10:00 – 20:30" },
                    { dia: "Jueves", h: "10:00 – 20:00" },
                    { dia: "Viernes", h: "10:00 – 14:00" },
                  ].map((h) => (
                    <div key={h.dia} className="flex justify-between">
                      <span className="text-[var(--tinta-suave)] font-medium">{h.dia}</span>
                      <span className="text-[var(--tinta)] tabular-nums">{h.h}</span>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="mt-3">Editar horario</Button>
              </CardContent>
            </Card>
          </>
        )}

        {seccion === "api" && isAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Gestiona el acceso a la API pública v1</CardDescription>
                </div>
                <Button size="sm" className="gap-1.5"><Key size={13} /> Nueva clave</Button>
              </div>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <p className="text-sm text-[var(--tinta-suave)] text-center py-6">
                  Sin claves de API creadas
                </p>
              ) : (
                <div className="space-y-2">
                  {apiKeys.map((k) => (
                    <div key={k.id} className="flex items-center justify-between rounded-[12px] border border-[var(--lino)] p-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--tinta)]">{k.nombre}</p>
                        <p className="text-xs text-[var(--tinta-suave)]">
                          Scopes: {k.scopes.join(", ")}
                          {k.ultima_uso_at && ` · Último uso: ${formatFechaHora(k.ultima_uso_at)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={k.activo ? "oliva" : "muted"}>
                          {k.activo ? "Activa" : "Inactiva"}
                        </Badge>
                        <Button size="icon-sm" variant="ghost">···</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {seccion === "agente" && (
          <Card>
            <CardHeader>
              <CardTitle>Agente IA de WhatsApp</CardTitle>
              <CardDescription>Configura el comportamiento del agente automático</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-[12px] bg-[var(--arena)] p-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--tinta)]">Estado global del agente</p>
                  <p className="text-xs text-[var(--tinta-suave)]">Activa/desactiva el agente para todas las conversaciones</p>
                </div>
                <Badge variant={getSetting("agente_ia_activo") === true ? "oliva" : "muted"}>
                  {getSetting("agente_ia_activo") === true ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <p className="text-xs text-[var(--tinta-suave)]">
                El agente responde automáticamente fuera de horas de atención y cuando no hay respuesta humana en 5 minutos.
              </p>
              <Button size="sm" variant="outline">Editar prompt del agente</Button>
            </CardContent>
          </Card>
        )}

        {seccion === "integraciones" && isAdmin && (
          <div className="space-y-3">
            {[
              { nombre: "WhatsApp Cloud API", estado: process.env.NEXT_PUBLIC_WA_MODE ?? "mock", descripcion: "Meta Business · número directo de Clinicomatic" },
              { nombre: "GoHighLevel", estado: "mock", descripcion: "Pipeline y leads de campañas" },
              { nombre: "Holded", estado: "mock", descripcion: "Facturación (vía n8n)" },
              { nombre: "Google Gemini", estado: "mock", descripcion: "Dictado de informes y agente IA" },
            ].map((int) => (
              <Card key={int.nombre}>
                <CardContent className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--tinta)]">{int.nombre}</p>
                    <p className="text-xs text-[var(--tinta-suave)]">{int.descripcion}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={int.estado === "live" ? "oliva" : "aviso"}>
                      {int.estado === "live" ? "En vivo" : "Mock"}
                    </Badge>
                    <Button size="sm" variant="outline">Configurar</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {seccion === "rgpd" && isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>RGPD y privacidad</CardTitle>
              <CardDescription>Esta app trata datos de salud (Art. 9 RGPD)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { check: true, label: "Datos en región UE (eu-west-2)" },
                { check: true, label: "RLS activo en todas las tablas de pacientes" },
                { check: true, label: "Fotos en bucket privado con signed URLs" },
                { check: true, label: "Audio de dictados borrado tras transcribir" },
                { check: true, label: "Audit log activado" },
                { check: false, label: "Contrato encargado del tratamiento firmado — pendiente" },
                { check: false, label: "Retención de historia clínica confirmada con asesoría — pendiente" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className={`text-sm ${item.check ? "text-[var(--exito)]" : "text-[var(--aviso)]"}`}>
                    {item.check ? "✓" : "⚠"}
                  </span>
                  <span className="text-sm text-[var(--tinta)]">{item.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-semibold text-[var(--tinta-suave)] shrink-0">{label}</span>
      <span className="text-sm text-[var(--tinta)] text-right">{value}</span>
    </div>
  );
}
