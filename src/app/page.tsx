'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay usuario autenticado o es invitado
    const currentUser = localStorage.getItem('currentUser');
    const userType = localStorage.getItem('userType');
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    
    if (currentUser) {
      // Usuario autenticado, ir al home
      router.push('/home');
    } else if (userType === 'guest') {
      // Usuario invitado, ir al home
      router.push('/home');
    } else if (hasSeenOnboarding) {
      // Ya vio el onboarding pero no está autenticado, ir al login
      router.push('/login');
    } else {
      // Primera vez, ir al onboarding
      router.push('/onboarding');
    }
  }, [router]);

  // Mostrar loading mientras se hace la redirección
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">E</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Encárgate</h1>
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent mx-auto"></div>
      </div>
    </div>
  );
}
