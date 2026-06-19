"use client";

import { ImageIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface Props { mascotaId: string }

export function TabFotos({ mascotaId: _ }: Props) {
  return (
    <EmptyState
      icon={ImageIcon}
      title="Galería de fotos"
      description="La subida de imágenes clínicas estará disponible en la próxima versión."
    />
  );
}
