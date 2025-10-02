'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, Home, FileText, Clock, Smartphone, RefreshCw, AlertCircle } from 'lucide-react';
import { apiClient, Order } from '@/services/api';
import { usePaymentMonitor } from '@/hooks/usePayment';
import Confetti from 'react-confetti';

export default function UnifiedPaymentSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const orderId = params.orderId as string;
  const paymentMethod = searchParams?.get('method') || 'card';
  
  const [order, setOrder] = useState<Order | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Hook de monitoreo unificado
  const {
    state: paymentState,
    isLoading,
    forceCheck,
    isCompleted,
    isPending,
    hasError
  } = usePaymentMonitor(orderId);

  // Configurar confetti y cargar pedido
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    const loadOrder = async () => {
      try {
        const orderData = await apiClient.getOrderById(orderId);
        setOrder(orderData);
      } catch (error) {
        console.error('Error loading order:', error);
      }
    };

    loadOrder();

    // Ocultar confetti después de 5 segundos
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [orderId]);

  // Auto-verificación para pagos pendientes
  useEffect(() => {
    if (isPending) {
      const interval = setInterval(() => {
        forceCheck();
      }, 5000); // Cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [isPending, forceCheck]);

  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      'nequi': 'Nequi',
      'bancolombia': 'Bancolombia',
      'pse': 'PSE',
      'cash': 'Efectivo'
    };
    return methods[method] || 'Tarjeta';
  };

  const getStatusMessage = () => {
    if (isLoading) return 'Verificando estado del pago...';
    if (!paymentState) return 'Información no disponible';
    
    switch (paymentState.status) {
      case 'CONFIRMED':
        return '¡Pago Confirmado!';
      case 'APPROVED':
        return 'Pago Aprobado - Confirmando...';
      case 'PENDING':
        return 'Pago Pendiente';
      case 'ERROR':
        return 'Error en el Pago';
      default:
        return 'Verificando...';
    }
  };

  const getStatusColor = () => {
    if (!paymentState) return 'text-gray-600';
    
    switch (paymentState.status) {
      case 'CONFIRMED':
        return 'text-green-600';
      case 'APPROVED':
        return 'text-blue-600';
      case 'PENDING':
        return 'text-yellow-600';
      case 'ERROR':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Confetti */}
      {showConfetti && isCompleted && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      <div className="max-w-md mx-auto bg-white min-h-screen">
        <div className="p-6 text-center">
          {/* Icono principal */}
          <div className="mb-6">
            {isCompleted ? (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            ) : hasError ? (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-12 h-12 text-yellow-600" />
              </div>
            )}
          </div>

          {/* Título principal */}
          <h1 className={`text-2xl font-bold mb-2 ${getStatusColor()}`}>
            {getStatusMessage()}
          </h1>

          <p className="text-gray-600 mb-6">
            {isCompleted 
              ? 'Tu pedido ha sido confirmado y el encargado ha sido notificado'
              : isPending
              ? 'Estamos verificando tu pago. Esto puede tomar unos momentos.'
              : hasError
              ? 'Hubo un problema con tu pago. Por favor intenta nuevamente.'
              : 'Procesando tu solicitud...'
            }
          </p>

          {/* Información del pedido */}
          {order && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h2 className="font-semibold text-gray-900 mb-3">Detalles del Pedido</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Número de Pedido:</span>
                  <span className="font-medium">#{order.id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Servicio:</span>
                  <span className="font-medium">{order.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Encargado:</span>
                  <span className="font-medium">{order.encargado.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium">{order.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hora:</span>
                  <span className="font-medium">{order.time}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Total Pagado:</span>
                  <span className="font-bold text-green-600">
                    ${order.price.toLocaleString('es-CO')} COP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Método de Pago:</span>
                  <span className="font-medium">{getPaymentMethodName(paymentMethod)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Estado del pago detallado */}
          {paymentState && (
            <div className={`p-4 rounded-lg border mb-6 text-left ${
              isCompleted ? 'bg-green-50 border-green-200' :
              hasError ? 'bg-red-50 border-red-200' :
              'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start space-x-3">
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                ) : hasError ? (
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                ) : (
                  <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                )}
                <div>
                  <h3 className={`font-semibold mb-2 ${
                    isCompleted ? 'text-green-900' :
                    hasError ? 'text-red-900' :
                    'text-yellow-900'
                  }`}>
                    {isCompleted ? '✅ Pago Confirmado' :
                     hasError ? '❌ Error en el Pago' :
                     '⏳ Pago en Proceso'}
                  </h3>
                  <p className={`text-sm mb-3 ${
                    isCompleted ? 'text-green-800' :
                    hasError ? 'text-red-800' :
                    'text-yellow-800'
                  }`}>
                    {isCompleted 
                      ? `Tu pago con ${getPaymentMethodName(paymentMethod)} ha sido procesado exitosamente.`
                      : hasError
                      ? paymentState.error || 'Hubo un problema procesando tu pago.'
                      : `Tu transacción está en proceso. ${paymentMethod === 'nequi' ? 'Por favor revisa tu app de Nequi.' : 'El pago se está procesando automáticamente.'}`
                    }
                  </p>
                  
                  {paymentState.transactionId && (
                    <div className={`mt-3 pt-3 border-t ${
                      isCompleted ? 'border-green-200' :
                      hasError ? 'border-red-200' :
                      'border-yellow-200'
                    }`}>
                      <p className={`text-xs ${
                        isCompleted ? 'text-green-700' :
                        hasError ? 'text-red-700' :
                        'text-yellow-700'
                      }`}>
                        <strong>ID de Transacción:</strong> {paymentState.transactionId.slice(-12)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instrucciones específicas por método */}
          {isPending && paymentMethod === 'nequi' && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-start space-x-3">
                <Smartphone className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-purple-900 mb-2">📱 Completa tu pago en Nequi</h3>
                  <ol className="text-sm text-purple-800 space-y-2 list-decimal list-inside">
                    <li>Abre tu app de <strong>Nequi</strong></li>
                    <li>Busca la notificación de pago pendiente</li>
                    <li>Aprueba la transacción de <strong>${order?.price.toLocaleString('es-CO')} COP</strong></li>
                    <li>Recibirás confirmación cuando se complete</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Próximos pasos */}
          {isCompleted && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">📱 Próximos Pasos:</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>✅ Podrás hacer seguimiento en tiempo real del estado</li>
                <li>✅ El encargado te contactará antes de llegar</li>
              </ul>
            </div>
          )}

          {/* Botón de verificar manualmente */}
          {(isPending || hasError) && paymentState?.transactionId && (
            <div className="mb-4">
              <button
                onClick={forceCheck}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Verificar Estado del Pago</span>
              </button>
            </div>
          )}

          {/* Botones de acción */}
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/order/${orderId}`)}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <FileText className="w-5 h-5" />
              <span>Ver Detalles del Pedido</span>
            </button>

            <button
              onClick={() => router.push('/home')}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Volver al Inicio</span>
            </button>
          </div>

          {/* Debug info en desarrollo */}
          {process.env.NODE_ENV === 'development' && paymentState && (
            <div className="mt-6 p-3 bg-gray-100 rounded-lg text-left text-xs">
              <h4 className="font-semibold mb-2">Debug Info:</h4>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(paymentState, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
