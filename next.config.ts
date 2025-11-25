import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fast Refresh habilitado para mejor experiencia de desarrollo
  reactStrictMode: true,
  // Configuración vacía para Turbopack (silencia el warning)
  turbopack: {},
  // Excluir archivos de Supabase functions del build de TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  // Disable typed routes
  typedRoutes: false,
};

export default nextConfig;
