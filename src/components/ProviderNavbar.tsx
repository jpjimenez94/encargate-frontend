'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BarChart3, Calendar, DollarSign, Settings, Bell, Users } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

interface ProviderNavbarProps {
  activeRoute?: 'dashboard' | 'orders' | 'earnings' | 'profile';
}

export default function ProviderNavbar({ activeRoute = 'dashboard' }: ProviderNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasPendingOrders, pendingOrders } = useNotifications();

  const navItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      path: '/provider-home',
      color: 'text-blue-500'
    },
    {
      key: 'orders',
      label: 'Pedidos',
      icon: Calendar,
      path: '/provider-orders',
      color: 'text-green-500'
    },
    {
      key: 'earnings',
      label: 'Ganancias',
      icon: DollarSign,
      path: '/provider-earnings',
      color: 'text-yellow-500'
    },
    {
      key: 'profile',
      label: 'Perfil',
      icon: Settings,
      path: '/provider-profile',
      color: 'text-purple-500'
    }
  ];

  const getActiveState = (itemKey: string) => {
    // Determinar si el item está activo basado en la ruta actual o el prop activeRoute
    const isActive = activeRoute === itemKey || pathname === navItems.find(item => item.key === itemKey)?.path;
    return isActive;
  };

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = getActiveState(item.key);
          
          return (
            <button
              key={item.key}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center py-2 px-4 transition-colors relative"
            >
              <div className="relative">
                <Icon 
                  className={`w-5 h-5 mb-1 ${
                    isActive ? item.color : 'text-gray-400'
                  }`} 
                />
                {/* Indicador de notificación para pedidos */}
                {item.key === 'orders' && hasPendingOrders && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {pendingOrders.length > 9 ? '9+' : pendingOrders.length}
                    </span>
                  </div>
                )}
              </div>
              <span 
                className={`text-xs ${
                  isActive ? `${item.color} font-medium` : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
