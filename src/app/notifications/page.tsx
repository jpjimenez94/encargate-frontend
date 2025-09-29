'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Settings, Check, X, Calendar, DollarSign, Star, MessageCircle, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ProviderNavbar from '@/components/ProviderNavbar';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { clientNotifications, pendingOrders, markNotificationsAsViewed } = useNotifications();
  const [activeTab, setActiveTab] = useState<'all' | 'orders' | 'payments' | 'reviews'>('all');

  // Redirigir según el tipo de usuario
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Si es proveedor, redirigir a provider-notifications
    if (user.role === 'ENCARGADO') {
      router.push('/provider-notifications');
      return;
    }
  }, [user, router]);

  // Marcar notificaciones como vistas al entrar
  useEffect(() => {
    if (user?.role === 'CLIENTE') {
      markNotificationsAsViewed();
    }
  }, [user, markNotificationsAsViewed]);

  if (!user || user.role !== 'CLIENTE') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Convertir pedidos a formato de notificaciones
  const notifications = clientNotifications.map(order => {
    let title, message, icon, color, bgColor;
    
    switch (order.status) {
      case 'ACCEPTED':
        title = 'Pedido Aceptado';
        message = `${order.encargado?.name} ha aceptado tu pedido de ${order.service}`;
        icon = CheckCircle;
        color = 'text-green-600';
        bgColor = 'bg-green-100';
        break;
      case 'IN_PROGRESS':
        title = 'Trabajo en Progreso';
        message = `${order.encargado?.name} está trabajando en tu pedido de ${order.service}`;
        icon = Clock;
        color = 'text-blue-600';
        bgColor = 'bg-blue-100';
        break;
      case 'COMPLETED':
        title = 'Pedido Completado';
        message = `Tu pedido de ${order.service} ha sido completado`;
        icon = Star;
        color = 'text-purple-600';
        bgColor = 'bg-purple-100';
        break;
      case 'CANCELLED':
        title = 'Pedido Cancelado';
        message = `Tu pedido de ${order.service} ha sido cancelado`;
        icon = X;
        color = 'text-red-600';
        bgColor = 'bg-red-100';
        break;
      default:
        title = 'Actualización de Pedido';
        message = `Hay una actualización en tu pedido de ${order.service}`;
        icon = Bell;
        color = 'text-gray-600';
        bgColor = 'bg-gray-100';
    }
    
    return {
      id: order.id,
      type: 'order',
      title,
      message,
      time: new Date(order.createdAt).toLocaleDateString(),
      read: true, // Ya las marcamos como leídas
      icon,
      color,
      bgColor
    };
  });

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'orders') return notification.type === 'order';
    return true;
  });

  const unreadCount = 0; // Ya están marcadas como leídas

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Notificaciones</h1>
            <button 
              onClick={() => router.push('/profile')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Contador de notificaciones */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">
                {notifications.length} notificaciones
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white px-6 py-3 border-b border-gray-200">
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'Todas', count: notifications.length },
              { key: 'orders', label: 'Pedidos', count: notifications.filter(n => n.type === 'order').length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div className="p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay notificaciones</h3>
              <p className="text-gray-600">
                Te notificaremos cuando haya actualizaciones en tus pedidos.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const IconComponent = notification.icon;
              return (
                <div
                  key={notification.id}
                  className="bg-white rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${notification.bgColor}`}>
                      <IconComponent className={`w-5 h-5 ${notification.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500 ml-2">
                          {notification.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Navbar */}
      <Navbar activeRoute="orders" />
    </div>
  );
}
