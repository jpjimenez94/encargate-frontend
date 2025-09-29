'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Settings, Check, X, Calendar, DollarSign, Star, MessageCircle, AlertCircle } from 'lucide-react';
import ProviderNavbar from '@/components/ProviderNavbar';

export default function ProviderNotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'orders' | 'payments' | 'reviews'>('all');
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'order',
      title: 'Nuevo pedido recibido',
      message: 'Juan Jiménez solicita reparación de tubería para mañana a las 10:00 AM',
      time: '5 min',
      read: false,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: '2',
      type: 'payment',
      title: 'Pago recibido',
      message: 'Has recibido $254.99 por el servicio completado para María García',
      time: '1 hora',
      read: false,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: '3',
      type: 'review',
      title: 'Nueva reseña',
      message: 'Carlos Ruiz te ha calificado con 5 estrellas: "Excelente trabajo"',
      time: '2 horas',
      read: true,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      id: '4',
      type: 'order',
      title: 'Pedido cancelado',
      message: 'El pedido de Ana Martínez para hoy ha sido cancelado',
      time: '3 horas',
      read: true,
      icon: X,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      id: '5',
      type: 'system',
      title: 'Actualización de perfil',
      message: 'Tu perfil ha sido verificado exitosamente',
      time: '1 día',
      read: true,
      icon: Check,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: '6',
      type: 'order',
      title: 'Recordatorio de cita',
      message: 'Tienes una cita mañana a las 2:00 PM con Luis García',
      time: '1 día',
      read: true,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]);

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'orders') return notification.type === 'order';
    if (activeTab === 'payments') return notification.type === 'payment';
    if (activeTab === 'reviews') return notification.type === 'review';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

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
              onClick={() => router.push('/provider-settings')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Contador y acción */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">
                {unreadCount} sin leer
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white px-6 py-3 border-b border-gray-200">
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'Todas', count: notifications.length },
              { key: 'orders', label: 'Pedidos', count: notifications.filter(n => n.type === 'order').length },
              { key: 'payments', label: 'Pagos', count: notifications.filter(n => n.type === 'payment').length },
              { key: 'reviews', label: 'Reseñas', count: notifications.filter(n => n.type === 'review').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === tab.key
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div className="p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay notificaciones</h3>
              <p className="text-gray-600">No tienes notificaciones en esta categoría</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = notification.icon;
              
              return (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.bgColor}`}>
                      <Icon className={`w-5 h-5 ${notification.color}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-sm font-medium ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500">{notification.time}</span>
                      </div>
                      
                      <p className={`text-sm ${
                        !notification.read ? 'text-gray-700' : 'text-gray-600'
                      }`}>
                        {notification.message}
                      </p>
                      
                      {!notification.read && (
                        <div className="flex items-center mt-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          <span className="text-xs text-blue-600 font-medium">Nueva</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="h-20"></div>
      </div>

      <ProviderNavbar activeRoute="profile" />
    </div>
  );
}
