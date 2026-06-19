"use client";

import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props { clienteId: string | null }

export function TabFacturacion({ clienteId }: Props) {
  if (!clienteId) {
    return (
      <EmptyState
        icon={Receipt}
        title="Sin propietario asignado"
        description="Asigna un propietario a esta mascota para gestionar su facturación."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-soft)]">
        Las facturas se emiten a nombre del propietario de la mascota.
      </p>
      <Button asChild variant="outline">
        <Link href={`/clientes/${clienteId}`}>Ver cliente y sus facturas</Link>
      </Button>
    </div>
  );
}
