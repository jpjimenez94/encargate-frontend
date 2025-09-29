'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, Clock, User, MapPin, DollarSign } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import ClientNotificationPopup from './ClientNotificationPopup';

export default function NotificationPopup() {
  const router = useRouter();
  const { user } = useAuth();
  const { pendingOrders, showNotificationPopup, setShowNotificationPopup } = useNotifications();

  // Si es cliente, mostrar el popup de cliente
  if (user?.role === 'CLIENTE') {
    return <ClientNotificationPopup />;
  }

  // Si es encargado pero no hay pedidos pendientes, no mostrar nada
  if (!showNotificationPopup || pendingOrders.length === 0) {
    return null;
  }

  const handleViewOrders = () => {
    setShowNotificationPopup(false);
    router.push('/provider-orders');
  };

  const handleClose = () => {
    setShowNotificationPopup(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <h2 className="text-lg font-bold">¡Pedidos Pendientes!</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-orange-100 text-sm mt-1">
            Tienes {pendingOrders.length} pedido{pendingOrders.length > 1 ? 's' : ''} esperando respuesta
          </p>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {pendingOrders.slice(0, 3).map((order) => (
              <div key={order.id} className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {order.user?.name || 'Cliente'}
                    </h3>
                    <p className="text-sm text-gray-600">{order.service}</p>
                  </div>
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                    Pendiente
                  </span>
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {new Date(order.date).toLocaleDateString('es-ES')} - {order.time}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {order.address}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    ${order.price.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}

            {pendingOrders.length > 3 && (
              <div className="text-center text-sm text-gray-500 py-2">
                Y {pendingOrders.length - 3} pedido{pendingOrders.length - 3 > 1 ? 's' : ''} más...
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Recordar después
            </button>
            <button
              onClick={handleViewOrders}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Ver Pedidos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
