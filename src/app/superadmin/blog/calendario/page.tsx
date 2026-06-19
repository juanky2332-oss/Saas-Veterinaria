import { createServiceClient } from "@/lib/supabase/server";
import { PageTitle } from "../../_components/ui";
import { CalendarioClient, type Programado, type Cat } from "./calendario-client";

export const dynamic = "force-dynamic";

export default async function CalendarioEditorialPage() {
  const supabase = createServiceClient();
  const [postsRes, catsRes] = await Promise.all([
    supabase.from("blog_posts").select("id, titulo, slug, status, target_keyword, scheduled_at, ai_generated, category_id").in("status", ["scheduled", "draft", "generation_failed"]).order("scheduled_at", { ascending: true, nullsFirst: false }).limit(300),
    supabase.from("blog_categories").select("id, slug, nombre").order("orden"),
  ]);

  const catName = new Map((catsRes.data ?? []).map((c) => [c.id, c.nombre]));
  const programados: Programado[] = (postsRes.data ?? []).map((p) => ({
    id: p.id,
    titulo: p.titulo,
    status: p.status,
    keyword: p.target_keyword,
    scheduled_at: p.scheduled_at,
    ai_generated: p.ai_generated,
    categoria: p.category_id ? catName.get(p.category_id) ?? "—" : "—",
  }));
  const cats: Cat[] = (catsRes.data ?? []).map((c) => ({ slug: c.slug, nombre: c.nombre }));

  return (
    <div>
      <PageTitle title="Calendario editorial" subtitle="Carga temas con fecha y deja que la IA genere y publique cada artículo automáticamente." />
      <CalendarioClient programados={programados} cats={cats} />
    </div>
  );
}
