'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, MapPin, User, Phone, MessageCircle, Star, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { apiClient, Order } from '@/services/api';
import ConfirmModal from '@/components/ConfirmModal';

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { forceRefresh } = useNotifications();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const orderId = params.id as string;

  useEffect(() => {
    const loadOrder = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        const orderData = await apiClient.getOrderById(orderId);
        setOrder(orderData);
      } catch (error) {
        console.error('Error loading order:', error);
        // Si no se encuentra el pedido, redirigir según el tipo de usuario
        if (user.role === 'ENCARGADO') {
          router.push('/provider-orders');
        } else {
          router.push('/orders');
        }
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId, user, router]);

  // Tracking en tiempo real - Polling cada 10 segundos
  useEffect(() => {
    if (!orderId || !user || order?.status === 'COMPLETED' || order?.status === 'CANCELLED') {
      return;
    }

    const refreshOrder = async () => {
      try {
        const updatedOrder = await apiClient.getOrderById(orderId);
        // Solo actualizar si el estado cambió
        if (updatedOrder.status !== order?.status) {
          setOrder(updatedOrder);
          // Mostrar notificación del navegador si está disponible
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Estado del Pedido Actualizado', {
              body: `Tu pedido ahora está: ${getStatusText(updatedOrder.status)}`,
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png'
            });
          }
        }
      } catch (error) {
        console.error('Error refreshing order:', error);
      }
    };

    const interval = setInterval(refreshOrder, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [orderId, user, order?.status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'ACCEPTED': return 'Aceptado';
      case 'IN_PROGRESS': return 'En progreso';
      case 'COMPLETED': return 'Completado';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  const handleBack = () => {
    if (user?.role === 'ENCARGADO') {
      router.push('/provider-orders');
    } else {
      router.push('/orders');
    }
  };

  const handleCancelOrder = () => {
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    try {
      await apiClient.updateOrderStatus(order!.id, 'CANCELLED');
      const updatedOrder = await apiClient.getOrderById(order!.id);
      setOrder(updatedOrder);
      showSuccess('Pedido Cancelado', 'El pedido ha sido cancelado exitosamente');
    } catch (error) {
      console.error('Error canceling order:', error);
      showError('Error', 'No se pudo cancelar el pedido');
    }
  };

  const handleContactProvider = () => {
    if (order?.encargado?.name) {
      // Simular contacto con el encargado
      const phone = '+57 300 123 4567'; // En una app real, esto vendría del backend
      window.location.href = `tel:${phone}`;
    }
  };

  const handleRateOrder = () => {
    // Navegar a página de calificación
    router.push(`/rate-order/${order!.id}`);
  };

  const handleOrderAction = async (action: 'accept' | 'reject' | 'complete') => {
    try {
      // Verificar pago antes de completar
      if (action === 'complete' && order && order.paymentStatus !== 'PAID') {
        showError('Pago Requerido', 'El cliente debe completar el pago antes de que puedas marcar el servicio como completado.');
        return;
      }

      let newStatus = '';
      switch (action) {
        case 'accept':
          newStatus = 'ACCEPTED';
          break;
        case 'reject':
          newStatus = 'CANCELLED';
          break;
        case 'complete':
          newStatus = 'COMPLETED';
          break;
      }

      await apiClient.updateOrderStatus(order!.id, newStatus);
      const updatedOrder = await apiClient.getOrderById(order!.id);
      setOrder(updatedOrder);
      
      const actionText = action === 'accept' ? 'aceptado' : action === 'reject' ? 'rechazado' : 'completado';
      const actionTitle = action === 'accept' ? 'Pedido Aceptado' : action === 'reject' ? 'Pedido Rechazado' : 'Pedido Completado';
      showSuccess(actionTitle, `El pedido ha sido ${actionText} exitosamente`);
      
      // Forzar actualización inmediata de notificaciones
      await forceRefresh();
      
    } catch (error) {
      console.error(`Error ${action} order:`, error);
      const errorText = action === 'accept' ? 'aceptar' : action === 'reject' ? 'rechazar' : 'completar';
      showError('Error', `No se pudo ${errorText} el pedido`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pedido no encontrado</h2>
          <button 
            onClick={handleBack}
            className="text-blue-500 hover:text-blue-600"
          >
            Volver a pedidos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">Detalles del Pedido</h1>
              <p className="text-blue-100 text-sm">#{order.id.slice(-8)}</p>
            </div>
          </div>
        </div>

        {/* Timeline de Estados */}
        <div className="p-6 bg-white border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Estado del Pedido</h2>
          
          {/* Timeline Visual */}
          <div className="relative">
            {/* Línea vertical */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {/* Estados */}
            <div className="space-y-6">
              {/* PENDING */}
              <div className="relative flex items-start">
                <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                  order.status === 'PENDING' || order.status === 'ACCEPTED' || order.status === 'IN_PROGRESS' || order.status === 'COMPLETED'
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                }`}>
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium text-gray-900">Pedido Creado</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>

              {/* ACCEPTED */}
              <div className="relative flex items-start">
                <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                  order.status === 'ACCEPTED' || order.status === 'IN_PROGRESS' || order.status === 'COMPLETED'
                    ? 'bg-green-500'
                    : order.status === 'PENDING'
                    ? 'bg-gray-300 animate-pulse'
                    : 'bg-gray-300'
                }`}>
                  {order.status === 'ACCEPTED' || order.status === 'IN_PROGRESS' || order.status === 'COMPLETED' ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium text-gray-900">Pedido Aceptado</p>
                  <p className="text-sm text-gray-500">
                    {order.status === 'ACCEPTED' || order.status === 'IN_PROGRESS' || order.status === 'COMPLETED'
                      ? 'El encargado aceptó tu pedido'
                      : 'Esperando confirmación del encargado'}
                  </p>
                </div>
              </div>

              {/* IN_PROGRESS */}
              <div className="relative flex items-start">
                <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                  order.status === 'IN_PROGRESS' || order.status === 'COMPLETED'
                    ? 'bg-blue-500'
                    : order.status === 'ACCEPTED'
                    ? 'bg-gray-300 animate-pulse'
                    : 'bg-gray-300'
                }`}>
                  {order.status === 'IN_PROGRESS' || order.status === 'COMPLETED' ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium text-gray-900">En Progreso</p>
                  <p className="text-sm text-gray-500">
                    {order.status === 'IN_PROGRESS' || order.status === 'COMPLETED'
                      ? 'El encargado está trabajando en tu pedido'
                      : 'El trabajo comenzará pronto'}
                  </p>
                </div>
              </div>

              {/* COMPLETED */}
              <div className="relative flex items-start">
                <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                  order.status === 'COMPLETED'
                    ? 'bg-green-500'
                    : order.status === 'IN_PROGRESS'
                    ? 'bg-gray-300 animate-pulse'
                    : 'bg-gray-300'
                }`}>
                  {order.status === 'COMPLETED' ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium text-gray-900">Completado</p>
                  <p className="text-sm text-gray-500">
                    {order.status === 'COMPLETED'
                      ? '¡Servicio finalizado exitosamente!'
                      : 'El servicio será completado pronto'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Estado actual destacado */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Estado Actual</p>
                <p className="text-lg font-bold text-blue-900">{getStatusText(order.status)}</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status === 'PENDING' && '⏳'}
                {order.status === 'ACCEPTED' && '✅'}
                {order.status === 'IN_PROGRESS' && '🔧'}
                {order.status === 'COMPLETED' && '🎉'}
                {order.status === 'CANCELLED' && '❌'}
              </div>
            </div>
          </div>
        </div>

        {/* Información del servicio */}
        <div className="p-4 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Servicio</h2>
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">{order.service}</p>
              {order.description && (
                <p className="text-gray-600">{order.description}</p>
              )}
            </div>
          </div>

          {/* Información del cliente/encargado */}
          {user?.role === 'ENCARGADO' ? (
            // Vista para encargado - mostrar info del cliente
            order.user && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="font-semibold text-gray-900 mb-3">Cliente</h2>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {order.user.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{order.user.name}</p>
                    <p className="text-sm text-gray-500">{order.user.email}</p>
                  </div>
                </div>
              </div>
            )
          ) : (
            // Vista para cliente - mostrar info del encargado
            order.encargado && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="font-semibold text-gray-900 mb-3">Encargado</h2>
                <div className="flex items-center space-x-3">
                  <img
                    src={order.encargado.avatar}
                    alt={order.encargado.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{order.encargado.name}</p>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">
                        {order.encargado.rating} ({order.encargado.reviewsCount} reseñas)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Detalles del pedido */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Detalles</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="text-gray-900">{order.address}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p className="text-gray-900">{new Date(order.date).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Hora</p>
                  <p className="text-gray-900">{order.time}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Precio */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Precio</h2>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total</span>
              <span className="text-2xl font-bold text-gray-900">
                ${order.price.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-500">Método de pago</span>
              <span className="text-sm text-gray-600 capitalize">
                {order.paymentMethod === 'card' ? 'Tarjeta' : 'Efectivo'}
              </span>
            </div>
          </div>

          {/* Reseña (si existe) */}
          {order.review && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="font-semibold text-gray-900 mb-3">Reseña</h2>
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= (order.review?.rating || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">{order.review?.rating || 0}/5</span>
              </div>
              {order.review?.comment && (
                <p className="text-gray-600 italic">"{order.review.comment}"</p>
              )}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          {user?.role === 'ENCARGADO' ? (
            // Acciones para encargados
            <>
              {order.status === 'PENDING' && (
                <div className="flex space-x-3">
                  <button 
                    onClick={() => handleOrderAction('accept')}
                    className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
                  >
                    Aceptar Pedido
                  </button>
                  <button 
                    onClick={() => handleOrderAction('reject')}
                    className="flex-1 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
                  >
                    Rechazar
                  </button>
                </div>
              )}
              
              {(order.status === 'ACCEPTED' || order.status === 'IN_PROGRESS') && (
                order.paymentStatus === 'PAID' ? (
                  <button 
                    onClick={() => handleOrderAction('complete')}
                    className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    Marcar como Completado
                  </button>
                ) : (
                  <button 
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg font-medium cursor-not-allowed"
                    title="El cliente debe completar el pago antes de marcar como completado"
                  >
                    Pendiente de Pago
                  </button>
                )
              )}
            </>
          ) : (
            // Acciones para clientes
            <>
              {/* Botón de pago para pedidos aceptados pero no pagados */}
              {order.status === 'ACCEPTED' && order.paymentStatus !== 'PAID' && (
                <div className="space-y-3">
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-3">
                    <div className="flex items-center space-x-2 text-green-800 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <p className="font-semibold">¡Pedido Aceptado!</p>
                    </div>
                    <p className="text-sm text-green-700">
                      El proveedor aceptó tu solicitud. Ahora puedes proceder al pago para confirmar el servicio.
                    </p>
                  </div>
                  <button 
                    onClick={() => router.push(`/checkout-co/${order.id}`)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center space-x-2"
                  >
                    <span>💳</span>
                    <span>Proceder al Pago</span>
                  </button>
                </div>
              )}

              {/* Confirmación de pago realizado */}
              {order.status === 'ACCEPTED' && order.paymentStatus === 'PAID' && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-3">
                  <div className="flex items-center space-x-2 text-blue-800 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <p className="font-semibold">¡Pago Confirmado!</p>
                  </div>
                  <p className="text-sm text-blue-700">
                    Tu pago ha sido procesado exitosamente. El proveedor puede proceder con el servicio.
                  </p>
                </div>
              )}
              
              {order.status === 'PENDING' && (
                <button 
                  onClick={handleCancelOrder}
                  className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Cancelar Pedido
                </button>
              )}
              
              {order.status === 'COMPLETED' && !order.rating && (
                <button 
                  onClick={handleRateOrder}
                  className="w-full bg-yellow-500 text-white py-3 rounded-lg font-medium hover:bg-yellow-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Star className="w-5 h-5" />
                  <span>Calificar Servicio</span>
                </button>
              )}
              
              {order.status === 'COMPLETED' && order.rating && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-center space-x-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Servicio completado y calificado</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Botones de contacto (para ambos roles) */}
          <div className="flex space-x-3">
            <button 
              onClick={user?.role === 'ENCARGADO' ? () => {} : handleContactProvider}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center space-x-2 transition-colors"
            >
              <Phone className="w-5 h-5" />
              <span>Llamar</span>
            </button>
            <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center space-x-2 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span>Mensaje</span>
            </button>
          </div>
        </div>

        {/* Modal de confirmación para cancelar pedido */}
        <ConfirmModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={confirmCancelOrder}
          title="Cancelar Pedido"
          message="¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer."
          confirmText="Sí, cancelar"
          cancelText="No, mantener"
          type="danger"
        />
      </div>
    </div>
  );
}
