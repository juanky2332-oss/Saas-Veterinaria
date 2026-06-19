/**
 * Catálogo de especialidades concretas. Cada una se mapea a un "vertical"
 * (familia) que determina el tema visual y el preset de funciones por defecto.
 * Así Clinicomatic sirve a cualquier rama médica sin multiplicar la lógica:
 * la especialidad es la etiqueta fina; el vertical es el comportamiento base.
 */

import type { VerticalPreset } from "@/lib/theme/themes";

export interface Especialidad {
  value: string;
  label: string;
  vertical: VerticalPreset;
}

export const ESPECIALIDADES: Especialidad[] = [
  // Estética / dermo
  { value: "medicina_estetica", label: "Medicina estética", vertical: "estetica" },
  { value: "dermatologia", label: "Dermatología", vertical: "estetica" },
  { value: "cirugia_plastica", label: "Cirugía plástica y reparadora", vertical: "estetica" },
  { value: "medicina_capilar", label: "Medicina e injerto capilar", vertical: "estetica" },
  { value: "spa_wellness", label: "Spa / Wellness", vertical: "estetica" },
  // Dental
  { value: "odontologia", label: "Odontología general", vertical: "dental" },
  { value: "ortodoncia", label: "Ortodoncia", vertical: "dental" },
  { value: "implantologia", label: "Implantología", vertical: "dental" },
  { value: "odontopediatria", label: "Odontopediatría", vertical: "dental" },
  { value: "periodoncia", label: "Periodoncia y endodoncia", vertical: "dental" },
  // Fisio / movimiento
  { value: "fisioterapia", label: "Fisioterapia", vertical: "fisioterapia" },
  { value: "osteopatia", label: "Osteopatía", vertical: "fisioterapia" },
  { value: "podologia", label: "Podología", vertical: "fisioterapia" },
  { value: "rehabilitacion", label: "Rehabilitación", vertical: "fisioterapia" },
  { value: "medicina_deportiva", label: "Medicina deportiva", vertical: "fisioterapia" },
  { value: "quiropractica", label: "Quiropráctica", vertical: "fisioterapia" },
  // Salud mental / habla
  { value: "psicologia", label: "Psicología", vertical: "psicologia" },
  { value: "psiquiatria", label: "Psiquiatría", vertical: "psicologia" },
  { value: "logopedia", label: "Logopedia", vertical: "psicologia" },
  { value: "terapia_ocupacional", label: "Terapia ocupacional", vertical: "psicologia" },
  // Veterinaria
  { value: "veterinaria", label: "Veterinaria", vertical: "veterinaria" },
  // General / médica
  { value: "medicina_general", label: "Medicina general / familiar", vertical: "general" },
  { value: "pediatria", label: "Pediatría", vertical: "general" },
  { value: "ginecologia", label: "Ginecología y obstetricia", vertical: "general" },
  { value: "nutricion", label: "Nutrición y dietética", vertical: "general" },
  { value: "endocrinologia", label: "Endocrinología", vertical: "general" },
  { value: "oftalmologia", label: "Oftalmología", vertical: "general" },
  { value: "otorrino", label: "Otorrinolaringología", vertical: "general" },
  { value: "traumatologia", label: "Traumatología", vertical: "general" },
  { value: "cardiologia", label: "Cardiología", vertical: "general" },
  { value: "ginecologia_estetica", label: "Reproducción asistida", vertical: "general" },
  { value: "medicina_natural", label: "Acupuntura / Medicina natural", vertical: "general" },
];

/** Especialidades agrupadas por vertical, para un <optgroup> ordenado. */
export const ESPECIALIDADES_POR_VERTICAL: Record<VerticalPreset, Especialidad[]> = {
  estetica: ESPECIALIDADES.filter((e) => e.vertical === "estetica"),
  dental: ESPECIALIDADES.filter((e) => e.vertical === "dental"),
  fisioterapia: ESPECIALIDADES.filter((e) => e.vertical === "fisioterapia"),
  psicologia: ESPECIALIDADES.filter((e) => e.vertical === "psicologia"),
  veterinaria: ESPECIALIDADES.filter((e) => e.vertical === "veterinaria"),
  general: ESPECIALIDADES.filter((e) => e.vertical === "general"),
};

const BY_VALUE = new Map(ESPECIALIDADES.map((e) => [e.value, e]));

export function verticalDeEspecialidad(value: string): VerticalPreset | null {
  return BY_VALUE.get(value)?.vertical ?? null;
}

export function labelDeEspecialidad(value: string | null | undefined): string | null {
  if (!value) return null;
  return BY_VALUE.get(value)?.label ?? null;
}
