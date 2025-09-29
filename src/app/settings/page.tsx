'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { ArrowLeft, Bell, Shield, Globe, Moon, Sun, Smartphone, HelpCircle, Info } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('es');

  const settingsGroups = [
    {
      title: 'Cuenta',
      items: [
        {
          icon: Shield,
          label: 'Privacidad y seguridad',
          description: 'Gestiona tu privacidad y seguridad',
          action: () => console.log('Privacidad')
        },
        {
          icon: Bell,
          label: 'Notificaciones',
          description: 'Configura tus notificaciones',
          toggle: true,
          value: notifications,
          onChange: setNotifications
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
      title: 'Soporte',
      items: [
        {
          icon: HelpCircle,
          label: 'Centro de ayuda',
          description: 'Preguntas frecuentes y soporte',
          action: () => console.log('Ayuda')
        },
        {
          icon: Info,
          label: 'Acerca de',
          description: 'Versión 1.0.0',
          action: () => console.log('Acerca de')
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
                            item.value ? 'bg-orange-500' : 'bg-gray-200'
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
        </div>

        {/* App Info */}
        <div className="p-4">
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Encárgate</h3>
                <p className="text-sm text-gray-600">Tu app de servicios de confianza</p>
                <p className="text-xs text-gray-500 mt-1">Versión 1.0.0</p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-20"></div>
      </div>
      <Navbar activeRoute="profile" />
    </div>
  );
}
