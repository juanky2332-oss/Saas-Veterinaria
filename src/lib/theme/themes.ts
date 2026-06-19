/**
 * Sistema de marca re-tematizable por tenant (Veteriblandenguer SaaS).
 *
 * Cada clínica puede tener su propio color. El tema se inyecta como variables CSS
 * sobre el shell de la app, sin tocar el CSS base.
 */

import type { CSSProperties } from "react";

export interface BrandTheme {
  label: string;
  brand: string;
  brandStrong: string;
  brandSoft: string;
  brandTint: string;
  brandDeep: string;
  accent: string;
  accentTint: string;
  bg?: string;
  surface2?: string;
  border?: string;
  text?: string;
  textSoft?: string;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("");
}

function mix(a: string, b: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(
    r1 + (r2 - r1) * amount,
    g1 + (g2 - g1) * amount,
    b1 + (b2 - b1) * amount,
  );
}

const WHITE = "#ffffff";
const BLACK = "#000000";

export function lighten(hex: string, amount: number): string {
  return mix(hex, WHITE, amount);
}
export function darken(hex: string, amount: number): string {
  return mix(hex, BLACK, amount);
}

export function buildThemeFromColors(opts: {
  label?: string;
  primary: string;
  accent?: string;
}): BrandTheme {
  const { primary } = opts;
  const accent = opts.accent ?? "#4CAF82";
  return {
    label: opts.label ?? "Personalizado",
    brand: primary,
    brandStrong: darken(primary, 0.18),
    brandSoft: lighten(primary, 0.42),
    brandTint: lighten(primary, 0.86),
    brandDeep: darken(primary, 0.66),
    accent,
    accentTint: lighten(accent, 0.84),
  };
}

/** Verde veterinario — tema por defecto de Veteriblandenguer. */
export const VETERINARIA: BrandTheme = {
  label: "Verde veterinario",
  brand: "#2E8B57",
  brandStrong: "#25714A",
  brandSoft: "#6BB88A",
  brandTint: "#E8F5EE",
  brandDeep: "#0F3D26",
  accent: "#4CAF82",
  accentTint: "#E4F5EC",
};

/** Ámbar cálido — alternativa natural. */
export const AMBAR: BrandTheme = {
  label: "Ámbar natural",
  brand: "#C07A2E",
  brandStrong: "#99601F",
  brandSoft: "#DDB079",
  brandTint: "#F8EDDE",
  brandDeep: "#4A2F10",
  accent: "#5A9E7C",
  accentTint: "#E4F1EA",
};

/** Azul clínico — para clínicas que prefieren look más hospitalario. */
export const AZUL_CLINICO: BrandTheme = {
  label: "Azul clínico",
  brand: "#1E6FD9",
  brandStrong: "#1857AD",
  brandSoft: "#8FB8EC",
  brandTint: "#E7F0FC",
  brandDeep: "#0C2747",
  accent: "#22B8C4",
  accentTint: "#E2F7F9",
};

export type VerticalPreset = "veterinaria" | "exoticos" | "equina";

export const PRESET_BY_VERTICAL: Record<string, BrandTheme> = {
  veterinaria: VETERINARIA,
  exoticos:    AMBAR,
  equina:      AZUL_CLINICO,
};

export const ALL_PRESETS: BrandTheme[] = [VETERINARIA, AMBAR, AZUL_CLINICO];

export function themeToStyle(theme: BrandTheme): CSSProperties {
  const vars: Record<string, string> = {
    "--brand":       theme.brand,
    "--brand-strong": theme.brandStrong,
    "--brand-soft":  theme.brandSoft,
    "--brand-tint":  theme.brandTint,
    "--brand-deep":  theme.brandDeep,
    "--accent":      theme.accent,
    "--accent-tint": theme.accentTint,
  };
  if (theme.bg)        vars["--bg"]        = theme.bg;
  if (theme.surface2)  vars["--surface-2"] = theme.surface2;
  if (theme.border)    vars["--border"]    = theme.border;
  if (theme.text)      vars["--text"]      = theme.text;
  if (theme.textSoft)  vars["--text-soft"] = theme.textSoft;
  return vars as CSSProperties;
}

export function resolveTenantTheme(input: {
  vertical?: VerticalPreset | null;
  brandColor?: string | null;
  accentColor?: string | null;
}): BrandTheme {
  if (input.brandColor) {
    return buildThemeFromColors({
      primary: input.brandColor,
      accent:  input.accentColor ?? undefined,
    });
  }
  return PRESET_BY_VERTICAL[input.vertical ?? "veterinaria"] ?? VETERINARIA;
}
