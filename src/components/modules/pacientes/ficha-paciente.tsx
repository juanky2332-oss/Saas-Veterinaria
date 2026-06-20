// @ts-nocheck — módulo legacy Veteriblandenguer; no usado en Veteriblandenguer (usamos ficha-mascota)
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Phone, Mail, MapPin, AlertTriangle, ChevronLeft, ChevronDown, Mic } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatFecha, iniciales } from "@/lib/utils";
import type { Database } from "@/lib/database.types";
import { TabResumen } from "./tabs/tab-resumen";
import { TabHistorial, type CitaHistorial, type InformeHistorial } from "./tabs/tab-historial";
import { TabTratamientos } from "./tabs/tab-tratamientos";
import { TabFotos } from "./tabs/tab-fotos";
import { TabConsentimientos } from "./tabs/tab-consentimientos";
import { TabWhatsapp } from "./tabs/tab-whatsapp";
import { TabFacturacion } from "./tabs/tab-facturacion";
import { TabDatosMedicos } from "./tabs/tab-datos-medicos";
import { TabBiometria } from "./tabs/tab-biometria";
import { TabRecetas } from "./tabs/tab-recetas";
import { TabBonos } from "./tabs/tab-bonos";
import { RegistrarVisitaFullscreen } from "./registrar-visita-fullscreen";
import type { FeatureKey, FeatureState } from "@/lib/features";

type Paciente = Database["public"]["Tables"]["patients"]["Row"];
type Metrica = Database["public"]["Tables"]["patient_metrics"]["Row"];

interface FichaPacienteProps {
  paciente: Paciente;
  citas: Record<string, unknown>[];
  tratamientos: Record<string, unknown>[];
  consentimientos: Record<string, unknown>[];
  fotos: Record<string, unknown>[];
  conversacion: Record<string, unknown> | null;
  informes: InformeHistorial[];
  metricas: Metrica[];
  recetas: Record<string, unknown>[];
  bonos: Record<string, unknown>[];
  bonoPlantillas: { id: string; nombre: string; sesiones: number; precio: number; treatment_id: string | null }[];
  tratamientosOpts: { value: string; label: string }[];
  features: Partial<FeatureState>;
  tabInicial: string;
}

/** Pestañas de la ficha; `feature` undefined = siempre visible. */
const ALL_TABS: { id: string; label: string; feature?: FeatureKey }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "datos_medicos", label: "Datos médicos", feature: "ficha_datos_medicos" },
  { id: "biometria", label: "Biometría", feature: "ficha_biometria" },
  { id: "historial", label: "Historial" },
  { id: "tratamientos", label: "Tratamientos", feature: "ficha_tratamientos" },
  { id: "bonos", label: "Bonos", feature: "bonos" },
  { id: "fotos", label: "Fotos", feature: "ficha_fotos" },
  { id: "consentimientos", label: "Consentimientos", feature: "ficha_consentimientos" },
  { id: "recetas", label: "Recetas", feature: "ficha_recetas" },
  { id: "whatsapp", label: "WhatsApp", feature: "ficha_whatsapp" },
  { id: "facturacion", label: "Facturación", feature: "ficha_facturacion" },
];

