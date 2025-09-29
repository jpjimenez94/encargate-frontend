/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignorar errores de ESLint durante el build de producción
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar errores de TypeScript durante el build de producción
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },
  images: {
    domains: ['images.unsplash.com', 'ui-avatars.com'],
  },
  // Configuración experimental para mejor manejo de Suspense
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig
