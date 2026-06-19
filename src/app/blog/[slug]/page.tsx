import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/server";
import { MarketingNav } from "@/components/marketing/nav";

export const revalidate = 300;

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://clinicomatic.app";
const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }) : "");

async function getPost(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*, blog_categories(nombre, slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Artículo no encontrado — Clinicomatic" };
  const title = post.meta_title || post.titulo;
  const description = post.meta_description || post.excerpt || undefined;
  return {
    metadataBase: new URL(base),
    title: `${title} — Clinicomatic`,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    keywords: post.tags?.length ? post.tags : undefined,
    openGraph: {
      title,
      description,
      url: `${base}/blog/${post.slug}`,
      type: "article",
      locale: "es_ES",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      tags: post.tags ?? undefined,
      images: post.featured_image_url ? [{ url: post.featured_image_url }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const categoria = post.blog_categories as { nombre?: string; slug?: string } | null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.titulo,
    description: post.meta_description || post.excerpt || undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at,
    image: post.featured_image_url ?? undefined,
    author: { "@type": "Organization", name: "Clinicomatic" },
    publisher: { "@type": "Organization", name: "Clinicomatic" },
    mainEntityOfPage: `${base}/blog/${post.slug}`,
  };

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      <MarketingNav />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="mx-auto max-w-3xl px-5 py-10 md:py-14">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-soft)] hover:text-[var(--text)]"><ArrowLeft size={15} /> Blog</Link>

        <header className="mt-5">
          {categoria?.nombre && (
            <Link href={`/blog?cat=${categoria.slug}`} className="text-sm font-semibold uppercase tracking-wide text-[var(--brand)]">{categoria.nombre}</Link>
          )}
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">{post.titulo}</h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-[var(--text-soft)]">
            <span>{fecha(post.published_at)}</span>
            <span className="inline-flex items-center gap-1"><Clock size={13} /> {post.reading_time_min} min de lectura</span>
          </div>
        </header>

        {post.featured_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.featured_image_url} alt={post.featured_image_alt ?? post.titulo} className="mt-6 aspect-video w-full rounded-[16px] object-cover" />
        )}

        <div
          className="mt-8 text-[15px] leading-relaxed text-[var(--text)] [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--brand)] [&_blockquote]:pl-4 [&_blockquote]:text-[var(--text-soft)] [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-bold [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3.5 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--border)] [&_td]:p-2 [&_th]:border [&_th]:border-[var(--border)] [&_th]:bg-[var(--surface-2)] [&_th]:p-2 [&_th]:text-left [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:text-[var(--brand-strong)] [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: post.contenido_html ?? "" }}
        />

        {post.tags?.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2 border-t border-[var(--border)] pt-6">
            {post.tags.map((t) => (
              <span key={t} className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-medium text-[var(--text-soft)]">{t}</span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 rounded-[18px] border border-[var(--border)] bg-gradient-to-br from-[var(--brand-tint)] to-transparent p-6 text-center">
          <h3 className="font-display text-xl font-bold">Gestiona tu clínica con Clinicomatic</h3>
          <p className="mt-1.5 text-sm text-[var(--text-soft)]">Agenda, pacientes, facturación con Verifactu y más. 14 días gratis, sin tarjeta.</p>
          <Link href="/signup" className="mt-4 inline-block rounded-[10px] bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-strong)]">Empezar gratis</Link>
        </div>
      </article>
    </div>
  );
}
