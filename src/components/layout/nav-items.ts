import {
  LayoutDashboard,
  Users,
  PawPrint,
  CalendarDays,
  MessageCircle,
  Syringe,
  Bug,
  ClipboardList,
  Pill,
  Package,
  FileText,
  Receipt,
  Wallet,
  Truck,
  BarChart3,
  Handshake,
  Stethoscope,
} from "lucide-react";
import type { FeatureKey, FeatureState } from "@/lib/features";

export type Seccion = "Clínica" | "Comunicación" | "Finanzas" | "Gestión" | "Análisis";

export const SECCIONES: Seccion[] = ["Clínica", "Comunicación", "Finanzas", "Gestión", "Análisis"];

export interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: typeof LayoutDashboard;
  feature?: FeatureKey;
  seccion: Seccion;
  secundario?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  // ── Clínica ──
  { href: "/dashboard",     label: "Dashboard",        shortLabel: "Inicio",  icon: LayoutDashboard, seccion: "Clínica" },
  { href: "/mascotas",      label: "Mascotas",                                icon: PawPrint,        seccion: "Clínica" },
  { href: "/clientes",      label: "Clientes",         shortLabel: "Clientes",icon: Users,           feature: "clientes",          seccion: "Clínica" },
  { href: "/agenda",        label: "Agenda",                                   icon: CalendarDays,    feature: "agenda",            seccion: "Clínica" },
  { href: "/vacunaciones",  label: "Vacunaciones",                             icon: Syringe,         feature: "vacunaciones",      seccion: "Clínica", secundario: true },
  { href: "/desparasitaciones", label: "Desparasitaciones",                    icon: Bug,             feature: "desparasitaciones", seccion: "Clínica", secundario: true },
  { href: "/historia-clinica",  label: "Historia clínica",                     icon: ClipboardList,   feature: "historia_clinica",  seccion: "Clínica", secundario: true },
  { href: "/recetas",       label: "Recetas",                                  icon: Pill,            feature: "recetas",           seccion: "Clínica", secundario: true },
  // ── Comunicación ──
  { href: "/whatsapp",      label: "WhatsApp",         shortLabel: "Chat",    icon: MessageCircle,   feature: "whatsapp",          seccion: "Comunicación" },
  // ── Finanzas ──
  { href: "/presupuestos",  label: "Presupuestos",                             icon: FileText,        feature: "presupuestos",      seccion: "Finanzas" },
  { href: "/facturacion",   label: "Facturación",                              icon: Receipt,         feature: "facturacion",       seccion: "Finanzas" },
  { href: "/caja",          label: "Caja",                                     icon: Wallet,          feature: "caja",              seccion: "Finanzas" },
  // ── Gestión ──
  { href: "/configuracion/tratamientos", label: "Servicios", shortLabel: "Servicios", icon: Stethoscope, seccion: "Gestión", secundario: true },
  { href: "/inventario",    label: "Inventario",                               icon: Package,         feature: "inventario",        seccion: "Gestión" },
  { href: "/proveedores",   label: "Proveedores",                              icon: Truck,           feature: "proveedores",       seccion: "Gestión", secundario: true },
  // ── Análisis ──
  { href: "/analitica",     label: "Analítica",                                icon: BarChart3,       feature: "analitica",         seccion: "Análisis" },
  { href: "/afiliados",     label: "Afiliados",                                icon: Handshake,       seccion: "Análisis",          secundario: true },
];

export function visibleNavItems(features?: Partial<FeatureState>): NavItem[] {
  return NAV_ITEMS.filter((it) => !it.feature || features?.[it.feature] !== false);
}

export function navItemsBySeccion(
  features?: Partial<FeatureState>,
  opts?: { todos?: boolean },
): { seccion: Seccion; items: NavItem[] }[] {
  const visibles = visibleNavItems(features).filter((it) => opts?.todos || !it.secundario);
  return SECCIONES
    .map((seccion) => ({ seccion, items: visibles.filter((it) => it.seccion === seccion) }))
    .filter((g) => g.items.length > 0);
}

export function secondaryNavItems(features?: Partial<FeatureState>): NavItem[] {
  return visibleNavItems(features).filter((it) => it.secundario);
}
