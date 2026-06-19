"use client";

import { EntidadCrud, type CampoCrud, type ColumnaCrud } from "./entidad-crud";
import { crearCuota, eliminarCuota } from "@/app/actions/gestion";

interface Cuota {
  id: string;
  concepto: string;
  importe: number;
  periodicidad: string;
  proximo_cobro: string | null;
  metodo: string | null;
  activo: boolean;
  patient?: { nombre: string; apellidos: string } | null;
}

const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
const fecha = (s: string | null) => (s ? new Date(s + "T00:00:00").toLocaleDateString("es-ES") : "—");

export function CuotasView({ rows, pacientes }: { rows: Cuota[]; pacientes: { value: string; label: string }[] }) {
  const CAMPOS: CampoCrud[] = [
    { name: "concepto", label: "Concepto", required: true, ancho: "full", placeholder: "p. ej. Tarifa plana fisioterapia" },
    { name: "importe", label: "Importe (€)", type: "number", required: true, placeholder: "0,00" },
    {
      name: "periodicidad",
      label: "Periodicidad",
      type: "select",
      options: [
        { value: "mensual", label: "Mensual" },
        { value: "trimestral", label: "Trimestral" },
        { value: "anual", label: "Anual" },
      ],
    },
    { name: "proximo_cobro", label: "Próximo cobro", type: "date" },
    { name: "metodo", label: "Método", placeholder: "Domiciliación, tarjeta…" },
    { name: "patient_id", label: "Paciente (opcional)", type: "select", options: pacientes },
  ];

  const COLS: ColumnaCrud<Cuota>[] = [
    { key: "concepto", label: "Concepto", render: (r) => <span className="font-semibold">{r.concepto}</span> },
    { key: "paciente", label: "Paciente", render: (r) => (r.patient ? `${r.patient.nombre} ${r.patient.apellidos}` : "—") },
    { key: "periodicidad", label: "Periodicidad", render: (r) => <span className="capitalize">{r.periodicidad}</span> },
    { key: "proximo_cobro", label: "Próximo cobro", render: (r) => fecha(r.proximo_cobro) },
    { key: "importe", label: "Importe", alinear: "right", render: (r) => eur(Number(r.importe)) },
  ];

  return (
    <EntidadCrud
      titulo="Cuotas recurrentes"
      descripcion="Cobros periódicos: tarifas planas, bonos mensuales, mantenimientos…"
      addLabel="Nueva cuota"
      rows={rows}
      campos={CAMPOS}
      columnas={COLS}
      crear={crearCuota}
      eliminar={eliminarCuota}
      vacioTexto="Aún no hay cuotas recurrentes configuradas."
    />
  );
}
