'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Calendar, Download, Eye, CreditCard, Banknote, Clock, CheckCircle } from 'lucide-react';
import ProviderNavbar from '@/components/ProviderNavbar';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, Order } from '@/services/api';

export default function ProviderEarningsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'analytics'>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos del backend
  useEffect(() => {
    const loadEarningsData = async () => {
      if (!user || user.role !== 'ENCARGADO') {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        const [orderStats, ordersList] = await Promise.all([
          apiClient.getOrderStats(),
          apiClient.getMyOrders()
        ]);
        
        setStats(orderStats);
        setOrders(ordersList || []);
      } catch (error) {
        console.error('Error loading earnings data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEarningsData();
  }, [user, router]);

  // Calcular ganancias reales basadas en los pedidos
  const calculateEarnings = () => {
    if (!orders.length) return { total: 0, jobs: 0, average: 0 };

    const completedOrders = orders.filter(order => order.status === 'COMPLETED');
    const total = completedOrders.reduce((sum, order) => sum + order.price, 0);
    const jobs = completedOrders.length;
    const average = jobs > 0 ? total / jobs : 0;

    return { total, jobs, average };
  };

  const realEarnings = calculateEarnings();

  // Datos simulados de ganancias
  const earningsData = {
    week: {
      total: 1250.50,
      change: 15.2,
      jobs: 8,
      average: 156.31
    },
    month: {
      total: 4850.75,
      change: 8.7,
      jobs: 24,
      average: 202.11
    },
    year: {
      total: 58209.00,
      change: 23.4,
      jobs: 287,
      average: 202.82
    }
  };

  // Usar datos reales en lugar de simulados
  const currentData = {
    total: stats?.totalEarnings || realEarnings.total,
    jobs: stats?.completed || realEarnings.jobs,
    average: realEarnings.average,
    change: 8.7 // Mantener simulado por ahora ya que necesitaríamos datos históricos
  };

  // Historial de pagos basado en pedidos reales
  const paymentHistory = orders
    .filter(order => order.status === 'COMPLETED' || order.status === 'IN_PROGRESS')
    .map(order => ({
      id: order.id,
      date: order.date,
      client: order.user?.name || 'Cliente',
      service: order.service,
      amount: order.price,
      status: order.status === 'COMPLETED' ? 'paid' : 'pending',
      method: order.paymentMethod === 'card' ? 'card' : 'cash',
      commission: order.price * 0.1 // 10% de comisión simulada
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Datos para gráfico semanal (simulados por ahora)
  const weeklyEarnings = [
    { day: 'Lun', amount: 320 },
    { day: 'Mar', amount: 450 },
    { day: 'Mié', amount: 280 },
    { day: 'Jue', amount: 520 },
    { day: 'Vie', amount: 380 },
    { day: 'Sáb', amount: 680 },
    { day: 'Dom', amount: 420 }
  ];

  const maxAmount = Math.max(...weeklyEarnings.map(d => d.amount));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Pendiente';
      case 'processing': return 'Procesando';
      default: return status;
    }
  };

  const getMethodIcon = (method: string) => {
    return method === 'card' ? CreditCard : Banknote;
  };

  const totalPending = paymentHistory
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCommissions = paymentHistory
    .reduce((sum, p) => sum + p.commission, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando ganancias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Mis Ganancias</h1>
            <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <Download className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de período */}
          <div className="flex bg-white/10 rounded-lg p-1 mb-4">
            {[
              { key: 'week', label: 'Semana' },
              { key: 'month', label: 'Mes' },
              { key: 'year', label: 'Año' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key as any)}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  selectedPeriod === period.key
                    ? 'bg-white text-green-700'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Ganancias principales */}
          <div className="text-center">
            <p className="text-green-100 text-sm mb-1">Ganancias totales</p>
            <p className="text-3xl font-bold mb-2">${currentData.total.toLocaleString()}</p>
            <div className="flex items-center justify-center space-x-2">
              {currentData.change > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-200" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-200" />
              )}
              <span className={`text-sm ${currentData.change > 0 ? 'text-green-200' : 'text-red-200'}`}>
                {currentData.change > 0 ? '+' : ''}{currentData.change}% vs período anterior
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white px-6 py-3 border-b border-gray-200">
          <div className="flex space-x-1">
            {[
              { key: 'overview', label: 'Resumen' },
              { key: 'payments', label: 'Pagos' },
              { key: 'analytics', label: 'Análisis' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.key
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Estadísticas rápidas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Trabajos</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{currentData.jobs}</p>
                  <p className="text-sm text-gray-600">Completados</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">Promedio</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${currentData.average}</p>
                  <p className="text-sm text-gray-600">Por trabajo</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-gray-600">Pendientes</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${totalPending}</p>
                  <p className="text-sm text-gray-600">Por cobrar</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">Comisiones</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${totalCommissions}</p>
                  <p className="text-sm text-gray-600">Total pagado</p>
                </div>
              </div>

              {/* Gráfico de ganancias semanales */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Ganancias esta semana</h3>
                <div className="flex items-end justify-between h-32 space-x-2">
                  {weeklyEarnings.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-green-500 rounded-t-sm transition-all duration-300 hover:bg-green-600"
                        style={{
                          height: `${(day.amount / maxAmount) * 100}%`,
                          minHeight: '8px'
                        }}
                      ></div>
                      <span className="text-xs text-gray-600 mt-2">{day.day}</span>
                      <span className="text-xs font-medium text-gray-900">${day.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Próximos pagos */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Próximos pagos</h3>
                  <button 
                    onClick={() => setActiveTab('payments')}
                    className="text-green-600 text-sm font-medium hover:text-green-700"
                  >
                    Ver todos
                  </button>
                </div>
                <div className="space-y-3">
                  {paymentHistory.filter(p => p.status === 'pending').slice(0, 3).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{payment.client}</p>
                        <p className="text-sm text-gray-600">{new Date(payment.date).toLocaleDateString('es-ES')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${payment.amount}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(payment.status)}`}>
                          {getStatusText(payment.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Historial de Pagos</h2>
                <button className="text-green-600 text-sm font-medium hover:text-green-700 flex items-center space-x-1">
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </button>
              </div>

              {paymentHistory.map((payment) => {
                const MethodIcon = getMethodIcon(payment.method);
                
                return (
                  <div key={payment.id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <MethodIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{payment.client}</h3>
                          <p className="text-sm text-gray-600">{payment.service}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusText(payment.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(payment.date).toLocaleDateString('es-ES')}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <span className="capitalize">{payment.method === 'card' ? 'Tarjeta' : 'Efectivo'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${payment.amount}</p>
                        <p className="text-xs text-gray-500">Comisión: ${payment.commission}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Métodos de pago más usados */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Métodos de pago</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">Tarjeta</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">70%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Banknote className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Efectivo</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">30%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Servicios más rentables */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Servicios más rentables</h3>
                <div className="space-y-3">
                  {[
                    { service: 'Reparación de tuberías', earnings: 1250, jobs: 5 },
                    { service: 'Instalación de grifos', earnings: 900, jobs: 6 },
                    { service: 'Destapado de cañerías', earnings: 600, jobs: 8 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.service}</p>
                        <p className="text-sm text-gray-600">{item.jobs} trabajos</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${item.earnings}</p>
                        <p className="text-sm text-gray-600">${(item.earnings / item.jobs).toFixed(0)}/trabajo</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tendencias */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Tendencias del mes</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600">Mejor día</p>
                    <p className="font-semibold text-gray-900">Sábado</p>
                    <p className="text-xs text-green-600">+25% promedio</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600">Mejor horario</p>
                    <p className="font-semibold text-gray-900">14:00-18:00</p>
                    <p className="text-xs text-blue-600">40% de trabajos</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-20"></div>
      </div>

      <ProviderNavbar activeRoute="earnings" />
    </div>
  );
}
