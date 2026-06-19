"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabInfo }          from "./tabs/tab-info";
import { TabHistorial }     from "./tabs/tab-historial";
import { TabVacunaciones }  from "./tabs/tab-vacunaciones";
import { TabFotos }         from "./tabs/tab-fotos";
import { TabFacturacion }   from "./tabs/tab-facturacion";
import type { FeatureState } from "@/lib/features";

type Mascota = {
  id: string;
  nombre: string;
  especie: string;
  raza: string | null;
  fecha_nacimiento: string | null;
  sexo: string | null;
  color: string | null;
  peso_kg: number | null;
  num_chip: string | null;
  esterilizado: boolean;
  alergias: string | null;
  observaciones: string | null;
  cliente_id: string | null;
  clientes: { id: string; nombre: string; apellidos: string | null; telefono: string | null; email: string | null } | null;
};

type HistoriaEntry = {
  id: string;
  fecha: string;
  motivo: string | null;
  diagnostico: string | null;
  tratamiento: string | null;
  observaciones: string | null;
};

type Vacunacion = {
  id: string;
  vacuna: string;
  fabricante: string | null;
  fecha_aplicacion: string;
  fecha_proxima: string | null;
  notas: string | null;
};

type Desparasitacion = {
  id: string;
  tipo: string;
  producto: string | null;
  fecha_aplicacion: string;
  fecha_proxima: string | null;
};

interface Props {
  mascota: Mascota;
  historia: HistoriaEntry[];
  vacunaciones: Vacunacion[];
  desparasitaciones: Desparasitacion[];
  features: FeatureState;
}

export function FichaMascota({ mascota, historia, vacunaciones, desparasitaciones, features }: Props) {
  const tabs = [
    { value: "info",       label: "Ficha",            show: features.ficha_info },
    { value: "historial",  label: "Historial",         show: features.ficha_historial },
    { value: "vacunas",    label: "Vacunas",           show: features.ficha_vacunaciones },
    { value: "fotos",      label: "Fotos",             show: features.ficha_fotos },
    { value: "facturacion",label: "Facturación",       show: features.ficha_facturacion },
  ].filter((t) => t.show);

  return (
    <Tabs defaultValue={tabs[0]?.value ?? "info"} className="space-y-4">
      <TabsList>
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="info">
        <TabInfo mascota={mascota} />
      </TabsContent>

      <TabsContent value="historial">
        <TabHistorial mascotaId={mascota.id} historia={historia} />
      </TabsContent>

      <TabsContent value="vacunas">
        <TabVacunaciones
          mascotaId={mascota.id}
          vacunaciones={vacunaciones}
          desparasitaciones={desparasitaciones}
        />
      </TabsContent>

      <TabsContent value="fotos">
        <TabFotos mascotaId={mascota.id} />
      </TabsContent>

      <TabsContent value="facturacion">
        <TabFacturacion clienteId={mascota.cliente_id} />
      </TabsContent>
    </Tabs>
  );
}
