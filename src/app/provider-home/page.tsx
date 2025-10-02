'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, TrendingUp, DollarSign, Star, Clock, MapPin, Phone, MessageCircle, Settings, Bell, BarChart3, Users, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import ProviderNavbar from '@/components/ProviderNavbar';
import NotificationPopup from '@/components/NotificationPopup';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient, Order } from '@/services/api';
import { pricingService } from '@/services/pricing';

export default function ProviderHomePage() {
  const router = useRouter();
  const { user, encargado } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'earnings'>('overview');
  const [loading, setLoading] = useState(true);
  const [providerOrders, setProviderOrders] = useState([]);
  const [providerData, setProviderData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Función para refrescar estadísticas
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const orderStats = await apiClient.getOrderStats();
      setStats(orderStats);
      const orders = await apiClient.getMyOrders();
      setRecentOrders(orders?.slice(0, 3) || []);
      showSuccess('Actualizado', 'Estadísticas actualizadas correctamente');
    } catch (error) {
      console.error('Error refreshing stats:', error);
      showError('Error', 'No se pudieron actualizar las estadísticas');
    } finally {
      setRefreshing(false);
    }
  };

  // Función para cambiar el estado de disponibilidad
  const toggleAvailability = async () => {
    if (!providerData) return;
    
    try {
      // Llamar al endpoint para cambiar disponibilidad
      await apiClient.toggleEncargadoAvailability(providerData.id);
      
      // Actualizar el estado local
      setProviderData({
        ...providerData,
        available: !providerData.available
      });
      
      // Mostrar mensaje de éxito
      showSuccess(
        'Estado Actualizado', 
        `Ahora estás ${!providerData.available ? 'disponible' : 'no disponible'}`
      );
      
    } catch (error) {
      console.error('Error toggling availability:', error);
      showError('Error', 'No se pudo cambiar el estado de disponibilidad');
    }
  };

  // Cargar datos del proveedor
  useEffect(() => {
    const loadProviderData = async () => {
      if (!user || user.role !== 'ENCARGADO') {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        
        // Obtener datos completos del encargado autenticado desde el backend
        const encargadoData = await apiClient.getEncargadoProfile();
        setProviderData(encargadoData);
        
        // Obtener estadísticas reales de pedidos
        const orderStats = await apiClient.getOrderStats();
        setStats(orderStats);
        console.log('📊 Estadísticas cargadas:', orderStats);
        
        // Obtener pedidos recientes del encargado
        const orders = await apiClient.getMyOrders();
        setRecentOrders(orders?.slice(0, 3) || []); // Solo los 3 más recientes
        
      } catch (error) {
        console.error('Error loading provider data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProviderData();
  }, [user, router]);

  // Auto-refresh cada 30 segundos para mantener estadísticas actualizadas
  useEffect(() => {
    if (!user || user.role !== 'ENCARGADO') return;

    const interval = setInterval(async () => {
      try {
        console.log('🔄 Auto-refresh de estadísticas...');
        const orderStats = await apiClient.getOrderStats();
        setStats(orderStats);
        const orders = await apiClient.getMyOrders();
        setRecentOrders(orders?.slice(0, 3) || []);
        console.log('✅ Estadísticas actualizadas automáticamente');
      } catch (error) {
        console.error('Error en auto-refresh:', error);
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [user]);

  if (loading || !user || !providerData || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calcular ganancias reales del proveedor
  const getProviderEarnings = (order: Order) => {
    // Si no hay paymentMethod o es efectivo: recibe el precio completo
    if (!order.paymentMethod || order.paymentMethod === 'cash') {
      return order.price;
    }
    // Pagos digitales: calcular con comisiones
    const breakdown = pricingService.calculatePricingLocal(order.price);
    return Math.round(breakdown.providerEarnings);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
        {/* Header del Proveedor */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <img
                src={user?.avatarUrl || providerData.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format'}
                alt={providerData.name}
                className="w-12 h-12 rounded-full border-2 border-white/20"
              />
              <div>
                <h1 className="text-lg font-bold">¡Hola, {providerData.name.split(' ')[0]}! 👋</h1>
                <p className="text-blue-100 text-sm">{providerData.service}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
                title="Actualizar estadísticas"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => router.push('/notifications')}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <Bell className="w-5 h-5" />
              </button>
              <button 
                onClick={() => router.push('/provider-settings')}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Estado de disponibilidad */}
          <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${providerData.available ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm font-medium">
                {providerData.available ? 'Disponible' : 'No disponible'}
              </span>
            </div>
            <button 
              className="text-sm bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors"
              onClick={toggleAvailability}
            >
              Cambiar estado
            </button>
          </div>
        </div>

        {/* Tabs de navegación */}
        <div className="bg-white px-6 py-3 border-b border-gray-200">
          <div className="flex space-x-1">
            {[
              { key: 'overview', label: 'Resumen' },
              { key: 'orders', label: 'Pedidos' },
              { key: 'earnings', label: 'Ganancias' }
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
              </button>
            ))}
          </div>
        </div>

        {/* Contenido según tab activo */}
        <div className="p-4">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Estadísticas principales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Pedidos</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-green-600">{stats.pending} pendientes</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">Ganancias</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalEarnings?.toLocaleString() || '0'}</p>
                  <p className="text-sm text-green-600">Total acumulado</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-600">Rating</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{providerData.rating?.toFixed(1) || '0.0'}</p>
                  <p className="text-sm text-gray-600">{providerData.reviewsCount || 0} reseñas</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">Completados</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                  <p className="text-sm text-gray-600">de {stats.total} total</p>
                </div>
              </div>

              {/* Pedidos recientes */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Pedidos Recientes</h3>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-blue-600 text-sm font-medium hover:text-blue-700"
                    >
                      Ver todos
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {recentOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{order.user?.name || 'Cliente'}</h4>
                          <p className="text-sm text-gray-600">{order.service}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(order.date).toLocaleDateString('es-ES')}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {order.time}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-gray-900">${getProviderEarnings(order).toLocaleString()}</span>
                          {order.paymentMethod !== 'cash' && (
                            <p className="text-xs text-gray-500">Después de comisiones</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Acciones Rápidas</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => router.push('/provider-profile')}
                    className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Settings className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Editar Perfil</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('earnings')}
                    className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Ver Reportes</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Mis Pedidos</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{recentOrders.length} pedidos</span>
                </div>
              </div>

              {recentOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{order.user?.name || 'Cliente'}</h3>
                        <p className="text-sm text-gray-600">{order.service}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {order.address}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(order.date).toLocaleDateString('es-ES')}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(order.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900">${getProviderEarnings(order).toLocaleString()}</span>
                        {order.paymentMethod !== 'cash' && (
                          <p className="text-xs text-gray-500">Tu ganancia</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detalles expandidos */}
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>Llamar</span>
                    </button>
                    <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>Mensaje</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <h2 className="text-lg font-semibold mb-2">Ganancias Totales</h2>
                <p className="text-3xl font-bold">${stats.totalEarnings}</p>
                <p className="text-green-100 text-sm">Acumulado hasta la fecha</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2">Este Mes</h3>
                  <p className="text-xl font-bold text-green-600">${stats.monthlyEarnings}</p>
                  <p className="text-sm text-gray-600">+12% vs mes anterior</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2">Promedio/Servicio</h3>
                  <p className="text-xl font-bold text-blue-600">${(stats.monthlyEarnings / stats.completedOrders).toFixed(0)}</p>
                  <p className="text-sm text-gray-600">Precio promedio</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Historial de Pagos</h3>
                <div className="space-y-3">
                  {recentOrders
                    .filter(order => order.status === 'COMPLETED' || order.status === 'IN_PROGRESS')
                    .slice(0, 5)
                    .map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{order.user?.name || 'Cliente'}</p>
                        <p className="text-sm text-gray-600">{order.service}</p>
                        <p className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString('es-ES')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${getProviderEarnings(order).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Ganancia real</p>
                        <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                          order.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status === 'COMPLETED' ? 'Pagado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {recentOrders.filter(order => order.status === 'COMPLETED' || order.status === 'IN_PROGRESS').length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <p>No hay pagos registrados</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-20"></div>
      </div>

      <ProviderNavbar activeRoute="dashboard" />
      <NotificationPopup />
    </div>
  );
}
