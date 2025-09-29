'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Search, FileText, User, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

interface NavbarProps {
  activeRoute?: string;
}

const Navbar: React.FC<NavbarProps> = ({ activeRoute = 'home' }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { hasClientNotifications, clientNotifications, notifiedOrders } = useNotifications();
  const [isGuest, setIsGuest] = useState(false);
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [clickedSection, setClickedSection] = useState('');

  // Verificar si es usuario invitado
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    setIsGuest(userType === 'guest' && !user);
  }, [user]);

  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home, path: '/home' },
    { id: 'search', label: 'Buscar', icon: Search, path: '/search' },
    { id: 'orders', label: 'Pedidos', icon: FileText, path: '/orders' },
    { id: 'profile', label: 'Perfil', icon: User, path: '/profile' }
  ];

  const handleNavClick = (item: any) => {
    if (isGuest && (item.id === 'search' || item.id === 'orders' || item.id === 'profile')) {
      setClickedSection(item.label);
      setShowLoginOptions(true);
    } else {
      router.push(item.path);
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className="flex flex-col items-center py-2 px-4 transition-colors relative"
              >
                <div className="relative">
                  <Icon 
                    className={`w-5 h-5 mb-1 ${
                      isActive ? 'text-orange-500' : 'text-gray-400'
                    }`} 
                  />
                  {/* Indicador de notificación para pedidos */}
                  {item.id === 'orders' && !isGuest && (() => {
                    const unviewedNotifications = clientNotifications.filter(order => !notifiedOrders.has(order.id));
                    return unviewedNotifications.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {unviewedNotifications.length > 9 ? '9+' : unviewedNotifications.length}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <span 
                  className={`text-xs ${
                    isActive ? 'text-orange-500 font-medium' : 'text-gray-400'
                  }`}
                >
                  {item.id === 'profile' && isGuest ? 'Cuenta' : item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modal de opciones de login para invitados */}
      {showLoginOptions && isGuest && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          onClick={() => setShowLoginOptions(false)}
        >
          <div 
            className="w-full max-w-md mx-auto bg-white rounded-t-2xl p-6 transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {clickedSection === 'Perfil' ? '¡Únete a Encárgate!' : `Accede a ${clickedSection}`}
              </h3>
              <p className="text-gray-600 text-sm">
                {clickedSection === 'Perfil' 
                  ? 'Crea una cuenta para gestionar tu perfil y pedidos'
                  : clickedSection === 'Buscar'
                  ? 'Inicia sesión para buscar y contactar encargados'
                  : 'Crea una cuenta para ver y gestionar tus pedidos'
                }
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowLoginOptions(false);
                  router.push('/register');
                }}
                className="w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                Crear cuenta
              </button>
              
              <button
                onClick={() => {
                  setShowLoginOptions(false);
                  router.push('/login');
                }}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Iniciar sesión
              </button>
              
              <button
                onClick={() => setShowLoginOptions(false)}
                className="w-full py-2 text-gray-500 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