export function FichaPaciente({
  paciente,
  citas,
  tratamientos,
  consentimientos,
  fotos,
  conversacion,
  informes,
  metricas,
  recetas,
  bonos,
  bonoPlantillas,
  tratamientosOpts,
  features,
  tabInicial,
}: FichaPacienteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visitaOpen, setVisitaOpen] = useState(false);
  const [citaParaInforme, setCitaParaInforme] = useState<CitaHistorial | null>(null);

  const tabs = ALL_TABS.filter((t) => !t.feature || features[t.feature] !== false);
  const tabActiva = tabs.some((t) => t.id === tabInicial) ? tabInicial : "resumen";

  const abrirVisita = useCallback((cita?: CitaHistorial) => {
    setCitaParaInforme(cita ?? null);
    setVisitaOpen(true);
  }, []);

  const onTabChange = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="space-y-4 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <Link
        href="/pacientes"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--tinta-suave)] hover:text-[var(--oliva)] transition-colors"
      >
        <ChevronLeft size={14} strokeWidth={2} />
        Volver a pacientes
      </Link>

      {/* Header card */}
      <div className="rounded-[16px] border border-[var(--lino)] bg-[var(--blanco-calido)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarFallback className="text-xl">
              {iniciales(paciente.nombre, paciente.apellidos)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-semibold text-[var(--tinta)]">
                {paciente.nombre} {paciente.apellidos}
              </h2>
              {paciente.sexo && (
                <Badge variant="muted" className="capitalize">
                  {paciente.sexo}
                </Badge>
              )}
            </div>

            {paciente.fecha_nacimiento && (
              <p className="mt-0.5 text-sm text-[var(--tinta-suave)]">
                Nacida el {formatFecha(paciente.fecha_nacimiento)}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              <a
                href={`tel:${paciente.telefono}`}
                className="flex items-center gap-1.5 text-sm text-[var(--tinta)] hover:text-[var(--oliva)]"
              >
                <Phone size={14} strokeWidth={1.75} className="text-[var(--tinta-suave)]" />
                {paciente.telefono}
              </a>
              {paciente.email && (
                <a
                  href={`mailto:${paciente.email}`}
                  className="flex items-center gap-1.5 text-sm text-[var(--tinta)] hover:text-[var(--oliva)]"
                >
                  <Mail size={14} strokeWidth={1.75} className="text-[var(--tinta-suave)]" />
                  {paciente.email}
                </a>
              )}
              {paciente.direccion && (
                <span className="flex items-center gap-1.5 text-sm text-[var(--tinta-suave)]">
                  <MapPin size={14} strokeWidth={1.75} />
                  {paciente.direccion}
                </span>
              )}
            </div>

            {paciente.alergias && (
              <div className="mt-3 flex items-start gap-1.5 rounded-[8px] bg-[var(--aviso-tint)] px-3 py-2">
                <AlertTriangle size={14} strokeWidth={1.75} className="text-[var(--aviso)] mt-0.5 shrink-0" />
                <p className="text-xs font-semibold text-[var(--aviso)]">
                  Alergias: {paciente.alergias}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="gap-1.5" onClick={() => abrirVisita()}>
              <Mic size={13} strokeWidth={2} /> Registrar visita
            </Button>
            <Link href={`/agenda?nueva=1&paciente=${paciente.id}`}>
              <Button size="sm" variant="terracota">Nueva cita</Button>
            </Link>
            <Link href={`/pacientes/${paciente.id}/editar`}>
              <Button size="sm" variant="outline">Editar</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tabActiva} onValueChange={onTabChange}>
        {/* Móvil: desplegable de pestaña (más visual e intuitivo) */}
        <div className="relative sm:hidden">
          <select
            value={tabActiva}
            onChange={(e) => onTabChange(e.target.value)}
            aria-label="Sección de la ficha"
            className="h-11 w-full appearance-none rounded-[12px] border border-[var(--lino)] bg-[var(--blanco-calido)] pl-4 pr-10 text-sm font-semibold text-[var(--tinta)] shadow-[var(--shadow-card)] focus-visible:border-[var(--oliva)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(117,128,107,.25)]"
          >
            {tabs.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--oliva)]" />
        </div>

        {/* Escritorio: barra de pestañas */}
        <TabsList className="hidden w-auto overflow-x-auto sm:flex">
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="resumen">
          <TabResumen paciente={paciente} citas={citas} tratamientos={tratamientos} />
        </TabsContent>
        {features.ficha_datos_medicos !== false && (
          <TabsContent value="datos_medicos">
            <TabDatosMedicos paciente={paciente} conMutua={features.ficha_mutua !== false} />
          </TabsContent>
        )}
        {features.ficha_biometria !== false && (
          <TabsContent value="biometria">
            <TabBiometria pacienteId={paciente.id} metricas={metricas} />
          </TabsContent>
        )}
        <TabsContent value="historial">
          <TabHistorial citas={citas} informes={informes} onRegistrarVisita={abrirVisita} />
        </TabsContent>
        {features.ficha_tratamientos !== false && (
          <TabsContent value="tratamientos">
            <TabTratamientos tratamientos={tratamientos} pacienteId={paciente.id} />
          </TabsContent>
        )}
        {features.bonos !== false && (
          <TabsContent value="bonos">
            <TabBonos pacienteId={paciente.id} bonos={bonos as never} plantillas={bonoPlantillas} tratamientos={tratamientosOpts} />
          </TabsContent>
        )}
        {features.ficha_fotos !== false && (
          <TabsContent value="fotos">
            <TabFotos fotos={fotos} pacienteId={paciente.id} orgId={paciente.organization_id} />
          </TabsContent>
        )}
        {features.ficha_consentimientos !== false && (
          <TabsContent value="consentimientos">
            <TabConsentimientos consentimientos={consentimientos} paciente={paciente} />
          </TabsContent>
        )}
        {features.ficha_recetas !== false && (
          <TabsContent value="recetas">
            <TabRecetas recetas={recetas as unknown as React.ComponentProps<typeof TabRecetas>["recetas"]} pacienteId={paciente.id} />
          </TabsContent>
        )}
        {features.ficha_whatsapp !== false && (
          <TabsContent value="whatsapp">
            <TabWhatsapp conversacion={conversacion} telefono={paciente.telefono} />
          </TabsContent>
        )}
        {features.ficha_facturacion !== false && (
          <TabsContent value="facturacion">
            <TabFacturacion paciente={paciente} />
          </TabsContent>
        )}
      </Tabs>

      <RegistrarVisitaFullscreen
        open={visitaOpen}
        onClose={() => setVisitaOpen(false)}
        pacienteId={paciente.id}
        pacienteNombre={`${paciente.nombre} ${paciente.apellidos}`}
        cita={citaParaInforme}
      />
    </div>
  );
}
