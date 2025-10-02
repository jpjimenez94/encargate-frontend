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
  // Configuración de Turbopack
  turbopack: {
    root: 'C:\\Users\\juan.pjimenez\\Documents\\NEWAPP\\encargate-app',
  },
}

module.exports = nextConfig
