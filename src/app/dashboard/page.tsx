'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, isLoading, isClient, isProvider } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      // Redirigir según el tipo de usuario
      if (isClient()) {
        router.push('/home');
      } else if (isProvider()) {
        router.push('/provider-home');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, isClient, isProvider, router]);

  // Mostrar loading mientras se determina la redirección
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}
