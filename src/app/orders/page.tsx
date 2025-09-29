'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import NotificationPopup from '@/components/NotificationPopup';
import { Calendar, Clock, MapPin, Star, ChevronRight, Filter, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { apiClient, Order } from '@/services/api';

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshClientNotifications, markNotificationsAsViewed } = useNotifications();
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar pedidos del usuario autenticado
  useEffect(() => {
    const loadOrders = async () => {
      if (!user || user.role !== 'CLIENTE') {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        const userOrders = await apiClient.getMyOrders();
        
        console.log('📋 OrdersPage - Pedidos cargados:', userOrders?.length || 0);
        console.log('📋 OrdersPage - Estados de pedidos:', userOrders?.map(o => ({ id: o.id.slice(-4), status: o.status, service: o.service })));
        setOrders(userOrders || []);
      } catch (error) {
        console.error('Error loading orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user, router]);

  // Marcar notificaciones como vistas cuando el usuario entra a la página
  useEffect(() => {
    if (user?.role === 'CLIENTE') {
      markNotificationsAsViewed();
    }
  }, [user, markNotificationsAsViewed]);

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'active') return order.status !== 'COMPLETED';
    if (activeTab === 'completed') return order.status === 'COMPLETED';
    return true;
  });

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
      case 'COMPLETED': return 'Completado';
      case 'IN_PROGRESS': return 'En progreso';
      case 'ACCEPTED': return 'Aceptado';
      case 'PENDING': return 'Pendiente';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Mis Pedidos</h1>
          <p className="text-gray-600 text-sm mt-1">Gestiona tus servicios contratados</p>
        </div>

        {/* Tabs */}
        <div className="bg-white px-6 py-3 border-b border-gray-200">
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'Todos', count: orders.length },
              { key: 'active', label: 'Activos', count: orders.filter(o => o.status !== 'COMPLETED').length },
              { key: 'completed', label: 'Completados', count: orders.filter(o => o.status === 'COMPLETED').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.key
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="p-4">
          {filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/order/${order.id}`)}
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{order.service}</h3>
                        <p className="text-sm text-gray-600">Pedido #{order.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Encargado Info */}
                  {order.encargado && (
                    <div className="flex items-center space-x-3 mb-3 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={order.encargado.avatar}
                        alt={order.encargado.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{order.encargado.name}</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-600 ml-1">{order.encargado.rating}</span>
                          </div>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-600">{order.encargado.location}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Details */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(order.date).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        10:00 AM
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${order.price.toFixed(2)}</p>
                      {order.rating && (
                        <div className="flex items-center">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600 ml-1">Tu calificación: {order.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review if completed */}
                  {order.status === 'COMPLETED' && order.review && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800 italic">"{order.review.comment}"</p>
                      <div className="flex items-center mt-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600 ml-1">Calificación: {order.review.rating}/5</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'all' ? 'No tienes pedidos' : 
                 activeTab === 'active' ? 'No tienes pedidos activos' : 
                 'No tienes pedidos completados'}
              </h3>
              <p className="text-gray-600 mb-6">
                {activeTab === 'all' ? 'Cuando contrates un servicio, aparecerá aquí' :
                 activeTab === 'active' ? 'Tus servicios en progreso aparecerán aquí' :
                 'Tus servicios completados aparecerán aquí'}
              </p>
              <button
                onClick={() => router.push('/home')}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                Explorar servicios
              </button>
            </div>
          )}
        </div>

        <div className="h-20"></div>
      </div>
      <Navbar activeRoute="orders" />
      <NotificationPopup />
    </div>
  );
}
