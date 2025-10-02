'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, AlertCircle, Smartphone, Building2, DollarSign, Lock } from 'lucide-react';

// Componentes de iconos simplificados
const NequiIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <div className={`${className} bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
    NEQUI
  </div>
);

const BancolombiaIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <div className={`${className} bg-yellow-400 rounded-lg flex items-center justify-center text-blue-800 font-bold text-xs`}>
    BANCO
  </div>
);

const PSEIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <div className={`${className} bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
    PSE
  </div>
);

const CashIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <div className={`${className} bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
    CASH
  </div>
);

type PaymentMethod = 'nequi' | 'bancolombia' | 'pse' | 'cash';

interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

const paymentMethods: PaymentMethodConfig[] = [
  {
    id: 'nequi',
    name: 'Nequi',
    icon: NequiIcon,
    description: 'Pago inmediato desde tu app',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'bancolombia',
    name: 'Bancolombia',
    icon: BancolombiaIcon,
    description: 'Transferencia bancaria',
    color: 'from-yellow-400 to-yellow-600'
  },
  {
    id: 'pse',
    name: 'PSE',
    icon: PSEIcon,
    description: 'Débito desde tu banco',
    color: 'from-blue-500 to-blue-700'
  },
  {
    id: 'cash',
    name: 'Efectivo',
    icon: CashIcon,
    description: 'Pago al recibir el servicio',
    color: 'from-green-500 to-green-600'
  }
];

export default function TestCheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('nequi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nequiPhone, setNequiPhone] = useState('3991111111'); // Número de prueba

  // Mock order data
  const mockOrder = {
    id: orderId,
    service: 'Limpieza del hogar',
    date: '2025-01-01',
    time: '10:00 AM',
    price: 50000,
    encargado: { name: 'Miguel Paredes' }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (selectedMethod === 'cash') {
        alert('¡Pedido confirmado! Pagarás en efectivo al recibir el servicio.');
        router.push(`/payment-success/${orderId}?method=cash`);
      } else {
        alert(`Pago iniciado con ${selectedMethod}. Revisa tu app para aprobar.`);
        router.push(`/payment-success/${orderId}?method=${selectedMethod}`);
      }
    } catch (error) {
      setError('Error procesando el pago. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="ml-3 text-xl font-semibold text-gray-900">Método de Pago</h1>
        </div>

        <div className="p-4 space-y-6">
          {/* Resumen del pedido */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="font-semibold text-blue-900 mb-2">Resumen del Pedido</h2>
            <div className="space-y-1 text-sm text-blue-800">
              <p><strong>Servicio:</strong> {mockOrder.service}</p>
              <p><strong>Encargado:</strong> {mockOrder.encargado.name}</p>
              <p><strong>Fecha:</strong> {mockOrder.date}</p>
              <p><strong>Hora:</strong> {mockOrder.time}</p>
              <p><strong>Total:</strong> ${mockOrder.price.toLocaleString('es-CO')} COP</p>
            </div>
          </div>

          {/* Información de prueba */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">🧪 Modo de Prueba</h3>
            <div className="text-sm text-yellow-800 space-y-1">
              <p><strong>Nequi:</strong> 3991111111 = ✅ Aprobado</p>
              <p><strong>Nequi:</strong> 3992222222 = ❌ Rechazado</p>
              <p><strong>Bancolombia:</strong> Sandbox con sandbox_status</p>
              <p><strong>PSE:</strong> Banco de prueba disponible</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
                <div>
                  <h3 className="font-semibold text-red-900">Error</h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Métodos de pago */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecciona tu método de pago</h2>
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="w-10 h-10 mr-3" />
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-gray-900">{method.name}</h3>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                      {selectedMethod === method.id && (
                        <CheckCircle className="w-6 h-6 text-blue-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campos específicos por método */}
          {selectedMethod === 'nequi' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de celular Nequi
              </label>
              <input
                type="tel"
                value={nequiPhone}
                onChange={(e) => setNequiPhone(e.target.value)}
                placeholder="3991111111"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Usa 3991111111 para pago aprobado o 3992222222 para rechazado
              </p>
            </div>
          )}

          {/* Botón de pago */}
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className={`w-full py-4 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedMethod === 'cash'
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Procesando...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                {selectedMethod === 'cash' ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Confirmar Pedido
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Pagar ${mockOrder.price.toLocaleString('es-CO')} COP
                  </>
                )}
              </span>
            )}
          </button>

          {/* Información adicional */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <h3 className="font-semibold text-gray-900 mb-2">🚀 Nueva Arquitectura Unificada</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>✅ Estado centralizado con PaymentStateManager</p>
              <p>✅ Servicio unificado para todos los métodos</p>
              <p>✅ Auto-monitoring y confirmación automática</p>
              <p>✅ Múltiples fallbacks para transactionId</p>
              <p>✅ Manejo robusto de errores</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
