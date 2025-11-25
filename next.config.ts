import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fast Refresh habilitado para mejor experiencia de desarrollo
  reactStrictMode: true,
  // Configuración vacía para Turbopack (silencia el warning)
  turbopack: {},
};

export default nextConfig;
