'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, MapPin, Phone, MessageCircle, CheckCircle, XCircle, AlertCircle, Star, Filter, Search } from 'lucide-react';
import ProviderNavbar from '@/components/ProviderNavbar';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Order } from '@/services/api';

export default function ProviderOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
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
        // Obtener pedidos reales del encargado autenticado
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
  
  // Datos mock como fallback (los reemplazaremos con datos reales)
  const mockOrders = [
    {
      id: '1',
      clientName: 'Juan Jiménez',
      clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      clientPhone: '+57 300 123 4567',
      service: 'Reparación de tubería principal',
      description: 'Tubería rota en el baño principal, hay fuga de agua considerable',
      date: '2024-03-20',
      time: '10:00',
      status: 'pending',
      price: 254.99,
      address: 'Calle 123 #45-67, Chapinero, Bogotá',
      estimatedDuration: '2-3 horas',
      priority: 'high',
      createdAt: '2024-03-19T15:30:00Z'
    },
    {
      id: '2',
      clientName: 'María García',
      clientAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      clientPhone: '+57 301 234 5678',
      service: 'Instalación de grifos de cocina',
      description: 'Cambio de grifería completa en cocina, incluye mangueras',
      date: '2024-03-19',
      time: '14:30',
      status: 'active',
      price: 180.00,
      address: 'Carrera 45 #12-34, Zona Rosa, Bogotá',
      estimatedDuration: '1-2 horas',
      priority: 'medium',
      createdAt: '2024-03-18T10:15:00Z'
    },
    {
      id: '3',
      clientName: 'Carlos Ruiz',
      clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      clientPhone: '+57 302 345 6789',
      service: 'Destapado de cañerías',
      description: 'Cañería tapada en el lavamanos del baño',
      date: '2024-03-18',
      time: '09:00',
      status: 'completed',
      price: 120.00,
      address: 'Avenida 68 #23-45, Suba, Bogotá',
      estimatedDuration: '1 hora',
      priority: 'low',
      rating: 5,
      review: 'Excelente trabajo, muy profesional y rápido',
      createdAt: '2024-03-17T08:00:00Z'
    },
    {
      id: '4',
      clientName: 'Ana Martínez',
      clientAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      clientPhone: '+57 303 456 7890',
      service: 'Reparación de lavadora',
      description: 'La lavadora no está drenando el agua correctamente',
      date: '2024-03-17',
      time: '16:00',
      status: 'completed',
      price: 254.99,
      address: 'Calle 80 #11-23, Chapinero, Bogotá',
      estimatedDuration: '2 horas',
      priority: 'medium',
      rating: 4,
      review: 'Buen trabajo, llegó puntual',
      createdAt: '2024-03-16T12:30:00Z'
    },
    {
      id: '5',
      clientName: 'Luis García',
      clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      clientPhone: '+57 304 567 8901',
      service: 'Instalación de calentador',
      description: 'Instalación de calentador de agua eléctrico nuevo',
      date: '2024-03-16',
      time: '11:00',
      status: 'completed',
      price: 180.00,
      estimatedDuration: '3 horas',
      priority: 'high',
      rating: 5,
      review: 'Perfecto, muy recomendado',
      createdAt: '2024-03-15T09:45:00Z'
    },
  ];
  
  // Usar solo orders reales del backend
  const allOrders = orders;

  const filteredOrders = allOrders.filter(order => {
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'pending' && order.status === 'PENDING') ||
                      (activeTab === 'active' && (order.status === 'CONFIRMED' || order.status === 'IN_PROGRESS')) ||
                      (activeTab === 'completed' && order.status === 'COMPLETED');
    
    const matchesSearch = (order.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.address || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'active': return 'En progreso';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'active': return Clock;
      case 'pending': return AlertCircle;
      case 'cancelled': return XCircle;
      default: return AlertCircle;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-300';
    }
  };

  const getOrderCounts = () => {
    return {
      all: allOrders.length,
      pending: allOrders.filter(o => o.status === 'pending').length,
      active: allOrders.filter(o => o.status === 'active').length,
      completed: allOrders.filter(o => o.status === 'completed').length
    };
  };

  const counts = getOrderCounts();

  const handleOrderAction = (orderId: string, action: 'accept' | 'reject' | 'complete' | 'contact') => {
    console.log(`${action} order ${orderId}`);
    // En una app real, aquí se haría la llamada al backend
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
            <h1 className="text-xl font-bold text-gray-900">Mis Pedidos</h1>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, servicio o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white px-6 py-3 border-b border-gray-200">
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'Todos', count: counts.all },
              { key: 'pending', label: 'Pendientes', count: counts.pending },
              { key: 'active', label: 'Activos', count: counts.active },
              { key: 'completed', label: 'Completados', count: counts.completed }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors relative ${
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

        {/* Lista de pedidos */}
        <div className="p-4 space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos</h3>
              <p className="text-gray-600">
                {searchTerm ? 'No se encontraron pedidos con ese criterio' : 'No tienes pedidos en esta categoría'}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              
              return (
                <div 
                  key={order.id} 
                  className={`bg-white rounded-lg border border-gray-200 border-l-4 ${getPriorityColor(order.priority)} overflow-hidden`}
                >
                  {/* Header del pedido */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={order.clientAvatar}
                          alt={order.clientName}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">{order.clientName}</h3>
                          <p className="text-sm text-gray-600">{order.service}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)} flex items-center space-x-1`}>
                          <StatusIcon className="w-3 h-3" />
                          <span>{getStatusText(order.status)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Descripción */}
                    <p className="text-sm text-gray-700 mb-3">{order.description}</p>

                    {/* Información del pedido */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{order.address}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(order.date).toLocaleDateString('es-ES')}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock className="w-4 h-4 mr-1" />
                            {order.time}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-gray-900">${order.price}</span>
                          <p className="text-xs text-gray-500">{order.estimatedDuration}</p>
                        </div>
                      </div>
                    </div>

                    {/* Reseña (solo para completados) */}
                    {order.status === 'completed' && order.rating && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < order.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{order.rating}/5</span>
                        </div>
                        {order.review && (
                          <p className="text-sm text-gray-600 italic">"{order.review}"</p>
                        )}
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleOrderAction(order.id, 'accept')}
                            className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                          >
                            Aceptar
                          </button>
                          <button 
                            onClick={() => handleOrderAction(order.id, 'reject')}
                            className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                      
                      {order.status === 'active' && (
                        <>
                          <button 
                            onClick={() => handleOrderAction(order.id, 'complete')}
                            className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                          >
                            Marcar como completado
                          </button>
                        </>
                      )}

                      {(order.status === 'pending' || order.status === 'active') && (
                        <>
                          <button 
                            onClick={() => handleOrderAction(order.id, 'contact')}
                            className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-1"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-1">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </>
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

      <ProviderNavbar activeRoute="orders" />
    </div>
  );
}
