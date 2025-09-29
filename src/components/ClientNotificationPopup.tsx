'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, Clock, User, MapPin, DollarSign, CheckCircle, Star } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

export default function ClientNotificationPopup() {
  const router = useRouter();
  const { clientNotifications, showNotificationPopup, setShowNotificationPopup } = useNotifications();

  // Si no hay popup activo o no hay notificaciones, no mostrar nada
  if (!showNotificationPopup || clientNotifications.length === 0) {
    return null;
  }

  const notificationsToShow = clientNotifications;

  const handleViewOrders = () => {
    setShowNotificationPopup(false);
    router.push('/orders');
  };

  const handleClose = () => {
    setShowNotificationPopup(false);
  };

  const getNotificationMessage = (order: any) => {
    if (order.status === 'ACCEPTED') {
      return {
        title: '¡Tu pedido fue aceptado! 🎉',
        subtitle: 'El encargado confirmó tu solicitud',
        color: 'from-green-500 to-emerald-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: CheckCircle
      };
    } else if (order.status === 'IN_PROGRESS') {
      return {
        title: '¡Trabajo en progreso! 🔧',
        subtitle: 'El encargado está trabajando en tu pedido',
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: Clock
      };
    } else if (order.status === 'COMPLETED') {
      return {
        title: '¡Servicio completado! 🎉✨',
        subtitle: '¡Excelente! Tu pedido ha sido finalizado exitosamente',
        color: 'from-purple-500 to-pink-500',
        bgColor: 'bg-gradient-to-r from-purple-50 to-pink-50',
        borderColor: 'border-purple-200',
        icon: Star
      };
    }
    return {
      title: 'Actualización de pedido',
      subtitle: 'Tu pedido ha sido actualizado',
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: Clock
    };
  };

  const acceptedOrders = notificationsToShow.filter(order => order.status === 'ACCEPTED');
  const completedOrders = notificationsToShow.filter(order => order.status === 'COMPLETED');
  const primaryNotification = completedOrders.length > 0 ? completedOrders[0] : acceptedOrders[0] || notificationsToShow[0];
  const notificationInfo = getNotificationMessage(primaryNotification);
  const NotificationIcon = notificationInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${notificationInfo.color} text-white p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <NotificationIcon className="w-6 h-6" />
              <h2 className="text-lg font-bold">{notificationInfo.title}</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/90 text-sm mt-1">
            {notificationInfo.subtitle}
          </p>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {/* Pedidos completados */}
            {completedOrders.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Star className="w-4 h-4 mr-2 text-purple-500" />
                  Servicios Completados ({completedOrders.length})
                </h3>
                {completedOrders.slice(0, 2).map((order) => (
                  <div key={order.id} className="border border-purple-200 rounded-lg p-3 bg-gradient-to-r from-purple-50 to-pink-50 mb-2">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{order.service}</h4>
                        <p className="text-sm text-gray-600">
                          {order.encargado?.name || 'Encargado'}
                        </p>
                      </div>
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                        ✨ Completado
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {new Date(order.date).toLocaleDateString('es-ES')} - {order.time}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        ${order.price.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowNotificationPopup(false);
                        router.push(`/rate-order/${order.id}`);
                      }}
                      className="mt-2 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
                    >
                      Calificar Servicio
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pedidos aceptados */}
            {acceptedOrders.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Pedidos Aceptados ({acceptedOrders.length})
                </h3>
                {acceptedOrders.slice(0, 2).map((order) => (
                  <div key={order.id} className="border border-green-200 rounded-lg p-3 bg-green-50 mb-2">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{order.service}</h4>
                        <p className="text-sm text-gray-600">
                          {order.encargado?.name || 'Encargado'}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Aceptado
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
              </div>
            )}

            {(acceptedOrders.length + completedOrders.length) > 4 && (
              <div className="text-center text-sm text-gray-500 py-2">
                Y {(acceptedOrders.length + completedOrders.length) - 4} actualización{(acceptedOrders.length + completedOrders.length) - 4 > 1 ? 'es' : ''} más...
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
              Cerrar
            </button>
            <button
              onClick={handleViewOrders}
              className={`flex-1 px-4 py-2 bg-gradient-to-r ${notificationInfo.color} text-white rounded-lg hover:opacity-90 transition-opacity font-medium`}
            >
              Ver Mis Pedidos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
