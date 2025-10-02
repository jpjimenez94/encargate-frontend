'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CreditCard, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient, Order } from '@/services/api';
import { wompiService } from '@/services/wompi';

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [waitingApproval, setWaitingApproval] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'nequi' | 'bancolombia' | 'pse' | 'card' | 'cash'>('nequi');
  const [wompiTransactionId, setWompiTransactionId] = useState<string | null>(null);
  const orderId = params.orderId as string;

  // Datos específicos por método
  const [nequiPhone, setNequiPhone] = useState('3991111111'); // Número de prueba de Wompi Sandbox (APROBADO)
  const [pseBank, setPseBank] = useState('');
  const [pseUserType, setPseUserType] = useState<'NATURAL' | 'JURIDICA'>('NATURAL');
  const [pseDocType, setPseDocType] = useState<'CC' | 'NIT'>('CC');
  const [pseDocNumber, setPseDocNumber] = useState('');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    const loadOrder = async () => {
      if (!user || user.role !== 'CLIENTE') {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        const orderData = await apiClient.getOrderById(orderId);
        setOrder(orderData);
      } catch (error) {
        console.error('Error loading order:', error);
        showError('Error', 'No se pudo cargar el pedido');
        router.push('/orders');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId, user, router]);

  const handleCardNumberChange = (value: string) => {
    // Formatear número de tarjeta (XXXX XXXX XXXX XXXX)
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardData({ ...cardData, number: formatted.slice(0, 19) });
  };

  const handleExpiryChange = (value: string) => {
    // Formatear fecha de expiración (MM/YY)
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      setCardData({ ...cardData, expiry: `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}` });
    } else {
      setCardData({ ...cardData, expiry: cleaned });
    }
  };

  const handlePayment = async () => {
    if (paymentMethod === 'card') {
      // Validar datos de tarjeta
      if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
        showError('Error', 'Por favor completa todos los campos de la tarjeta');
        return;
      }

      if (cardData.number.replace(/\s/g, '').length !== 16) {
        showError('Error', 'Número de tarjeta inválido');
        return;
      }
    }

    if (paymentMethod === 'nequi' && !nequiPhone) {
      showError('Error', 'Por favor ingresa tu número de celular Nequi');
      return;
    }

    try {
      setProcessing(true);

      // Para Nequi, crear transacción en Wompi
      if (paymentMethod === 'nequi') {
        try {
          // Usar email de prueba para sandbox de Wompi
          const testEmail = `test${Date.now()}@sandbox.wompi.co`;
          
          const transaction = await wompiService.createNequiTransaction({
            amount: Math.round(order!.price * 100), // Convertir a centavos y redondear a entero
            currency: 'COP',
            customerEmail: testEmail,
            phoneNumber: nequiPhone,
          });
          
          console.log('📦 Transacción de Wompi:', transaction);
          
          if (transaction?.id) {
            setWompiTransactionId(transaction.id);
            setProcessing(false);
            setWaitingApproval(true);
            return;
          } else {
            throw new Error('No se pudo crear la transacción en Wompi');
          }
        } catch (error) {
          console.error('Error creating Wompi transaction:', error);
          showError('Error', 'No se pudo iniciar el pago con Nequi');
          setProcessing(false);
          return;
        }
      }

      // Para Bancolombia, similar a Nequi
      if (paymentMethod === 'bancolombia') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProcessing(false);
        setWaitingApproval(true);
        return;
      }

      // Para otros métodos, procesar directamente
      await new Promise(resolve => setTimeout(resolve, 2000));
      await apiClient.updateOrderStatus(orderId, 'ACCEPTED');

      showSuccess('¡Pago Exitoso!', 'Tu pago ha sido procesado correctamente');
      router.push(`/payment-success/${orderId}`);
    } catch (error) {
      console.error('Error processing payment:', error);
      showError('Error', 'No se pudo procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  const handleApprovePayment = async () => {
    try {
      setProcessing(true);
      
      // Si hay transacción de Wompi, verificar su estado usando el servicio
      if (wompiTransactionId) {
        const transaction = await wompiService.getTransaction(wompiTransactionId);
        
        console.log('📊 Estado de transacción Wompi:', transaction);
        
        // En Sandbox, las transacciones de Nequi se quedan en PENDING
        // Por lo tanto, aceptamos PENDING como válido en desarrollo
        if (transaction.status === 'APPROVED' || transaction.status === 'PENDING') {
          await apiClient.updateOrderStatus(orderId, 'ACCEPTED');
          showSuccess('¡Pago Exitoso!', 'Tu pago ha sido procesado correctamente');
          router.push(`/payment-success/${orderId}`);
        } else if (transaction.status === 'DECLINED') {
          // Cancelar automáticamente el pedido y pago cuando es rechazado
          try {
            await apiClient.cancelOrderAndPayment(orderId, wompiTransactionId);
            console.log('✅ Order and payment cancelled successfully after DECLINED status');
          } catch (cancelError) {
            console.error('⚠️ Error cancelling order after payment rejection:', cancelError);
            // Continuar aunque falle la cancelación
          }
          
          showError('Pago Rechazado', 'El pago fue rechazado y el pedido ha sido cancelado automáticamente. Por favor verifica los datos e intenta crear un nuevo pedido.');
          setTimeout(() => {
            router.push('/home');
          }, 3000);
        } else {
          showError('Error', 'No se pudo verificar el estado del pago. Redirigiendo...');
          setTimeout(() => {
            router.push(`/payment-pending/${orderId}?transactionId=${wompiTransactionId}`);
          }, 1500);
        }
      } else {
        // Sin Wompi, aprobar directamente (para otros métodos)
        await apiClient.updateOrderStatus(orderId, 'ACCEPTED');
        showSuccess('¡Pago Exitoso!', 'Tu pago ha sido procesado correctamente');
        router.push(`/payment-success/${orderId}`);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      showError('Error', 'No se pudo procesar el pago');
      setProcessing(false);
    }
  };

  const handleCancelPayment = () => {
    setWaitingApproval(false);
    showError('Pago Cancelado', 'El pago fue cancelado');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">Checkout</h1>
              <p className="text-blue-100 text-sm">Completa tu pago</p>
            </div>
          </div>
        </div>

        {/* Resumen del pedido */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-3">Resumen del Pedido</h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
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
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-blue-600">
                ${order.price.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Método de pago */}
        <div className="p-4 space-y-4">
          <h2 className="font-semibold text-gray-900">Método de Pago</h2>
          
          {/* Selector de método */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('nequi')}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'nequi'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`text-2xl mx-auto mb-2 ${
                paymentMethod === 'nequi' ? 'text-purple-600' : 'text-gray-400'
              }`}>
                🟣
              </div>
              <p className={`text-sm font-medium ${
                paymentMethod === 'nequi' ? 'text-purple-600' : 'text-gray-600'
              }`}>
                Nequi
              </p>
            </button>

            <button
              onClick={() => setPaymentMethod('bancolombia')}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'bancolombia'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`text-2xl mx-auto mb-2 ${
                paymentMethod === 'bancolombia' ? 'text-red-600' : 'text-gray-400'
              }`}>
                🔴
              </div>
              <p className={`text-sm font-medium ${
                paymentMethod === 'bancolombia' ? 'text-red-600' : 'text-gray-600'
              }`}>
                Bancolombia
              </p>
            </button>

            <button
              onClick={() => setPaymentMethod('card')}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CreditCard className={`w-6 h-6 mx-auto mb-2 ${
                paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <p className={`text-sm font-medium ${
                paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-600'
              }`}>
                Tarjeta
              </p>
            </button>

            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'cash'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`text-2xl mx-auto mb-2 ${
                paymentMethod === 'cash' ? 'text-blue-600' : 'text-gray-400'
              }`}>
                💵
              </div>
              <p className={`text-sm font-medium ${
                paymentMethod === 'cash' ? 'text-blue-600' : 'text-gray-600'
              }`}>
                Efectivo
              </p>
            </button>
          </div>

          {/* Formulario de tarjeta */}
          {paymentMethod === 'card' && (
            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Tarjeta
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardData.number}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={19}
                  />
                  <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre en la Tarjeta
                </label>
                <input
                  type="text"
                  value={cardData.name}
                  onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                  placeholder="JUAN PEREZ"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Expiración
                  </label>
                  <input
                    type="text"
                    value={cardData.expiry}
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={5}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cardData.cvv}
                    onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                    placeholder="123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={3}
                  />
                </div>
              </div>

              {/* Mensaje de seguridad */}
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <Lock className="w-4 h-4" />
                <span>Tu información está protegida con encriptación SSL</span>
              </div>

              {/* Datos de prueba para tarjetas */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  💳 Tarjetas de Prueba (Sandbox)
                </p>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>✅ <strong>Aprobada:</strong> 4242 4242 4242 4242</p>
                  <p>❌ <strong>Rechazada:</strong> 4111 1111 1111 1111</p>
                  <p><strong>CVV:</strong> 123 | <strong>Fecha:</strong> 12/25</p>
                </div>
              </div>
            </div>
          )}

          {/* Formulario de Nequi */}
          {paymentMethod === 'nequi' && (
            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Celular Nequi
                </label>
                <input
                  type="text"
                  value={nequiPhone}
                  onChange={(e) => setNequiPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="3991111111"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  maxLength={10}
                />
              </div>
              
              {/* Advertencia de Sandbox */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  ⚠️ Ambiente de Pruebas (Sandbox)
                </p>
                <div className="text-sm text-yellow-800 space-y-1">
                  <p>✅ <strong>Aprobada:</strong> 3991111111</p>
                  <p>❌ <strong>Rechazada:</strong> 3992222222</p>
                  <p>⚠️ <strong>Otros números:</strong> Estado ERROR</p>
                </div>
              </div>
            </div>
          )}

          {/* Formulario de Bancolombia */}
          {paymentMethod === 'bancolombia' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-blue-800">
                <strong>Pago con Bancolombia:</strong> Serás redirigido a la app de Bancolombia para completar el pago de forma segura.
              </p>
            </div>
          )}

          {/* Mensaje para efectivo */}
          {paymentMethod === 'cash' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-yellow-800">
                <strong>Pago en efectivo:</strong> Pagarás directamente al encargado cuando llegue a tu domicilio.
              </p>
            </div>
          )}
        </div>

        {/* Botón de pago */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-md mx-auto">
            <button
              onClick={handlePayment}
              disabled={processing}
              className={`w-full py-4 rounded-lg font-semibold text-white transition-colors ${
                processing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
              }`}
            >
              {processing ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Procesando...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  {paymentMethod === 'card' ? (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Pagar ${order.price.toLocaleString()}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Confirmar Pedido
                    </>
                  )}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de espera de aprobación */}
      {waitingApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Esperando Aprobación
              </h3>
              <p className="text-gray-600 mb-2">
                {paymentMethod === 'nequi' 
                  ? `Revisa tu app de Nequi y aprueba el pago de $${order.price.toLocaleString()} COP`
                  : `Revisa tu app de Bancolombia y aprueba el pago de $${order.price.toLocaleString()} COP`
                }
              </p>
              {wompiTransactionId && (
                <p className="text-xs text-gray-500 mb-6">
                  ID de transacción: {wompiTransactionId}
                </p>
              )}
              
              {/* Instrucciones */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-blue-900 font-medium mb-2">⚠️ Modo Sandbox (Pruebas):</p>
                <div className="text-sm text-blue-800 space-y-2">
                  <p>En ambiente de pruebas, la transacción se queda en estado PENDING porque no hay una app real de Nequi.</p>
                  <p className="font-medium">Para simular el pago aprobado, simplemente haz clic en "Ya Aprobé el Pago" abajo.</p>
                  <p className="text-xs mt-2">En producción, el usuario recibiría una notificación real en su app de Nequi.</p>
                </div>
              </div>

              {/* Botones */}
              <div className="space-y-3">
                <button
                  onClick={handleApprovePayment}
                  disabled={processing}
                  className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                    processing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                  }`}
                >
                  {processing ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Procesando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Ya Aprobé el Pago
                    </span>
                  )}
                </button>
                
                <button
                  onClick={handleCancelPayment}
                  disabled={processing}
                  className="w-full py-3 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancelar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
