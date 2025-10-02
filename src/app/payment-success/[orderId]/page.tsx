'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { CheckCircle, Home, FileText, Clock, Smartphone, RefreshCw } from 'lucide-react';
import { apiClient, Order } from '@/services/api';
import { wompiService } from '@/services/wompi';
import { pricingService } from '@/services/pricing';
import Confetti from 'react-confetti';

export default function PaymentSuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'APPROVED' | 'DECLINED' | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [localStorageTransactionId, setLocalStorageTransactionId] = useState<string | null>(null);
  const orderId = resolvedParams.orderId;
  const paymentMethod = searchParams?.get('method') || 'card';
  const transactionId = searchParams?.get('transactionId') || searchParams?.get('id'); // Wompi puede usar 'id' en lugar de 'transactionId'

  // Debug logging
  console.log('🔍 Payment Success Page - URL Params:', {
    orderId,
    paymentMethod,
    transactionId,
    allParams: searchParams ? Object.fromEntries(searchParams.entries()) : 'No searchParams'
  });

  const checkPaymentStatus = async () => {
    setChecking(true);
    let currentTransactionId = transactionId;
    
    // Primero intentar localStorage (más rápido y confiable)
    if (!currentTransactionId) {
      console.log('🔍 No transactionId in URL, trying localStorage first...');
      
      if (localStorageTransactionId) {
        currentTransactionId = localStorageTransactionId;
        console.log('✅ Found transactionId from localStorage:', currentTransactionId);
      } else {
        console.log('❌ No transactionId found in localStorage or URL');
        setChecking(false);
        return;
      }
    }

    if (currentTransactionId) {
      try {
        const transaction = await wompiService.getTransaction(currentTransactionId);
        console.log('🔍 Payment status in success page:', transaction.status);
        
        if (transaction.status === 'APPROVED') {
          setPaymentStatus('APPROVED');
          
          // Auto-confirmar el pago en el backend (solo una vez)
          if (!paymentConfirmed) {
            try {
              console.log('🔄 Auto-confirmando pago en backend desde payment-success...');
              await apiClient.confirmOrderPayment(orderId, currentTransactionId);
              setPaymentConfirmed(true);
              console.log('✅ Pago confirmado automáticamente en backend');
              
              // Recargar el pedido para obtener el estado actualizado
              const updatedOrder = await apiClient.getOrderById(orderId);
              setOrder(updatedOrder);
            } catch (confirmError) {
              console.error('❌ Error confirmando pago automáticamente:', confirmError);
            }
          }
        } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
          setPaymentStatus('DECLINED');
        } else {
          setPaymentStatus('PENDING');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setPaymentStatus('PENDING');
      }
    }
    setChecking(false);
  };

  useEffect(() => {
    // Configurar tamaño de ventana para confetti y obtener localStorage
    if (typeof window !== 'undefined') {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      // Obtener transactionId del localStorage
      const localTxId = localStorage.getItem(`transaction_${orderId}`);
      setLocalStorageTransactionId(localTxId);
    }

    const loadOrder = async () => {
      try {
        const orderData = await apiClient.getOrderById(orderId);
        setOrder(orderData);
      } catch (error) {
      }
    };

    if (orderId) {
      loadOrder();
      // Pequeño delay para asegurar que localStorage se haya cargado
      setTimeout(() => checkPaymentStatus(), 500);
    }

    return () => {};
  }, [orderId]);

  // Polling separado que se activa cuando tenemos transactionId y el pago no está aprobado
  useEffect(() => {
    const currentTxId = transactionId || localStorageTransactionId;
    
    // Solo activar polling si:
    // 1. Hay transactionId (URL o localStorage)
    // 2. El pago NO está aprobado
    // 3. El pago NO está rechazado
    if (currentTxId && paymentStatus !== 'APPROVED' && paymentStatus !== 'DECLINED') {
      console.log('Activando polling automático para transactionId:', currentTxId);
      
      const pollInterval = setInterval(() => {
        console.log('Polling - verificando estado del pago...');
        checkPaymentStatus();
      }, 3000);

      return () => {
        console.log('Deteniendo polling automático');
        clearInterval(pollInterval);
      };
    }
  }, [transactionId, localStorageTransactionId, paymentStatus]);

  // Confetti timer
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      {/* Confetti */}
      {showConfetti && (
        (transactionId || localStorageTransactionId)
          ? paymentStatus === 'APPROVED'  // Si hay transacción, solo mostrar si está aprobada
          : true  // Si no hay transacción (pago en efectivo), mostrar confetti
      ) && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Icono dinámico según estado */}
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
            (transactionId || localStorageTransactionId) ? (
              paymentStatus === 'APPROVED'
                ? 'bg-green-100 animate-bounce'
                : paymentStatus === 'PENDING'
                ? 'bg-yellow-100'
                : 'bg-red-100'
            ) : (
              // Sin transactionId = pago en efectivo
              'bg-green-100 animate-bounce'
            )
          }`}>
            {(transactionId || localStorageTransactionId) ? (
              paymentStatus === 'APPROVED' ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : paymentStatus === 'PENDING' ? (
                <Clock className="w-12 h-12 text-yellow-600" />
              ) : (
                <RefreshCw className="w-12 h-12 text-red-600" />
              )
            ) : (
              // Sin transactionId = pago en efectivo
              <CheckCircle className="w-12 h-12 text-green-600" />
            )}
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {/* Si hay transactionId, priorizar el estado de la transacción */}
            {(transactionId || localStorageTransactionId) ? (
              paymentStatus === 'APPROVED' 
                ? '¡Pago Exitoso! 🎉'
                : paymentStatus === 'PENDING'
                ? 'Verificando Pago...'
                : paymentStatus === 'DECLINED'
                ? 'Pago Rechazado ❌'
                : 'Verificando Pago...'
            ) : (
              // Si no hay transactionId, es pago en efectivo
              paymentMethod === 'cash' 
                ? '¡Pedido Confirmado! 🎉'
                : '¡Pedido Confirmado! 🎉'
            )}
          </h1>
          <p className="text-gray-600 mb-8">
            {(transactionId || localStorageTransactionId) ? (
              paymentStatus === 'APPROVED'
                ? 'Tu pedido ha sido confirmado y el encargado ha sido notificado'
                : paymentStatus === 'PENDING'
                ? 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.'
                : paymentStatus === 'DECLINED'
                ? 'El pago fue rechazado. Por favor intenta con otro método de pago.'
                : 'Estamos verificando tu pago. Usa el botón de abajo para actualizar el estado.'
            ) : (
              paymentMethod === 'cash' 
                ? 'Tu pedido ha sido confirmado. Pagarás en efectivo al recibir el servicio'
                : 'Tu pedido ha sido confirmado'
            )}
          </p>

          {/* Alerta para pagos pendientes - Nequi o Bancolombia */}
          {transactionId && paymentStatus === 'PENDING' && (
            <div className={`${paymentMethod === 'nequi' ? 'bg-purple-50 border-purple-200' : 'bg-yellow-50 border-yellow-200'} border-2 rounded-lg p-4 mb-6 text-left`}>
              <div className="flex items-start space-x-3">
                <Clock className={`w-6 h-6 ${paymentMethod === 'nequi' ? 'text-purple-600' : 'text-yellow-600'} flex-shrink-0 mt-1`} />
                <div>
                  <h3 className={`font-semibold ${paymentMethod === 'nequi' ? 'text-purple-900' : 'text-yellow-900'} mb-2`}>
                    {paymentMethod === 'nequi' ? '📱 Pago con Nequi Pendiente' : '🏦 Pago con Bancolombia Pendiente'}
                  </h3>
                  <p className={`text-sm ${paymentMethod === 'nequi' ? 'text-purple-800' : 'text-yellow-800'} mb-3`}>
                    Tu transacción está en proceso. 
                    {paymentMethod === 'nequi' ? ' Por favor revisa tu app de Nequi.' : ' El pago se está procesando automáticamente.'}
                  </p>
                  {paymentMethod === 'nequi' && (
                    <ol className="text-sm text-purple-800 space-y-2 list-decimal list-inside">
                      <li>Abre tu app de <strong>Nequi</strong></li>
                      <li>Busca la notificación de pago pendiente</li>
                      <li>Aprueba la transacción de <strong>${order?.price.toLocaleString('es-CO')} COP</strong></li>
                      <li>Recibirás confirmación cuando se complete</li>
                    </ol>
                  )}
                  <div className={`mt-3 pt-3 border-t ${paymentMethod === 'nequi' ? 'border-purple-200' : 'border-yellow-200'}`}>
                    <p className={`text-xs ${paymentMethod === 'nequi' ? 'text-purple-700' : 'text-yellow-700'}`}>
                      <strong>ID de Transacción:</strong> {transactionId.slice(-12)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confirmación de pago aprobado */}
          {transactionId && paymentStatus === 'APPROVED' && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">✅ Pago Confirmado</h3>
                  <p className="text-sm text-green-800 mb-3">
                    Tu pago con {paymentMethod === 'nequi' ? 'Nequi' : paymentMethod === 'bancolombia' ? 'Bancolombia' : 'PSE'} ha sido procesado exitosamente.
                  </p>
                  <div className="bg-green-100 rounded p-3">
                    <p className="text-sm text-green-800">
                      <strong>Monto:</strong> ${order?.price.toLocaleString('es-CO')} COP<br/>
                      <strong>ID de Transacción:</strong> {transactionId.slice(-12)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Información del pedido */}
          {order && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h2 className="font-semibold text-gray-900 mb-4">Detalles del Pedido</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Número de Pedido:</span>
                  <span className="font-medium text-gray-900">#{order.id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Servicio:</span>
                  <span className="font-medium text-gray-900">{order.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Encargado:</span>
                  <span className="font-medium text-gray-900">{order.encargado?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(order.date).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hora:</span>
                  <span className="font-medium text-gray-900">{order.time}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-lg font-semibold text-gray-900">Total Pagado:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${(() => {
                      // Si es pago digital (no efectivo), calcular con comisiones
                      if (order.paymentMethod && order.paymentMethod !== 'cash') {
                        const breakdown = pricingService.calculatePricingLocal(order.price);
                        return Math.round(breakdown.totalPrice).toLocaleString();
                      }
                      return order.price.toLocaleString();
                    })()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Verificación de pago - Mostrar si el pago no está aprobado y hay transactionId */}
          {paymentStatus !== 'APPROVED' && (transactionId || localStorageTransactionId) && (
            <div className="mb-6 space-y-3">
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <p className="text-sm text-yellow-900 text-center font-semibold mb-2">
                  ⏳ Estamos verificando tu pago automáticamente
                </p>
                <p className="text-xs text-yellow-800 text-center mb-3">
                  Si completaste el pago, haz clic en el botón para actualizar el estado
                </p>
                <button
                  onClick={checkPaymentStatus}
                  disabled={checking}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-lg font-bold hover:from-purple-700 hover:to-purple-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <RefreshCw className={`w-5 h-5 ${checking ? 'animate-spin' : ''}`} />
                  <span className="text-base">{checking ? 'Verificando Estado...' : '🔄 Actualizar Estado del Pago'}</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center italic">
                Este proceso puede tomar unos segundos. Verificación automática cada 3 segundos.
              </p>
            </div>
          )}

          {/* Próximos pasos */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">📱 Próximos Pasos:</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>✅ Podrás hacer seguimiento en tiempo real del estado</li>
              <li>✅ El encargado te contactará antes de llegar</li>
            </ul>
          </div>

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

          {/* Mensaje de agradecimiento */}
          <p className="text-sm text-gray-500 mt-6">
            Gracias por confiar en Encárgate 💙
          </p>
        </div>
      </div>
    </div>
  );
}
