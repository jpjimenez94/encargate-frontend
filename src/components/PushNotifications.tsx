'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function PushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      // Mostrar prompt si el usuario está logueado y no ha dado permiso
      if (user && Notification.permission === 'default') {
        // Esperar 5 segundos antes de mostrar el prompt
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      setShowPrompt(false);
      
      if (result === 'granted') {
        // Mostrar notificación de bienvenida
        new Notification('¡Notificaciones Activadas! 🎉', {
          body: 'Recibirás actualizaciones sobre tus pedidos en tiempo real',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png'
        });
      }
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    // Guardar en localStorage que el usuario rechazó
    localStorage.setItem('notificationPromptDismissed', 'true');
  };

  // No mostrar si ya se rechazó antes
  useEffect(() => {
    const dismissed = localStorage.getItem('notificationPromptDismissed');
    if (dismissed === 'true') {
      setShowPrompt(false);
    }
  }, []);

  if (!showPrompt || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Activa las Notificaciones
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Recibe actualizaciones en tiempo real sobre tus pedidos
            </p>
            
            <div className="flex space-x-2">
              <button
                onClick={requestPermission}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Activar
              </button>
              <button
                onClick={dismissPrompt}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Ahora no
              </button>
            </div>
          </div>
          
          <button
            onClick={dismissPrompt}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Función helper para enviar notificaciones
export const sendPushNotification = (title: string, body: string, options?: NotificationOptions) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      ...options
    });
  }
};
