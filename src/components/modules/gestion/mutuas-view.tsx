"use client";

import { EntidadCrud, type CampoCrud, type ColumnaCrud } from "./entidad-crud";
import { crearMutua, eliminarMutua } from "@/app/actions/gestion";

interface Mutua {
  id: string;
  nombre: string;
  cif: string | null;
  telefono: string | null;
  email: string | null;
  descuento_pct: number | null;
}

const CAMPOS: CampoCrud[] = [
  { name: "nombre", label: "Nombre de la mutua", required: true, placeholder: "p. ej. Sanitas", ancho: "full" },
  { name: "cif", label: "CIF" },
  { name: "telefono", label: "Teléfono" },
  { name: "email", label: "Email", type: "email" },
  { name: "descuento_pct", label: "Descuento concertado (%)", type: "number", placeholder: "p. ej. 15" },
  { name: "condiciones", label: "Condiciones", type: "textarea", ancho: "full", placeholder: "Copago, autorizaciones, observaciones…" },
];

const COLS: ColumnaCrud<Mutua>[] = [
  { key: "nombre", label: "Mutua", render: (r) => <span className="font-semibold">{r.nombre}</span> },
  { key: "cif", label: "CIF" },
  { key: "telefono", label: "Teléfono" },
  { key: "email", label: "Email" },
  { key: "descuento_pct", label: "Dto.", alinear: "right", render: (r) => (r.descuento_pct != null ? `${r.descuento_pct}%` : "—") },
];

export function MutuasView({ rows }: { rows: Mutua[] }) {
  return (
    <EntidadCrud
      titulo="Mutuas"
      descripcion="Aseguradoras y entidades concertadas con tu clínica."
      addLabel="Nueva mutua"
      rows={rows}
      campos={CAMPOS}
      columnas={COLS}
      crear={crearMutua}
      eliminar={eliminarMutua}
      vacioTexto="Aún no has registrado mutuas. Añade la primera para asociarla a tus pacientes."
    />
  );
}
