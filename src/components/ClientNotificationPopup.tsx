'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Clock, User, MapPin, DollarSign, CheckCircle, Star } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

export default function ClientNotificationPopup() {
  const router = useRouter();
  const { clientNotifications, showNotificationPopup, setShowNotificationPopup } = useNotifications();
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);

  // Restaurar cooldown desde localStorage al cargar
  useEffect(() => {
    const savedCooldown = localStorage.getItem('clientNotificationCooldown');
    if (savedCooldown) {
      const cooldownTime = parseInt(savedCooldown, 10);
      if (cooldownTime > Date.now()) {
        setCooldownUntil(cooldownTime);
      } else {
        // Si el cooldown ya expiró, limpiar localStorage
        localStorage.removeItem('clientNotificationCooldown');
      }
    }
  }, []);

  // Timer para limpiar el cooldown cuando expire
  useEffect(() => {
    if (cooldownUntil > Date.now()) {
      const timeoutId = setTimeout(() => {
        setCooldownUntil(0);
        localStorage.removeItem('clientNotificationCooldown');
        console.log('⏰ Cooldown de notificaciones de cliente expirado');
      }, cooldownUntil - Date.now());

      return () => clearTimeout(timeoutId);
    }
  }, [cooldownUntil]);

  // Verificar si estamos en cooldown
  const now = Date.now();
  const isInCooldown = now < cooldownUntil;

  // Si no hay popup activo, no hay notificaciones, o estamos en cooldown, no mostrar nada
  if (!showNotificationPopup || clientNotifications.length === 0 || isInCooldown) {
    return null;
  }

  const notificationsToShow = clientNotifications;

  const handleViewOrders = () => {
    // Activar cooldown de 30 segundos
    const cooldownTime = Date.now() + 30000; // 30 segundos
    setCooldownUntil(cooldownTime);
    localStorage.setItem('clientNotificationCooldown', cooldownTime.toString());
    
    setShowNotificationPopup(false);
    router.push('/orders');
  };

  const handleClose = () => {
    // Activar cooldown de 30 segundos
    const cooldownTime = Date.now() + 30000; // 30 segundos
    setCooldownUntil(cooldownTime);
    localStorage.setItem('clientNotificationCooldown', cooldownTime.toString());
    
    setShowNotificationPopup(false);
  };

  const getNotificationMessage = (order: any) => {
    if (order.status === 'ACCEPTED') {
      return {
        title: '¡Tu pedido fue aceptado! 🎉',
        subtitle: 'El proveedor aceptó tu solicitud. ¡Ahora puedes proceder al pago!',
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

  const acceptedOrders = notificationsToShow.filter(order => order.status === 'ACCEPTED' && order.paymentStatus !== 'PAID');
  // Los pedidos pagados solo se muestran si son realmente nuevos (no persistentes)
  const paidOrders = notificationsToShow.filter(order => 
    order.status === 'ACCEPTED' && 
    order.paymentStatus === 'PAID' &&
    // Solo mostrar si es una notificación nueva (no vista antes)
    Date.now() - new Date(order.createdAt).getTime() < 300000 // 5 minutos
  );
  // Solo mostrar pedidos completados que NO tienen calificación
  const completedOrders = notificationsToShow.filter(order => order.status === 'COMPLETED' && !order.review);
  const inProgressOrders = notificationsToShow.filter(order => order.status === 'IN_PROGRESS');
  
  // Si no hay notificaciones relevantes, no mostrar nada
  if (completedOrders.length === 0 && acceptedOrders.length === 0 && inProgressOrders.length === 0 && paidOrders.length === 0) {
    return null;
  }
  
  const primaryNotification = completedOrders.length > 0 ? completedOrders[0] : acceptedOrders[0] || inProgressOrders[0] || notificationsToShow[0];
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

            {/* Pedidos en progreso */}
            {inProgressOrders.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-blue-500" />
                  En Progreso ({inProgressOrders.length})
                </h3>
                {inProgressOrders.slice(0, 2).map((order) => (
                  <div key={order.id} className="border border-blue-200 rounded-lg p-3 bg-blue-50 mb-2">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{order.service}</h4>
                        <p className="text-sm text-gray-600">
                          {order.encargado?.name || 'Encargado'}
                        </p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        En Progreso
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

            {/* Pedidos pagados */}
            {paidOrders.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                  Pago Confirmado ({paidOrders.length})
                </h3>
                {paidOrders.slice(0, 2).map((order) => (
                  <div key={order.id} className="border border-blue-200 rounded-lg p-3 bg-blue-50 mb-2">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{order.service}</h4>
                        <p className="text-sm text-gray-600">
                          {order.encargado?.name || 'Encargado'}
                        </p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        💳 Pagado
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
                    <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800">
                      ✅ Tu pago ha sido procesado. El proveedor puede proceder con el servicio.
                    </div>
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

            {(acceptedOrders.length + completedOrders.length + inProgressOrders.length + paidOrders.length) > 6 && (
              <div className="text-center text-sm text-gray-500 py-2">
                Y {(acceptedOrders.length + completedOrders.length + inProgressOrders.length + paidOrders.length) - 6} actualización{(acceptedOrders.length + completedOrders.length + inProgressOrders.length + paidOrders.length) - 6 > 1 ? 'es' : ''} más...
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {acceptedOrders.length > 0 ? (
            // Si hay pedidos aceptados, mostrar botón de pago prominente
            <div className="space-y-3">
              <button
                onClick={() => {
                  const cooldownTime = Date.now() + 30000;
                  setCooldownUntil(cooldownTime);
                  localStorage.setItem('clientNotificationCooldown', cooldownTime.toString());
                  setShowNotificationPopup(false);
                  router.push(`/checkout-co/${acceptedOrders[0].id}`);
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:opacity-90 transition-opacity font-semibold text-lg shadow-lg"
              >
                💳 Proceder al Pago
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Más Tarde
                </button>
                <button
                  onClick={handleViewOrders}
                  className="flex-1 px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-medium text-sm"
                >
                  Ver Pedidos
                </button>
              </div>
            </div>
          ) : (
            // Para otros estados, mostrar botones normales
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
          )}
        </div>
      </div>
    </div>
  );
}
