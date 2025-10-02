'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  TrendingUp, 
  RefreshCw,
  LogOut,
  ShoppingBag,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/services/api';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'ADMIN') {
      showError('Acceso Denegado', 'No tienes permisos de administrador');
      router.push('/home');
      return;
    }

    loadStats();
  }, [user, router]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const adminDashboard = await apiClient.getAdminDashboard();
      setStats(adminDashboard);
      console.log('📊 Admin Dashboard Stats:', adminDashboard);
    } catch (error) {
      console.error('Error loading admin stats:', error);
      showError('Error', 'No se pudieron cargar las estadísticas del administrador');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateCommissions = async () => {
    try {
      setRecalculating(true);
      
      const response = await fetch('http://localhost:3001/api/orders/recalculate-commissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiClient.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al recalcular comisiones');
      }

      const data = await response.json();
      showSuccess('Comisiones Recalculadas', `Se actualizaron ${data.updated} de ${data.total} pedidos`);
      
      // Recargar estadísticas
      await loadStats();
    } catch (error) {
      console.error('Error recalculating commissions:', error);
      showError('Error', 'No se pudieron recalcular las comisiones');
    } finally {
      setRecalculating(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
              <p className="text-blue-100">Bienvenido, {user?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                ${stats?.totalRevenue?.toLocaleString() || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Ingresos Totales</h3>
            <p className="text-xs text-gray-500 mt-1">Total procesado</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                ${stats?.totalCommissions?.toLocaleString() || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Comisiones (5%)</h3>
            <p className="text-xs text-gray-500 mt-1">Ganado por plataforma</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                ${stats?.netProfit?.toLocaleString() || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Ganancia Neta</h3>
            <p className="text-xs text-gray-500 mt-1">Comisiones - Wompi</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Total Pedidos</h3>
            <p className="text-xs text-gray-500 mt-1">{stats?.completedOrders || 0} completados</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                ${stats?.totalWompiCosts?.toLocaleString() || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Costos Wompi</h3>
            <p className="text-xs text-gray-500 mt-1">Comisiones de pago</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.activeProviders || 0}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Proveedores Activos</h3>
            <p className="text-xs text-gray-500 mt-1">Con pedidos pagados</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats?.activeClients || 0}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Clientes Activos</h3>
            <p className="text-xs text-gray-500 mt-1">Con pedidos pagados</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones del Sistema</h2>
          
          <div className="space-y-4">
            {/* Recalcular Comisiones */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Recalcular Comisiones</h3>
                <p className="text-sm text-gray-600">
                  Actualiza los valores de comisiones de todos los pedidos completados sin valores guardados
                </p>
              </div>
              <button
                onClick={handleRecalculateCommissions}
                disabled={recalculating}
                className="ml-4 flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-5 h-5 ${recalculating ? 'animate-spin' : ''}`} />
                <span>{recalculating ? 'Recalculando...' : 'Recalcular'}</span>
              </button>
            </div>

            {/* Refresh Stats */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Actualizar Estadísticas</h3>
                <p className="text-sm text-gray-600">
                  Recargar las estadísticas del sistema
                </p>
              </div>
              <button
                onClick={loadStats}
                className="ml-4 flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push('/admin/orders')}
            className="bg-white hover:bg-gray-50 rounded-lg p-6 shadow-sm border-2 border-gray-200 hover:border-blue-500 transition-all text-left"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Ver Pedidos</h3>
            </div>
            <p className="text-sm text-gray-600">Gestionar todos los pedidos del sistema</p>
          </button>

          <button
            onClick={() => router.push('/admin/users')}
            className="bg-white hover:bg-gray-50 rounded-lg p-6 shadow-sm border-2 border-gray-200 hover:border-green-500 transition-all text-left"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Usuarios</h3>
            </div>
            <p className="text-sm text-gray-600">Administrar clientes y proveedores</p>
          </button>

          <button
            onClick={() => router.push('/admin/settings')}
            className="bg-white hover:bg-gray-50 rounded-lg p-6 shadow-sm border-2 border-gray-200 hover:border-purple-500 transition-all text-left"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <LayoutDashboard className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>
            </div>
            <p className="text-sm text-gray-600">Ajustes del sistema</p>
          </button>
        </div>

        {/* Financial Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 shadow-sm border border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Resumen Financiero</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Valor Promedio por Pedido</span>
                <span className="font-bold text-gray-900">
                  ${stats?.avgOrderValue?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">% Comisión Promedio</span>
                <span className="font-bold text-green-700">
                  {stats?.avgCommissionPercent?.toFixed(2) || 0}%
                </span>
              </div>
              <div className="border-t border-green-200 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Margen de Ganancia</span>
                  <span className="font-bold text-green-600">
                    {stats?.netProfit && stats?.totalRevenue 
                      ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(2) 
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 shadow-sm border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Métricas Clave</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Pedidos Completados</span>
                <span className="font-bold text-gray-900">{stats?.completedOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Tasa de Completación</span>
                <span className="font-bold text-blue-700">
                  {stats?.completedOrders && stats?.totalOrders 
                    ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Comisión por Pedido</span>
                <span className="font-bold text-blue-600">
                  ${stats?.totalCommissions && stats?.totalOrders 
                    ? Math.round(stats.totalCommissions / stats.totalOrders).toLocaleString() 
                    : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
