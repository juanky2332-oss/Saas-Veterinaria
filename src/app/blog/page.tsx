import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/server";
import { MarketingNav } from "@/components/marketing/nav";

export const revalidate = 300;

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://clinicomatic.app";

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: "Blog — Clinicomatic | Gestión y crecimiento para clínicas",
  description: "Guías prácticas sobre gestión de clínicas, normativa (Verifactu/TicketBAI), marketing sanitario y tecnología para clínicas estéticas, dentales y médicas.",
  alternates: { canonical: "/blog" },
  openGraph: { title: "Blog de Clinicomatic", description: "Guías de gestión, normativa y marketing para clínicas.", url: `${base}/blog`, locale: "es_ES", type: "website" },
};

const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }) : "");

export default async function BlogIndexPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const supabase = createPublicClient();

  const { data: cats } = await supabase.from("blog_categories").select("id, slug, nombre").order("orden");
  let catId: string | null = null;
  if (cat) catId = (cats ?? []).find((c) => c.slug === cat)?.id ?? null;

  let query = supabase
    .from("blog_posts")
    .select("id, slug, titulo, excerpt, featured_image_url, featured_image_alt, published_at, reading_time_min, category_id")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(60);
  if (catId) query = query.eq("category_id", catId);
  const { data: posts } = await query;

  const catName = new Map((cats ?? []).map((c) => [c.id, c.nombre]));

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      <MarketingNav />
      <section className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand)]">Blog</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Ideas para hacer crecer tu clínica</h1>
          <p className="mt-3 text-lg text-[var(--text-soft)]">Gestión, normativa, marketing y tecnología — explicado para clínicas estéticas, dentales y médicas.</p>
        </div>

        {/* Categorías */}
        <div className="mt-7 flex flex-wrap gap-2">
          <Link href="/blog" className={chip(!cat)}>Todo</Link>
          {(cats ?? []).map((c) => (
            <Link key={c.id} href={`/blog?cat=${c.slug}`} className={chip(cat === c.slug)}>{c.nombre}</Link>
          ))}
        </div>

        {/* Posts */}
        {(posts ?? []).length === 0 ? (
          <div className="mt-12 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] px-5 py-16 text-center text-[var(--text-soft)]">
            Pronto publicaremos contenido. Vuelve dentro de poco.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(posts ?? []).map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="group flex flex-col overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]">
                <div className="aspect-video w-full overflow-hidden bg-[var(--surface-2)]">
                  {p.featured_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.featured_image_url} alt={p.featured_image_alt ?? p.titulo} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--brand-tint)] to-[var(--surface-2)]">
                      <span className="font-display text-3xl font-bold text-[var(--brand)]/40">Cm</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  {p.category_id && <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">{catName.get(p.category_id)}</p>}
                  <h2 className="font-display text-lg font-bold leading-snug text-[var(--text)] group-hover:text-[var(--brand-strong)]">{p.titulo}</h2>
                  {p.excerpt && <p className="mt-2 line-clamp-3 text-sm text-[var(--text-soft)]">{p.excerpt}</p>}
                  <div className="mt-4 flex items-center gap-3 text-xs text-[var(--text-soft)]">
                    <span>{fecha(p.published_at)}</span>
                    <span className="inline-flex items-center gap-1"><Clock size={12} /> {p.reading_time_min} min</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function chip(active: boolean): string {
  return `rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${active ? "bg-[var(--brand)] text-white" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-soft)] hover:text-[var(--text)]"}`;
}
