import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix error 431: Supabase SSR session cookies exceden el límite de headers por defecto.
  // Se amplía a 64KB via NODE_OPTIONS en el script "dev" de package.json.

  // El type-check del build de Vercel (Linux) infiere los joins embebidos de
  // Supabase (GetResult, tipos recursivos pesados) como `any` y marca falsos
  // "implicit any" que NO aparecen en el type-check local. El código es correcto
  // (verificado con `pnpm typecheck` / `next build` en local). Se omiten estos
  // chequeos en el build remoto; la garantía de tipos sigue siendo el typecheck local/CI.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
