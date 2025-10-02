'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Clock, MapPin, DollarSign, Check, XCircle } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/services/api';
import ClientNotificationPopup from './ClientNotificationPopup';

export default function NotificationPopup() {
  const router = useRouter();
  const { user } = useAuth();
  const { pendingOrders, showNotificationPopup, setShowNotificationPopup, refreshOrders } = useNotifications();
  const { showSuccess, showError } = useToast();
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);

  // Restaurar cooldown desde localStorage al cargar
  useEffect(() => {
    const savedCooldown = localStorage.getItem('notificationCooldown');
    if (savedCooldown) {
      const cooldownTime = parseInt(savedCooldown, 10);
      if (cooldownTime > Date.now()) {
        setCooldownUntil(cooldownTime);
      } else {
        // Si el cooldown ya expiró, limpiar localStorage
        localStorage.removeItem('notificationCooldown');
      }
    }
  }, []);

  // Timer para limpiar el cooldown cuando expire
  useEffect(() => {
    if (cooldownUntil > Date.now()) {
      const timeoutId = setTimeout(() => {
        setCooldownUntil(0);
        localStorage.removeItem('notificationCooldown');
        console.log('⏰ Cooldown de notificaciones expirado, popup puede mostrarse nuevamente');
      }, cooldownUntil - Date.now());

      return () => clearTimeout(timeoutId);
    }
  }, [cooldownUntil]);

  // Si es cliente, mostrar el popup de cliente
  if (user?.role === 'CLIENTE') {
    return <ClientNotificationPopup />;
  }

  // Verificar si estamos en cooldown
  const now = Date.now();
  const isInCooldown = now < cooldownUntil;

  // Si es encargado pero no hay pedidos pendientes o estamos en cooldown, no mostrar nada
  if (!showNotificationPopup || pendingOrders.length === 0 || isInCooldown) {
    return null;
  }

  const handleAcceptOrder = async (orderId: string) => {
    try {
      setProcessingOrderId(orderId);
      await apiClient.updateOrderStatus(orderId, 'ACCEPTED');
      showSuccess('¡Pedido Aceptado!', 'El cliente ha sido notificado');
      await refreshOrders();
      
      // Si no quedan más pedidos pendientes, cerrar el popup
      if (pendingOrders.length <= 1) {
        setShowNotificationPopup(false);
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      showError('Error', 'No se pudo aceptar el pedido');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      setProcessingOrderId(orderId);
      await apiClient.updateOrderStatus(orderId, 'CANCELLED');
      showSuccess('Pedido Rechazado', 'El pedido ha sido cancelado');
      await refreshOrders();
      
      // Si no quedan más pedidos pendientes, cerrar el popup
      if (pendingOrders.length <= 1) {
        setShowNotificationPopup(false);
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      showError('Error', 'No se pudo rechazar el pedido');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleViewOrders = () => {
    // Activar cooldown de 30 segundos
    const cooldownTime = Date.now() + 30000; // 30 segundos
    setCooldownUntil(cooldownTime);
    localStorage.setItem('notificationCooldown', cooldownTime.toString());
    
    setShowNotificationPopup(false);
    router.push('/provider-orders');
  };

  const handleClose = () => {
    // Activar cooldown de 30 segundos
    const cooldownTime = Date.now() + 30000; // 30 segundos
    setCooldownUntil(cooldownTime);
    localStorage.setItem('notificationCooldown', cooldownTime.toString());
    
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
            {pendingOrders.slice(0, 3).map((order) => {
              const isPaid = order.status === 'ACCEPTED' && order.paymentStatus === 'PAID';
              
              return (
              <div key={order.id} className={`border rounded-lg p-3 ${
                isPaid 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-orange-200 bg-orange-50'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {order.user?.name || 'Cliente'}
                    </h3>
                    <p className="text-sm text-gray-600">{order.service}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isPaid 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {isPaid ? '💳 Pago Confirmado' : 'Pendiente'}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-gray-600 mb-3">
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

                {/* Botones según el estado */}
                {isPaid ? (
                  <div className="bg-green-100 border border-green-200 rounded-lg p-2">
                    <p className="text-sm text-green-800 text-center font-medium">
                      ✅ El cliente pagó. Puedes comenzar el servicio.
                    </p>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRejectOrder(order.id)}
                      disabled={processingOrderId === order.id}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingOrderId === order.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Rechazar</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleAcceptOrder(order.id)}
                      disabled={processingOrderId === order.id}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingOrderId === order.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-medium">Aceptar</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
            })}

            {pendingOrders.length > 3 && (
              <div className="text-center text-sm text-gray-500 py-2">
                Y {pendingOrders.length - 3} pedido{pendingOrders.length - 3 > 1 ? 's' : ''} más...
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleViewOrders}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Ver Todos los Pedidos
          </button>
        </div>
      </div>
    </div>
  );
}
