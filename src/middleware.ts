import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  const path = request.nextUrl.pathname;

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/', '/login', '/register', '/onboarding', '/home'];
  
  // Rutas solo para administradores
  const adminOnlyPaths = ['/admin'];
  
  // Rutas solo para clientes
  const clientOnlyPaths = [
    '/booking',
    '/checkout',
    '/payment-success',
    '/orders',
    '/profile',
    '/search',
    '/category',
    '/encargado',
    '/rate-order',
    '/notifications',
  ];

  // Rutas solo para proveedores
  const providerOnlyPaths = [
    '/provider-home',
    '/provider-orders',
    '/provider-earnings',
    '/provider-profile',
  ];

  // Si es una ruta pública, permitir acceso
  if (publicPaths.some(p => path === p)) {
    return NextResponse.next();
  }

  // Si no hay token, redirigir a login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verificar si es una ruta de admin y el usuario NO es admin
  if (adminOnlyPaths.some(p => path.startsWith(p)) && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Verificar si es una ruta de cliente y el usuario es proveedor o admin
  if (clientOnlyPaths.some(p => path.startsWith(p)) && (userRole === 'ENCARGADO' || userRole === 'ADMIN')) {
    if (userRole === 'ENCARGADO') {
      return NextResponse.redirect(new URL('/provider-home', request.url));
    } else {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Verificar si es una ruta de proveedor y el usuario es cliente o admin
  if (providerOnlyPaths.some(p => path.startsWith(p)) && (userRole === 'CLIENTE' || userRole === 'ADMIN')) {
    if (userRole === 'CLIENTE') {
      return NextResponse.redirect(new URL('/home', request.url));
    } else {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
