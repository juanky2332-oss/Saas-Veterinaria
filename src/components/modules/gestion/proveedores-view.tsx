"use client";

import { EntidadCrud, type CampoCrud, type ColumnaCrud } from "./entidad-crud";
import { crearProveedor, eliminarProveedor } from "@/app/actions/gestion";

interface Proveedor {
  id: string;
  nombre: string;
  cif: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  categoria: string | null;
}

const CAMPOS: CampoCrud[] = [
  { name: "nombre", label: "Nombre / razón social", required: true, ancho: "full", placeholder: "p. ej. Material Dental SL" },
  { name: "cif", label: "CIF" },
  { name: "categoria", label: "Categoría", placeholder: "Material, laboratorio, limpieza…" },
  { name: "contacto", label: "Persona de contacto" },
  { name: "telefono", label: "Teléfono" },
  { name: "email", label: "Email", type: "email" },
  { name: "notas", label: "Notas", type: "textarea", ancho: "full" },
];

const COLS: ColumnaCrud<Proveedor>[] = [
  { key: "nombre", label: "Proveedor", render: (r) => <span className="font-semibold">{r.nombre}</span> },
  { key: "categoria", label: "Categoría" },
  { key: "contacto", label: "Contacto" },
  { key: "telefono", label: "Teléfono" },
  { key: "email", label: "Email" },
];

export function ProveedoresView({ rows }: { rows: Proveedor[] }) {
  return (
    <EntidadCrud
      titulo="Proveedores"
      descripcion="Proveedores de material, laboratorios y compras de la clínica."
      addLabel="Nuevo proveedor"
      rows={rows}
      campos={CAMPOS}
      columnas={COLS}
      crear={crearProveedor}
      eliminar={eliminarProveedor}
      vacioTexto="Aún no has registrado proveedores."
    />
  );
}
