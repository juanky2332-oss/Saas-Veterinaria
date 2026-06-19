"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Building2, Users, Handshake, Newspaper, ArrowLeft, ShieldCheck, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/superadmin", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/superadmin/organizations", label: "Organizaciones", icon: Building2 },
  { href: "/superadmin/usuarios", label: "Usuarios", icon: Users },
  { href: "/superadmin/afiliados", label: "Afiliados", icon: Handshake },
  { href: "/superadmin/blog", label: "Blog", icon: Newspaper },
];

export function SuperadminShell({ children, nombre }: { children: React.ReactNode; nombre: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  const nav = (
    <nav className="space-y-1">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-white/15 text-white" : "text-white/65 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon size={17} className="shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh bg-[#0b1220] text-white">
      {/* Sidebar escritorio */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-[#0f1729] px-4 py-5 md:flex">
        <div>
          <div className="mb-6 flex items-center gap-2.5 px-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-600">
              <ShieldCheck size={18} />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold">Plataforma</p>
              <p className="text-[11px] text-white/55">Panel superadmin</p>
            </div>
          </div>
          {nav}
        </div>
        <div className="space-y-3">
          <p className="px-3 text-[11px] text-white/45">Sesión: {nombre}</p>
          <Link href="/dashboard" className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm text-white/65 transition-colors hover:bg-white/10 hover:text-white">
            <ArrowLeft size={16} /> Volver a mi clínica
          </Link>
        </div>
      </aside>

      {/* Cabecera móvil */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-[#0f1729] px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-violet-400" />
            <span className="font-bold">Plataforma</span>
          </div>
          <button onClick={() => setOpen((o) => !o)} aria-label="Menú" className="rounded-lg p-1.5 hover:bg-white/10">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>
        {open && (
          <div className="border-b border-white/10 bg-[#0f1729] px-4 py-3 md:hidden">
            {nav}
            <Link href="/dashboard" className="mt-2 flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm text-white/65 hover:bg-white/10 hover:text-white">
              <ArrowLeft size={16} /> Volver a mi clínica
            </Link>
          </div>
        )}

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#0b1220] px-4 py-6 md:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
