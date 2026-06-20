"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Settings, LogOut, ChevronLeft, ChevronRight, ChevronDown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useSidebar } from "./sidebar-context";
import type { FeatureState } from "@/lib/features";
import { navItemsBySeccion, secondaryNavItems, type NavItem } from "./nav-items";

export function Sidebar({
  clinicName = "Veteriblandenguer",
  logoUrl = null,
  features,
  isSuperadmin = false,
}: {
  clinicName?: string;
  logoUrl?: string | null;
  features?: Partial<FeatureState>;
  isSuperadmin?: boolean;
} = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { collapsed, toggle } = useSidebar();
  const grupos = navItemsBySeccion(features);
  const secundarios = secondaryNavItems(features);
  const [verMas, setVerMas] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const renderLink = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          "group relative flex items-center gap-3 rounded-[12px] px-3 py-2.5",
          "text-sm font-semibold transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]",
          isActive
            ? "gradient-brand text-white shadow-[0_8px_18px_-8px_rgba(79,70,229,.5)]"
            : "text-[var(--text-soft)] hover:bg-[var(--brand-tint)]/60 hover:text-[var(--text)]",
          collapsed && "justify-center px-0 mx-0 w-full"
        )}
      >
        <Icon size={18} strokeWidth={1.85} className={cn("shrink-0 transition-colors", isActive ? "text-white" : "text-current")} />
        <span className={cn("whitespace-nowrap overflow-hidden transition-all duration-300", collapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
          {item.label}
        </span>
        {collapsed && (
          <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-[8px] bg-[var(--tinta)] px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-[var(--shadow-pop)] group-hover:opacity-100 transition-opacity duration-150">
            {item.label}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col bg-[var(--arena)] border-r border-[var(--lino)]",
        "transition-all duration-300 ease-out",
        collapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-[var(--lino)]",
        "transition-all duration-300",
        collapsed ? "px-0 py-4 justify-center" : "px-5 py-5 gap-2.5"
      )}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-[10px] object-cover" />
        ) : (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--brand)] text-white text-[15px] font-display font-bold"
            aria-hidden
          >
            {clinicName.charAt(0).toUpperCase()}
          </span>
        )}
        <span
          className={cn(
            "text-[15px] font-display font-semibold text-[var(--tinta)] whitespace-nowrap overflow-hidden",
            "transition-all duration-300",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}
        >
          {clinicName}
        </span>
      </div>

      {/* Navigation — agrupada por secciones */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {grupos.map((grupo) => (
          <div key={grupo.seccion} className="mb-2">
            {collapsed ? (
              <div className="mx-auto my-1.5 h-px w-6 bg-[var(--lino)]" />
            ) : (
              <p className="px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--tinta-suave)]/70">
                {grupo.seccion}
              </p>
            )}
            <div className="space-y-0.5">{grupo.items.map(renderLink)}</div>
          </div>
        ))}

        {/* Más opciones (secundarios: Recetas, Tratamientos, Mutuas, Proveedores…) */}
        {secundarios.length > 0 && (collapsed ? (
          <div className="mb-2">
            <div className="mx-auto my-1.5 h-px w-6 bg-[var(--lino)]" />
            <div className="space-y-0.5">{secundarios.map(renderLink)}</div>
          </div>
        ) : (
          <div className="mb-2">
            <button
              onClick={() => setVerMas((v) => !v)}
              className="flex w-full items-center justify-between rounded-[8px] px-3 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--tinta-suave)]/70 transition-colors hover:text-[var(--tinta)]"
            >
              Más opciones
              <ChevronDown size={12} className={cn("transition-transform", verMas && "rotate-180")} />
            </button>
            {verMas && <div className="space-y-0.5">{secundarios.map(renderLink)}</div>}
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-[var(--lino)] px-2 py-2 space-y-0.5">
        {isSuperadmin && (
          <Link
            href="/superadmin"
            title={collapsed ? "Panel de plataforma" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5",
              "text-sm font-semibold text-violet-700 transition-all duration-150 hover:bg-violet-100",
              collapsed && "justify-center px-0 mx-0 w-full",
            )}
          >
            <ShieldCheck size={18} strokeWidth={1.75} className="shrink-0" />
            <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-300", collapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
              Panel de plataforma
            </span>
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-[8px] bg-[var(--tinta)] px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-[var(--shadow-pop)] group-hover:opacity-100 transition-opacity duration-150">
                Panel de plataforma
              </span>
            )}
          </Link>
        )}
        <Link
          href="/configuracion"
          title={collapsed ? "Configuración" : undefined}
          className={cn(
            "group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5",
            "text-sm font-semibold transition-all duration-150",
            pathname.startsWith("/configuracion")
              ? "bg-[var(--salvia-tint)] text-[var(--oliva-oscuro)]"
              : "text-[var(--tinta-suave)] hover:bg-[var(--lino)]/60 hover:text-[var(--tinta)]",
            collapsed && "justify-center px-0 mx-0 w-full"
          )}
        >
          <Settings size={18} strokeWidth={1.75} className="shrink-0" />
          <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-300", collapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
            Configuración
          </span>
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-[8px] bg-[var(--tinta)] px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-[var(--shadow-pop)] group-hover:opacity-100 transition-opacity duration-150">
              Configuración
            </span>
          )}
        </Link>

        <button
          onClick={handleLogout}
          title={collapsed ? "Cerrar sesión" : undefined}
          className={cn(
            "group relative flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5",
            "text-sm font-semibold text-[var(--tinta-suave)] transition-all duration-150",
            "hover:bg-[var(--error-tint)] hover:text-[var(--error)]",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut size={18} strokeWidth={1.75} className="shrink-0" />
          <span className={cn("overflow-hidden whitespace-nowrap transition-all duration-300", collapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
            Cerrar sesión
          </span>
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-[8px] bg-[var(--tinta)] px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-[var(--shadow-pop)] group-hover:opacity-100 transition-opacity duration-150">
              Cerrar sesión
            </span>
          )}
        </button>
      </div>

      {/* Toggle button */}
      <button
        onClick={toggle}
        aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        className={cn(
          "absolute -right-3 top-[72px] z-10",
          "flex h-6 w-6 items-center justify-center",
          "rounded-full border border-[var(--lino)] bg-[var(--blanco-calido)]",
          "text-[var(--tinta-suave)] shadow-[var(--shadow-card)]",
          "hover:bg-[var(--arena)] hover:text-[var(--oliva)]",
          "transition-all duration-200"
        )}
      >
        {collapsed
          ? <ChevronRight size={12} strokeWidth={2.5} />
          : <ChevronLeft size={12} strokeWidth={2.5} />
        }
      </button>
    </aside>
  );
}
