'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Shield, Globe, Moon, Sun, Smartphone, HelpCircle, Info, CreditCard, MapPin, Clock, Users, Star, DollarSign } from 'lucide-react';
import ProviderNavbar from '@/components/ProviderNavbar';
import { useAuth } from '@/contexts/AuthContext';

export default function ProviderSettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [language, setLanguage] = useState('es');

  const settingsGroups = [
    {
      title: 'Cuenta y Negocio',
      items: [
        {
          icon: Shield,
          label: 'Privacidad y seguridad',
          description: 'Gestiona tu privacidad y seguridad',
          action: () => console.log('Privacidad')
        },
        {
          icon: CreditCard,
          label: 'Métodos de pago',
          description: 'Configura cómo recibes pagos',
          action: () => console.log('Métodos de pago')
        },
        {
          icon: MapPin,
          label: 'Área de servicio',
          description: 'Define tu zona de trabajo',
          action: () => console.log('Área de servicio')
        },
        {
          icon: DollarSign,
          label: 'Precios y tarifas',
          description: 'Gestiona tus precios base',
          action: () => console.log('Precios')
        }
      ]
    },
    {
      title: 'Notificaciones',
      items: [
        {
          icon: Bell,
          label: 'Notificaciones push',
          description: 'Recibe notificaciones en la app',
          toggle: true,
          value: notifications,
          onChange: setNotifications
        },
        {
          icon: Smartphone,
          label: 'Notificaciones por email',
          description: 'Recibe emails de nuevos pedidos',
          toggle: true,
          value: emailNotifications,
          onChange: setEmailNotifications
        },
        {
          icon: Smartphone,
          label: 'Notificaciones SMS',
          description: 'Recibe SMS de pedidos urgentes',
          toggle: true,
          value: smsNotifications,
          onChange: setSmsNotifications
        }
      ]
    },
    {
      title: 'Automatización',
      items: [
        {
          icon: Clock,
          label: 'Auto-aceptar pedidos',
          description: 'Acepta automáticamente pedidos que coincidan con tus criterios',
          toggle: true,
          value: autoAcceptOrders,
          onChange: setAutoAcceptOrders
        },
        {
          icon: Users,
          label: 'Respuesta automática',
          description: 'Envía mensajes automáticos a clientes',
          action: () => console.log('Respuesta automática')
        }
      ]
    },
    {
      title: 'Preferencias',
      items: [
        {
          icon: darkMode ? Moon : Sun,
          label: 'Tema',
          description: darkMode ? 'Modo oscuro activado' : 'Modo claro activado',
          toggle: true,
          value: darkMode,
          onChange: setDarkMode
        },
        {
          icon: Globe,
          label: 'Idioma',
          description: 'Español',
          action: () => console.log('Idioma')
        }
      ]
    },
    {
      title: 'Soporte y Legal',
      items: [
        {
          icon: HelpCircle,
          label: 'Centro de ayuda',
          description: 'Preguntas frecuentes y soporte',
          action: () => console.log('Ayuda')
        },
        {
          icon: Star,
          label: 'Calificar la app',
          description: 'Ayúdanos a mejorar',
          action: () => console.log('Calificar')
        },
        {
          icon: Info,
          label: 'Términos y condiciones',
          description: 'Lee nuestros términos de servicio',
          action: () => console.log('Términos')
        },
        {
          icon: Info,
          label: 'Política de privacidad',
          description: 'Cómo protegemos tus datos',
          action: () => console.log('Privacidad')
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
          </div>
        </div>

        {/* Settings Groups */}
        <div className="p-4 space-y-6">
          {settingsGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  {group.title}
                </h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                {group.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={item.action}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      </div>
                      
                      {item.toggle && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            item.onChange?.(!item.value);
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            item.value ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              item.value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Sección de cuenta */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Cuenta
              </h2>
            </div>
            
            <div className="p-4">
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="p-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Encárgate Pro</h3>
                <p className="text-sm text-gray-600">Tu app profesional de servicios</p>
                <p className="text-xs text-gray-500 mt-1">Versión 1.0.0</p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-20"></div>
      </div>

      <ProviderNavbar activeRoute="profile" />
    </div>
  );
}
