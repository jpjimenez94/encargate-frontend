'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Clock, Smartphone, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { wompiService } from '@/services/wompi';
import { apiClient } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

export default function PaymentPendingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useToast();
  const [checking, setChecking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'APPROVED' | 'DECLINED'>('PENDING');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  
  const orderId = params.orderId as string;
  const transactionId = searchParams?.get('transactionId') || '';

  // Verificar estado del pago cada 5 segundos (SOLO verificar, NO redirigir)
  useEffect(() => {
    console.log('🔄 useEffect triggered with transactionId:', transactionId);
    if (!transactionId) {
      console.log('❌ No transactionId, returning');
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const transaction = await wompiService.getTransaction(transactionId);
        console.log('🔍 Transaction status from Wompi:', transaction.status);
        
        // Solo actualizar el estado, NO redirigir automáticamente
        if (transaction.status === 'APPROVED') {
          console.log('✅ Setting payment status to APPROVED');
          setPaymentStatus('APPROVED');
          
          // Confirmar el pago en el backend automáticamente (solo una vez)
          if (!paymentConfirmed) {
            try {
              console.log('💳 Auto-confirmando pago en backend:', { orderId, transactionId });
              await apiClient.confirmOrderPayment(orderId, transactionId);
              console.log('✅ Pago auto-confirmado en backend');
              setPaymentConfirmed(true);
            } catch (paymentError) {
              console.error('❌ Error auto-confirmando pago:', paymentError);
            }
          }
        } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
          console.log('❌ Setting payment status to DECLINED');
          setPaymentStatus('DECLINED');
        } else {
          console.log('⏳ Setting payment status to PENDING');
          setPaymentStatus('PENDING');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        // En caso de error, asumir que está pendiente
        setPaymentStatus('PENDING');
      }
    };

    // Verificar inmediatamente
    checkPaymentStatus();

    // Verificar cada 5 segundos
    const interval = setInterval(checkPaymentStatus, 5000);

    return () => clearInterval(interval);
  }, [transactionId, orderId]);

  // Countdown de 60 segundos
  useEffect(() => {
    if (countdown === 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleCheckNow = async () => {
    if (!transactionId) return;
    
    setChecking(true);
    try {
      const transaction = await wompiService.getTransaction(transactionId);
      
      if (transaction.status === 'APPROVED') {
        // Confirmar el pago en el backend usando el nuevo endpoint (solo si no fue confirmado antes)
        if (!paymentConfirmed) {
          try {
            console.log('💳 Confirmando pago en backend:', { orderId, transactionId });
            const result = await apiClient.confirmOrderPayment(orderId, transactionId);
            console.log('✅ Pago confirmado en backend:', result);
            setPaymentConfirmed(true);
          } catch (paymentError) {
            console.error('Error confirming payment:', paymentError);
          }
        }
        
        showSuccess('¡Pago Aprobado!', 'Tu pago ha sido confirmado');
        // Esperar 1 segundo antes de redirigir para que el usuario vea el mensaje
        setTimeout(() => {
          router.push(`/payment-success/${orderId}?transactionId=${transactionId}`);
        }, 1000);
      } else if (transaction.status === 'PENDING') {
        showError('Aún Pendiente', 'El pago aún no ha sido aprobado. Por favor apruébalo en tu app de Nequi.');
        setChecking(false);
      } else {
        // Cancelar automáticamente el pedido cuando el pago es rechazado
        try {
          await apiClient.cancelOrderAndPayment(orderId, transactionId);
          console.log('✅ Order and payment cancelled successfully after payment rejection');
        } catch (cancelError) {
          console.error('⚠️ Error cancelling order after payment rejection:', cancelError);
          // Continuar aunque falle la cancelación
        }
        
        showError('Pago Rechazado', 'El pago fue rechazado y el pedido ha sido cancelado automáticamente. Regresando al inicio...');
        setTimeout(() => {
          router.push('/home');
        }, 3000);
      }
    } catch (error) {
      console.error('Error checking payment:', error);
      showError('Error', 'No se pudo verificar el estado del pago');
      setChecking(false);
    }
  };

  const handleCancelPayment = async () => {
    setShowCancelModal(false);
    setCancelling(true);
    
    let wompiCancelled = false;
    let orderCancelled = false;
    
    try {
      // Intentar cancelar la transacción en Wompi (si es posible)
      if (transactionId) {
        try {
          const wompiResult = await wompiService.cancelTransaction(transactionId);
          console.log('✅ Wompi cancellation result:', wompiResult);
          wompiCancelled = true;
        } catch (wompiError) {
          console.warn('⚠️ No se pudo cancelar en Wompi:', wompiError);
          // Continuar con la cancelación del pedido aunque falle Wompi
        }
      }

      // Cancelar el pedido en nuestro backend
      try {
        await apiClient.cancelOrderAndPayment(orderId, transactionId);
        orderCancelled = true;
        console.log('✅ Order cancelled successfully');
      } catch (orderError) {
        console.error('❌ Error cancelling order:', orderError);
        throw orderError; // Re-lanzar el error del pedido
      }
      
      // Si llegamos aquí, al menos el pedido fue cancelado
      showSuccess('Cancelado', 'El pedido ha sido cancelado exitosamente');
      
      // Redirigir después de un momento
      setTimeout(() => {
        router.push('/home');
      }, 1500);
      
    } catch (error: any) {
      console.error('❌ Error in cancellation process:', error);
      
      // Mensajes de error más específicos
      let errorMessage = 'No se pudo cancelar el pedido.';
      
      if (error && error.message) {
        if (error.message.includes('ACCEPTED')) {
          errorMessage = 'El pedido ya fue procesado y no se puede cancelar. Contacta al proveedor si necesitas hacer cambios.';
        } else if (error.message.includes('IN_PROGRESS')) {
          errorMessage = 'El pedido ya está en progreso y no se puede cancelar.';
        } else if (error.message.includes('COMPLETED')) {
          errorMessage = 'El pedido ya fue completado y no se puede cancelar.';
        }
      }
      
      showError('Error al Cancelar', errorMessage);
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Icono animado */}
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
            paymentStatus === 'APPROVED' 
              ? 'bg-green-100' 
              : paymentStatus === 'DECLINED'
              ? 'bg-red-100'
              : 'bg-purple-100 animate-pulse'
          }`}>
            <Smartphone className={`w-12 h-12 ${
              paymentStatus === 'APPROVED' 
                ? 'text-green-600' 
                : paymentStatus === 'DECLINED'
                ? 'text-red-600'
                : 'text-purple-600'
            }`} />
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {paymentStatus === 'APPROVED' 
              ? '✅ ¡Pago Aprobado!' 
              : paymentStatus === 'DECLINED'
              ? '❌ Pago Rechazado'
              : 'Esperando Aprobación'
            }
          </h1>
          <p className="text-gray-600 mb-8">
            {paymentStatus === 'APPROVED' 
              ? 'Tu pago ha sido aprobado. Haz clic en "Continuar" para finalizar.'
              : paymentStatus === 'DECLINED'
              ? 'El pago fue rechazado. El pedido será cancelado automáticamente.'
              : 'Revisa tu app de Nequi y aprueba el pago'
            }
          </p>

          {/* Instrucciones */}
          {paymentStatus === 'DECLINED' ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 text-left">
              <h2 className="font-semibold text-red-900 mb-3">❌ Pago Rechazado:</h2>
              <div className="text-sm text-red-800 space-y-2">
                <p>• El pago no pudo ser procesado</p>
                <p>• El pedido será cancelado automáticamente</p>
                <p>• Puedes intentar nuevamente con otro método de pago</p>
              </div>
            </div>
          ) : paymentStatus === 'APPROVED' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-left">
              <h2 className="font-semibold text-green-900 mb-3">✅ Pago Aprobado:</h2>
              <div className="text-sm text-green-800 space-y-2">
                <p>• Tu pago ha sido confirmado exitosamente</p>
                <p>• El pedido ha sido procesado</p>
                <p>• Haz clic en "Continuar" para finalizar</p>
              </div>
            </div>
          ) : (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6 text-left">
              <h2 className="font-semibold text-purple-900 mb-3">📱 Pasos a seguir:</h2>
              <ol className="text-sm text-purple-800 space-y-2 list-decimal list-inside">
                <li>Abre tu app de Nequi</li>
                <li>Busca la notificación de pago</li>
                <li>Revisa el monto y confirma</li>
                <li>Aprueba el pago</li>
              </ol>
            </div>
          )}

          {/* Countdown */}
          {paymentStatus !== 'DECLINED' && (
            <div className="flex items-center justify-center space-x-2 text-gray-600 mb-6">
              <Clock className="w-5 h-5" />
              <span>Verificando automáticamente... {countdown}s</span>
            </div>
          )}

          {/* Botón de verificar ahora / continuar */}
          {paymentStatus === 'DECLINED' ? (
            <button
              onClick={() => router.push('/home')}
              className="w-full py-3 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors mb-4"
            >
              Volver al Inicio
            </button>
          ) : (
            <button
              onClick={handleCheckNow}
              disabled={checking}
              className={`w-full py-3 rounded-lg font-semibold transition-colors mb-4 ${
                checking
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : paymentStatus === 'APPROVED'
                  ? 'bg-green-500 text-white hover:bg-green-600 animate-pulse'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
            >
              {checking ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Verificando...
                </span>
              ) : paymentStatus === 'APPROVED' ? (
                <span className="flex items-center justify-center">
                  ✅ Continuar
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Verificar Ahora
                </span>
              )}
            </button>
          )}

          {/* Botón de cancelar - solo mostrar si está PENDING */}
          {paymentStatus === 'PENDING' && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={cancelling || checking}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                cancelling || checking
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-white border-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400'
              }`}
            >
              {cancelling ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-500 border-t-transparent mr-2"></div>
                  Cancelando...
                </span>
              ) : (
                'Cancelar Pago y Pedido'
              )}
            </button>
          )}

          {/* Mensaje de ayuda */}
          <p className="text-sm text-gray-500 mt-6">
            {paymentStatus === 'APPROVED' 
              ? 'Tu pago ha sido procesado exitosamente'
              : paymentStatus === 'DECLINED'
              ? 'El pago no pudo ser procesado. Intenta con otro método.'
              : 'El pago se verificará automáticamente cuando lo apruebes en Nequi'
            }
          </p>
        </div>
      </div>

      {/* Modal de confirmación de cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Cancelar Pago</h3>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas cancelar este pago y pedido? Esta acción no se puede deshacer.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                No, mantener
              </button>
              <button
                onClick={handleCancelPayment}
                className="flex-1 py-2 px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
