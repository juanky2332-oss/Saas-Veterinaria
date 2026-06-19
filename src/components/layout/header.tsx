"use client";

import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  title?: string;
  actions?: React.ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  return (
    <header className="flex items-center gap-4 border-b border-[var(--lino)] bg-[var(--blanco-calido)] px-4 md:px-6 py-3 h-14 shrink-0">
      {title && (
        <h1 className="text-lg font-display font-semibold text-[var(--tinta)] shrink-0 hidden md:block">
          {title}
        </h1>
      )}

      {/* Search — se expande para ocupar el espacio */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={14} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tinta-suave)]" />
          <input
            aria-label="Buscar paciente o cita"
            placeholder="Buscar paciente, cita…"
            className="h-8 w-full rounded-[10px] border border-transparent bg-[var(--arena)] pl-8 pr-3 text-sm text-[var(--tinta)] placeholder:text-[var(--tinta-suave)] transition-all duration-150 focus:bg-white focus:border-[var(--oliva)] focus:ring-2 focus:ring-[rgba(117,128,107,.2)] focus:outline-none"
          />
        </div>
      </div>

      {/* Actions slot */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      <div className="flex items-center gap-2 ml-auto">
        <button
          aria-label="Notificaciones"
          className="relative rounded-[10px] p-2 text-[var(--tinta-suave)] transition-colors hover:bg-[var(--arena)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oliva)]"
        >
          <Bell size={17} strokeWidth={1.75} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--terracota)]" />
        </button>
        <Avatar className="h-7 w-7 cursor-pointer" aria-label="Perfil">
          <AvatarFallback className="text-[10px]">DR</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
