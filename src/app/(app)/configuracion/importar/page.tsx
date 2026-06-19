"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Estado = "idle" | "subiendo" | "mapeando" | "validando" | "importando" | "hecho" | "error";

interface ResumenImportacion {
  total: number;
  importados: number;
  duplicados: number;
  errores: { fila: number; campo: string; mensaje: string }[];
}

export default function ImportarPage() {
  const [estado, setEstado] = useState<Estado>("idle");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resumen, setResumen] = useState<ResumenImportacion | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivo(file);
    setEstado("mapeando");
  }

  async function iniciarImportacion() {
    if (!archivo) return;
    setEstado("importando");

    // TODO: implementar cuando el cliente provea export real de Clinic Cloud
    // Por ahora simula el proceso
    await new Promise((r) => setTimeout(r, 2000));

    setResumen({
      total: 0,
      importados: 0,
      duplicados: 0,
      errores: [
        { fila: 0, campo: "sistema", mensaje: "Importador pendiente de configurar con export real de Clinic Cloud" },
      ],
    });
    setEstado("hecho");
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Importar desde Clinic Cloud" />
      <div className="flex-1 p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <Link
            href="/configuracion"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--tinta-suave)] hover:text-[var(--oliva)]"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Volver a configuración
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Importador desde Clinic Cloud</CardTitle>
              <CardDescription>
                Sube el Excel exportado desde Clinic Cloud. El proceso importa pacientes, historial de visitas y tratamientos.
                Los consentimientos en papel se suben manualmente desde la ficha de cada paciente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {estado === "idle" && (
                <label className="flex flex-col items-center justify-center gap-3 rounded-[16px] border-2 border-dashed border-[var(--lino)] bg-[var(--arena)] px-6 py-10 cursor-pointer hover:bg-[var(--lino)]/50 transition-colors">
                  <FileSpreadsheet size={32} strokeWidth={1.5} className="text-[var(--salvia)]" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[var(--tinta)]">Arrastra el Excel aquí</p>
                    <p className="text-xs text-[var(--tinta-suave)] mt-0.5">o haz clic para seleccionar el archivo (.xlsx, .xls)</p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="sr-only"
                    onChange={onFileChange}
                  />
                </label>
              )}

              {estado === "mapeando" && archivo && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-[12px] bg-[var(--salvia-tint)] p-3">
                    <FileSpreadsheet size={18} strokeWidth={1.75} className="text-[var(--oliva)]" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--tinta)]">{archivo.name}</p>
                      <p className="text-xs text-[var(--tinta-suave)]">{(archivo.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[var(--tinta)]">Mapeo de columnas detectado</p>
                    {[
                      { campo: "Nombre", columna: "NOMBRE_PACIENTE" },
                      { campo: "Apellidos", columna: "APELLIDOS" },
                      { campo: "Teléfono", columna: "TELEFONO" },
                      { campo: "Fecha de nacimiento", columna: "FECHA_NAC" },
                      { campo: "Email", columna: "EMAIL" },
                    ].map((m) => (
                      <div key={m.campo} className="flex items-center justify-between rounded-[8px] bg-[var(--arena)] px-3 py-2">
                        <span className="text-xs font-semibold text-[var(--tinta-suave)]">{m.campo}</span>
                        <Badge variant="muted">{m.columna}</Badge>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEstado("idle"); setArchivo(null); }}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={iniciarImportacion}>
                      Confirmar e importar
                    </Button>
                  </div>
                </div>
              )}

              {estado === "importando" && (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="h-10 w-10 rounded-full border-4 border-[var(--oliva)] border-t-transparent animate-spin mb-4" />
                  <p className="text-sm font-semibold text-[var(--tinta)]">Importando…</p>
                  <p className="text-xs text-[var(--tinta-suave)] mt-1">Validando duplicados y datos</p>
                </div>
              )}

              {estado === "hecho" && resumen && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-[12px] bg-[var(--exito-tint)] p-3 text-center">
                      <p className="text-2xl font-display font-bold text-[var(--exito)] tabular-nums">{resumen.importados}</p>
                      <p className="text-xs text-[var(--exito)]">Importados</p>
                    </div>
                    <div className="rounded-[12px] bg-[var(--aviso-tint)] p-3 text-center">
                      <p className="text-2xl font-display font-bold text-[var(--aviso)] tabular-nums">{resumen.duplicados}</p>
                      <p className="text-xs text-[var(--aviso)]">Duplicados</p>
                    </div>
                    <div className="rounded-[12px] bg-[var(--error-tint)] p-3 text-center">
                      <p className="text-2xl font-display font-bold text-[var(--error)] tabular-nums">{resumen.errores.length}</p>
                      <p className="text-xs text-[var(--error)]">Errores</p>
                    </div>
                  </div>

                  {resumen.errores.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-[var(--tinta-suave)]">Detalles de errores:</p>
                      {resumen.errores.map((e, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-[8px] bg-[var(--error-tint)] px-3 py-2">
                          <AlertTriangle size={12} strokeWidth={1.75} className="text-[var(--error)] mt-0.5 shrink-0" />
                          <p className="text-xs text-[var(--error)]">
                            {e.fila > 0 ? `Fila ${e.fila} · ` : ""}{e.campo}: {e.mensaje}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button variant="outline" size="sm" onClick={() => { setEstado("idle"); setArchivo(null); setResumen(null); }}>
                    Importar otro archivo
                  </Button>
                </div>
              )}

              <div className="rounded-[12px] bg-[var(--info-tint)] p-3">
                <p className="text-xs text-[var(--info)] font-semibold mb-1">Información importante</p>
                <ul className="text-xs text-[var(--info)] space-y-0.5 list-disc list-inside">
                  <li>Los consentimientos en papel no se migran — subir manualmente desde la ficha</li>
                  <li>Los pacientes duplicados (mismo teléfono o DNI) se omiten sin sobrescribir</li>
                  <li>Se genera un informe descargable con todos los errores al terminar</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
