import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://Veteriblandenguer.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/pacientes",
          "/agenda",
          "/whatsapp",
          "/crm",
          "/inventario",
          "/facturacion",
          "/configuracion",
          "/onboarding",
          "/api/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
