/**
 * Catálogo de especialidades veterinarias.
 * En Veteriblandenguer, todos los tenants son clínicas veterinarias.
 * Las "especialidades" son los servicios principales que ofrecen.
 */

import type { VerticalPreset } from "@/lib/theme/themes";

export interface Especialidad {
  value: string;
  label: string;
  vertical: VerticalPreset;
}

export const ESPECIALIDADES: Especialidad[] = [
  { value: "pequeños_animales",  label: "Pequeños animales (perros y gatos)", vertical: "veterinaria" },
  { value: "exoticos",           label: "Animales exóticos (reptiles, aves...)", vertical: "exoticos" },
  { value: "equina",             label: "Medicina equina (caballos)",          vertical: "equina" },
  { value: "urgencias",          label: "Urgencias 24h",                       vertical: "veterinaria" },
  { value: "cirugia_vet",        label: "Cirugía veterinaria",                 vertical: "veterinaria" },
  { value: "dermatologia_vet",   label: "Dermatología veterinaria",            vertical: "veterinaria" },
  { value: "oftalmologia_vet",   label: "Oftalmología veterinaria",            vertical: "veterinaria" },
  { value: "rehabilitacion_vet", label: "Rehabilitación y fisioterapia animal",vertical: "veterinaria" },
  { value: "nutricion_vet",      label: "Nutrición y dietética animal",        vertical: "veterinaria" },
  { value: "peluqueria_vet",     label: "Peluquería y estética animal",        vertical: "veterinaria" },
];

export const ESPECIALIDADES_POR_VERTICAL: Record<VerticalPreset, Especialidad[]> = {
  veterinaria: ESPECIALIDADES.filter((e) => e.vertical === "veterinaria"),
  exoticos:    ESPECIALIDADES.filter((e) => e.vertical === "exoticos"),
  equina:      ESPECIALIDADES.filter((e) => e.vertical === "equina"),
};

const BY_VALUE = new Map(ESPECIALIDADES.map((e) => [e.value, e]));

export function verticalDeEspecialidad(value: string): VerticalPreset | null {
  return BY_VALUE.get(value)?.vertical ?? null;
}

export function labelDeEspecialidad(value: string | null | undefined): string | null {
  if (!value) return null;
  return BY_VALUE.get(value)?.label ?? null;
}
