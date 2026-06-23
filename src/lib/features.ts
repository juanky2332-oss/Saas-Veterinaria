/**
 * VetClinic SaaS — Núcleo de features por vertical.
 *
 * El único vertical activo en v1 es `veterinaria`. La estructura de presets
 * se mantiene para poder añadir `exoticos`, `equina`, etc. en el futuro.
 */

export type FeatureKey =
  // ── Módulos (entradas del menú lateral) ──
  | "agenda"
  | "clientes"
  | "vacunaciones"
  | "desparasitaciones"
  | "historia_clinica"
  | "whatsapp"
  | "crm"
  | "facturacion"
  | "presupuestos"
  | "inventario"
  | "proveedores"
  | "analitica"
  | "recetas"
  | "caja"
  | "bonos"
  | "cuotas"
  | "mutuas"
  // ── Secciones de la ficha de la mascota ──
  | "ficha_info"
  | "ficha_historial"
  | "ficha_vacunaciones"
  | "ficha_desparasitaciones"
  | "ficha_fotos"
  | "ficha_facturacion"
  | "ficha_recetas";

export type FeatureGroup = "modulo" | "ficha";

export interface FeatureDef {
  key: FeatureKey;
  label: string;
  desc: string;
  group: FeatureGroup;
  soon?: boolean;
}

export const FEATURES: FeatureDef[] = [
  // Módulos
  { key: "agenda",            label: "Agenda",               desc: "Calendario de citas por veterinario.",               group: "modulo" },
  { key: "clientes",          label: "Clientes",              desc: "Dueños de mascotas: contacto y facturación.",        group: "modulo" },
  { key: "vacunaciones",      label: "Vacunaciones",          desc: "Registro de vacunas y alertas de renovación.",       group: "modulo" },
  { key: "desparasitaciones", label: "Desparasitaciones",     desc: "Tratamientos antiparasitarios y recordatorios.",     group: "modulo" },
  { key: "historia_clinica",  label: "Historia clínica",      desc: "Registros clínicos por visita (diagnóstico, Rx…).",  group: "modulo" },
  { key: "whatsapp",          label: "WhatsApp",              desc: "Bandeja y agente IA por clínica.",                   group: "modulo" },
  { key: "crm",               label: "CRM",                   desc: "Pipeline de oportunidades y captación de clientes.", group: "modulo" },
  { key: "facturacion",       label: "Facturación",           desc: "Facturas a nombre del dueño de la mascota.",         group: "modulo" },
  { key: "presupuestos",      label: "Presupuestos",          desc: "Presupuestos previos a tratamientos.",               group: "modulo" },
  { key: "inventario",        label: "Inventario",            desc: "Stock de medicamentos y material.",                  group: "modulo" },
  { key: "proveedores",       label: "Proveedores",           desc: "Proveedores y compras de la clínica.",               group: "modulo" },
  { key: "analitica",         label: "Analítica",             desc: "KPIs e informes del negocio.",                       group: "modulo" },
  { key: "recetas",           label: "Recetas veterinarias",  desc: "Prescripciones de medicamentos para mascotas.",      group: "modulo" },
  { key: "caja",              label: "Caja",                  desc: "Cierre diario e ingresos.",                          group: "modulo" },
  { key: "bonos",             label: "Bonos de sesiones",     desc: "Paquetes de sesiones prepagadas para clientes.",     group: "modulo" },
  { key: "cuotas",            label: "Cuotas recurrentes",    desc: "Cobros periódicos: planes de salud, mantenimientos.", group: "modulo" },
  { key: "mutuas",            label: "Mutuas",                desc: "Aseguradoras y entidades concertadas.",              group: "modulo" },
  // Secciones de la ficha de mascota
  { key: "ficha_info",               label: "Info de la mascota",        desc: "Especie, raza, chip, peso, propietario.", group: "ficha" },
  { key: "ficha_historial",          label: "Historial clínico",         desc: "Visitas, diagnósticos y tratamientos.",   group: "ficha" },
  { key: "ficha_vacunaciones",       label: "Vacunas en ficha",          desc: "Registro y próximas fechas.",             group: "ficha" },
  { key: "ficha_desparasitaciones",  label: "Desparasitaciones en ficha",desc: "Tratamientos y recordatorios.",           group: "ficha" },
  { key: "ficha_fotos",              label: "Fotos de la mascota",       desc: "Galería de imágenes clínicas.",           group: "ficha" },
  { key: "ficha_facturacion",        label: "Facturación en ficha",      desc: "Facturas del dueño asociadas.",           group: "ficha" },
  { key: "ficha_recetas",            label: "Recetas en ficha",          desc: "Prescripciones de la mascota.",           group: "ficha" },
];

export type FeatureState = Record<FeatureKey, boolean>;

const BASE: FeatureState = {
  agenda:             true,
  clientes:           true,
  vacunaciones:       false,
  desparasitaciones:  false,
  historia_clinica:   true,
  whatsapp:           true,
  crm:                false,
  facturacion:        true,
  presupuestos:       true,
  inventario:         true,
  proveedores:        true,
  analitica:          true,
  recetas:            false,
  caja:               true,
  bonos:              false,
  cuotas:             false,
  mutuas:             false,
  ficha_info:               true,
  ficha_historial:          true,
  ficha_vacunaciones:       false,
  ficha_desparasitaciones:  false,
  ficha_fotos:              false,
  ficha_facturacion:        true,
  ficha_recetas:            false,
};

const PRESETS: Record<string, Partial<FeatureState>> = {
  veterinaria: {
    vacunaciones:       true,
    desparasitaciones:  true,
    recetas:            true,
    crm:                true,
    bonos:              true,
    cuotas:             true,
    mutuas:             true,
    ficha_vacunaciones:       true,
    ficha_desparasitaciones:  true,
    ficha_fotos:              true,
    ficha_recetas:            true,
  },
  exoticos: {
    vacunaciones:       true,
    desparasitaciones:  true,
    recetas:            true,
    crm:                true,
    bonos:              true,
    cuotas:             true,
    mutuas:             true,
    ficha_vacunaciones:       true,
    ficha_desparasitaciones:  true,
    ficha_fotos:              true,
    ficha_recetas:            true,
  },
  equina: {
    vacunaciones:       true,
    desparasitaciones:  true,
    recetas:            true,
    crm:                true,
    bonos:              true,
    cuotas:             true,
    mutuas:             true,
    ficha_vacunaciones:       true,
    ficha_desparasitaciones:  true,
    ficha_fotos:              true,
    ficha_recetas:            true,
  },
};

export function resolveFeatures(
  vertical: string | null | undefined,
  overrides: unknown,
): FeatureState {
  const preset = { ...BASE, ...(PRESETS[vertical ?? "veterinaria"] ?? {}) };
  const ov = (overrides && typeof overrides === "object" ? overrides : {}) as Partial<
    Record<FeatureKey, unknown>
  >;
  const out = { ...preset };
  for (const def of FEATURES) {
    const v = ov[def.key];
    if (typeof v === "boolean") out[def.key] = v;
  }
  return out;
}

export function isOn(features: FeatureState, key: FeatureKey): boolean {
  return features[key] === true;
}

export function diffFromPreset(
  vertical: string | null | undefined,
  state: FeatureState,
): Partial<FeatureState> {
  const preset = { ...BASE, ...(PRESETS[vertical ?? "veterinaria"] ?? {}) };
  const diff: Partial<FeatureState> = {};
  for (const def of FEATURES) {
    if (state[def.key] !== preset[def.key]) diff[def.key] = state[def.key];
  }
  return diff;
}
