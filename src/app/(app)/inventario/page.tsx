import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { InventarioView } from "@/components/modules/inventario/inventario-view";

export const metadata = { title: "Inventario — Clinicomatic" };

export default async function InventarioPage() {
  const supabase = await createClient();

  const [productosRes, bajosRes] = await Promise.all([
    supabase
      .from("inventory_products")
      .select("*")
      .eq("activo", true)
      .order("nombre"),
    supabase.from("v_stock_bajo").select("*"),
  ]);

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Inventario" />
      <div className="flex-1 p-4 md:p-6">
        <InventarioView
          productos={productosRes.data ?? []}
          productosBajos={bajosRes.data ?? []}
        />
      </div>
    </div>
  );
}
