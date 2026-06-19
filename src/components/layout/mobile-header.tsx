"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { FeatureState } from "@/lib/features";
import { visibleNavItems } from "./nav-items";

export function MobileHeader({
  clinicName = "Clinicomatic",
  logoUrl = null,
  features,
}: { clinicName?: string; logoUrl?: string | null; features?: Partial<FeatureState> } = {}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const navItems = visibleNavItems(features);

  // Cerrar al navegar y con ESC
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--lino)] bg-[var(--blanco-calido)] h-14">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-7 w-7 rounded-[8px] object-cover" />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--brand)] text-white text-sm font-display font-bold">
              {clinicName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="text-base font-display font-semibold text-[var(--tinta)] truncate max-w-[180px]">{clinicName}</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[var(--tinta-suave)] hover:bg-[var(--arena)] transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>
      </header>

      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-[var(--tinta)]/30 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-[var(--arena)] shadow-[var(--shadow-pop)]",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--lino)]">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-8 w-8 rounded-[10px] object-cover" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--brand)] text-white text-base font-display font-bold">
                {clinicName.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-[15px] font-display font-semibold text-[var(--tinta)] truncate max-w-[170px]">{clinicName}</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--tinta-suave)] hover:bg-[var(--lino)]/60 transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item, i) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive ? "page" : undefined}
                style={{ animationDelay: `${i * 25}ms` }}
                className={cn(
                  "flex items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-semibold transition-all duration-150",
                  isActive
                    ? "bg-[var(--salvia-tint)] text-[var(--oliva-oscuro)]"
                    : "text-[var(--tinta-suave)] hover:bg-[var(--lino)]/60 hover:text-[var(--tinta)]"
                )}
              >
                <Icon size={18} strokeWidth={1.75} className={isActive ? "text-[var(--oliva)]" : "text-current"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Configuración + Logout */}
        <div className="border-t border-[var(--lino)] px-3 py-3 space-y-0.5">
          <Link
            href="/configuracion"
            onClick={() => setOpen(false)}
            aria-current={pathname.startsWith("/configuracion") && !pathname.startsWith("/configuracion/tratamientos") ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-semibold transition-all duration-150",
              pathname === "/configuracion"
                ? "bg-[var(--salvia-tint)] text-[var(--oliva-oscuro)]"
                : "text-[var(--tinta-suave)] hover:bg-[var(--lino)]/60 hover:text-[var(--tinta)]",
            )}
          >
            <Settings size={18} strokeWidth={1.75} />
            Configuración
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-semibold text-[var(--tinta-suave)] hover:bg-[var(--error-tint)] hover:text-[var(--error)] transition-all duration-150"
          >
            <LogOut size={18} strokeWidth={1.75} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  );
}
