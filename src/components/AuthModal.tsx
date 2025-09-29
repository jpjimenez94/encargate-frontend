'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, UserPlus, LogIn, Star } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  title = "¡Únete a Encárgate!",
  message = "Para solicitar servicios necesitas una cuenta. Es rápido y gratuito."
}: AuthModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleRegister = () => {
    onClose();
    router.push('/register');
  };

  const handleLogin = () => {
    onClose();
    router.push('/login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-sm mx-4 w-full animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <Star className="w-8 h-8 text-white" />
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            {title}
          </h2>
          
          {/* Message */}
          <p className="text-gray-600 text-center text-sm leading-relaxed">
            {message}
          </p>
        </div>
        
        {/* Benefits */}
        <div className="px-6 pb-4">
          <div className="bg-orange-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">¿Por qué registrarte?</h3>
            <ul className="space-y-1 text-xs text-gray-600">
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></div>
                Solicita servicios de forma segura
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></div>
                Guarda tus encargados favoritos
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></div>
                Historial de pedidos y reseñas
              </li>
            </ul>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-6 pt-0 space-y-3">
          <button
            onClick={handleRegister}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
          >
            <UserPlus className="w-5 h-5" />
            <span>Crear cuenta gratis</span>
          </button>
          
          <button
            onClick={handleLogin}
            className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <LogIn className="w-5 h-5" />
            <span>Ya tengo cuenta</span>
          </button>
        </div>
        
        {/* Footer */}
        <div className="px-6 pb-6">
          <p className="text-xs text-gray-500 text-center">
            Al registrarte aceptas nuestros términos y condiciones
          </p>
        </div>
      </div>
    </div>
  );
}
