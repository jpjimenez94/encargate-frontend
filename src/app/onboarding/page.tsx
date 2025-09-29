'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';

const onboardingSteps = [
  {
    id: 1,
    title: "Hazlo fácil, nosotros nos encargamos",
    description: "Encuentra profesionales confiables para cualquier tarea del hogar. Desde plomería hasta limpieza, todo en un solo lugar.",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop&auto=format",
    bgImage: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1200&h=800&fit=crop&auto=format",
    primaryColor: "bg-orange-500"
  },
  {
    id: 2,
    title: "Profesionales verificados",
    description: "Todos nuestros encargados están verificados y tienen experiencia comprobada en sus áreas.",
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&h=600&fit=crop&auto=format",
    bgImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=800&fit=crop&auto=format",
    primaryColor: "bg-blue-500"
  },
  {
    id: 3,
    title: "Reserva en segundos",
    description: "Agenda tu servicio de manera rápida y sencilla. Paga de forma segura y recibe confirmación inmediata.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&auto=format",
    bgImage: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=800&fit=crop&auto=format",
    primaryColor: "bg-green-500"
  },
  {
    id: 4,
    title: "Elige una cuenta",
    description: "Selecciona el tipo de cuenta que mejor se adapte a tus necesidades.",
    image: null,
    bgImage: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=800&fit=crop&auto=format",
    primaryColor: "bg-purple-500",
    isAccountSelection: true
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('hasSeenOnboarding', 'true');
      router.push('/register');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // Marcar como usuario invitado y que ya vio el onboarding
    localStorage.setItem('userType', 'guest');
    localStorage.setItem('hasSeenOnboarding', 'true');
    router.push('/home');
  };

  const handleGetStarted = () => {
    // Marcar que ya vio el onboarding e ir al registro
    localStorage.setItem('hasSeenOnboarding', 'true');
    router.push('/register');
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto min-h-screen relative overflow-hidden"
           style={{
             backgroundImage: currentStepData.bgImage ? `url(${currentStepData.bgImage})` : 'none',
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             backgroundRepeat: 'no-repeat'
           }}>
        {/* Overlay para mejorar legibilidad */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        {/* Contenido sobre el overlay */}
        <div className="relative z-10 min-h-screen bg-white bg-opacity-95">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Encárgate</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Botón temporal para desarrollo */}
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="text-xs text-gray-400 hover:text-gray-600"
              title="Limpiar localStorage (solo desarrollo)"
            >
              🔄
            </button>
            
            <button 
              onClick={handleSkip}
              className="text-gray-500 text-sm font-medium hover:text-gray-700"
            >
              Omitir
            </button>
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center space-x-2 px-6 mb-8">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? 'w-8 bg-orange-500' 
                  : index < currentStep 
                    ? 'w-2 bg-orange-300' 
                    : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 flex-1">
          {currentStepData.isAccountSelection ? (
            /* Account Selection Step */
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {currentStepData.title}
              </h1>
              <p className="text-gray-600 mb-8">
                {currentStepData.description}
              </p>

              <div className="space-y-4">
                <button
                  onClick={handleGetStarted}
                  className="w-full py-4 bg-orange-500 text-white rounded-2xl font-semibold text-lg hover:bg-orange-600 transition-colors"
                >
                  Comenzar
                </button>
                
                <p className="text-center text-sm text-gray-600">
                  ¿Ya tienes cuenta?{' '}
                  <button 
                    onClick={() => {
                      localStorage.setItem('hasSeenOnboarding', 'true');
                      router.push('/login');
                    }}
                    className="text-orange-500 font-medium hover:text-orange-600"
                  >
                    Iniciar sesión
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* Regular Onboarding Steps */
            <div className="text-center px-6">
              {currentStepData.image && (
                <div className="mb-8 -mx-6">
                  <img 
                    src={currentStepData.image} 
                    alt={currentStepData.title}
                    className="w-full h-80 object-cover"
                  />
                  {/* Gradient overlay en la imagen */}
                  <div className="relative -mt-20 h-20 bg-gradient-to-t from-white to-transparent"></div>
                </div>
              )}

              <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
                {currentStepData.title}
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed px-4">
                {currentStepData.description}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="px-6 pb-8 mt-8">
          {!currentStepData.isAccountSelection && (
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`p-3 rounded-full transition-colors ${
                  currentStep === 0 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="flex-1 mx-4">
                <Button 
                  onClick={handleNext}
                  className="w-full"
                  size="lg"
                >
                  {currentStep === onboardingSteps.length - 1 ? 'Comenzar' : 'Siguiente'}
                </Button>
              </div>

              <button
                onClick={handleNext}
                disabled={currentStep === onboardingSteps.length - 1}
                className={`p-3 rounded-full transition-colors ${
                  currentStep === onboardingSteps.length - 1 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
