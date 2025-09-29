'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Phone, MessageCircle, CheckCircle, XCircle, AlertCircle, Star, Filter, Search } from 'lucide-react';
import ProviderNavbar from '@/components/ProviderNavbar';
import NotificationPopup from '@/components/NotificationPopup';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient, Order } from '@/services/api';

export default function ProviderOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshPendingOrders } = useNotifications();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Cargar pedidos del encargado autenticado
  useEffect(() => {
    const loadOrders = async () => {
      if (!user || user.role !== 'ENCARGADO') {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        const providerOrders = await apiClient.getMyOrders();
        setOrders(providerOrders || []);
      } catch (error) {
        console.error('Error loading provider orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user, router]);

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'pending' && order.status === 'PENDING') ||
                      (activeTab === 'active' && (order.status === 'ACCEPTED' || order.status === 'IN_PROGRESS')) ||
                      (activeTab === 'completed' && order.status === 'COMPLETED');
    
    const matchesSearch = (order.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.address || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesSearch;
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
      case 'PENDING': return 'Pendiente';
      case 'ACCEPTED': return 'Aceptado';
      case 'IN_PROGRESS': return 'En progreso';
      case 'COMPLETED': return 'Completado';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'pending': return orders.filter(o => o.status === 'PENDING').length;
      case 'active': return orders.filter(o => o.status === 'ACCEPTED' || o.status === 'IN_PROGRESS').length;
      case 'completed': return orders.filter(o => o.status === 'COMPLETED').length;
      default: return orders.length;
    }
  };

  const handleOrderAction = async (orderId: string, action: 'accept' | 'reject' | 'complete') => {
    try {
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

      await apiClient.updateOrderStatus(orderId, newStatus);
      
      // Actualizar la lista de pedidos
      const updatedOrders = await apiClient.getMyOrders();
      setOrders(updatedOrders || []);
      
      // Refrescar notificaciones de pedidos pendientes
      await refreshPendingOrders();
      
      // Mostrar mensaje de éxito con toast
      const messages = {
        accept: { title: '¡Pedido Aceptado!', message: 'Has aceptado el pedido exitosamente. El cliente será notificado.' },
        reject: { title: 'Pedido Rechazado', message: 'El pedido ha sido rechazado. El cliente será notificado.' },
        complete: { title: '¡Pedido Completado!', message: 'El servicio ha sido marcado como completado. ¡Excelente trabajo!' }
      };
      
      const { title, message } = messages[action] || messages.complete;
      showSuccess(title, message);
      
    } catch (error) {
      console.error(`Error ${action} order:`, error);
      const errorMessages = {
        accept: { title: 'Error al Aceptar', message: 'No se pudo aceptar el pedido. Inténtalo de nuevo.' },
        reject: { title: 'Error al Rechazar', message: 'No se pudo rechazar el pedido. Inténtalo de nuevo.' },
        complete: { title: 'Error al Completar', message: 'No se pudo completar el pedido. Inténtalo de nuevo.' }
      };
      
      const { title, message } = errorMessages[action] || errorMessages.complete;
      showError(title, message);
    }
  };

  const handleContactClient = (order: Order) => {
    if (order.user?.email) {
      // Abrir cliente de email
      window.location.href = `mailto:${order.user.email}?subject=Pedido ${order.service}&body=Hola ${order.user.name}, me contacto respecto a tu pedido de ${order.service}.`;
    }
  };

  const handleViewDetails = (orderId: string) => {
    router.push(`/order/${orderId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
          <h1 className="text-xl font-bold">Mis Pedidos</h1>
          <p className="text-blue-100 text-sm">Gestiona tus servicios</p>
        </div>

        {/* Búsqueda */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por cliente, servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'pending', label: 'Pendientes' },
              { key: 'active', label: 'Activos' },
              { key: 'completed', label: 'Completados' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label} ({getTabCount(tab.key)})
              </button>
            ))}
          </div>
        </div>

        {/* Lista de pedidos */}
        <div className="p-4 space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No hay pedidos</h3>
              <p className="text-gray-500">
                {searchTerm ? 'No se encontraron pedidos con ese criterio' : 'Aún no tienes pedidos asignados'}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                {/* Header del pedido */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {order.user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{order.user?.name || 'Usuario'}</h3>
                      <p className="text-sm text-gray-500">{order.service}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>

                {/* Detalles del servicio */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{order.address}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{new Date(order.date).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{order.time}</span>
                  </div>
                </div>

                {/* Descripción */}
                {order.description && (
                  <p className="text-sm text-gray-700 mb-3">{order.description}</p>
                )}

                {/* Precio y acciones */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-lg font-bold text-gray-900">
                    ${order.price.toLocaleString()}
                  </div>
                  <div className="flex space-x-2">
                    {order.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleOrderAction(order.id, 'accept')}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
                        >
                          Aceptar
                        </button>
                        <button 
                          onClick={() => handleOrderAction(order.id, 'reject')}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    {(order.status === 'ACCEPTED' || order.status === 'IN_PROGRESS') && (
                      <button 
                        onClick={() => handleOrderAction(order.id, 'complete')}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Completar
                      </button>
                    )}
                    <button 
                      onClick={() => handleContactClient(order)}
                      className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 transition-colors"
                      title="Contactar cliente"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleViewDetails(order.id)}
                      className="px-3 py-1 bg-purple-500 text-white text-sm rounded-md hover:bg-purple-600 transition-colors"
                      title="Ver detalles"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="h-20"></div>
      </div>
      <ProviderNavbar activeRoute="orders" />
      <NotificationPopup />
    </div>
  );
}
