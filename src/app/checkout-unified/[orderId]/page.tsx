'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CreditCard, Smartphone, Building2, DollarSign, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import CardPaymentComponent from '@/components/CardPaymentComponent';
import WompiWidgetComponent from '@/components/WompiWidgetComponent';
import CheckoutWebComponent from '@/components/CheckoutWebComponent';

type PaymentMethod = 'card' | 'widget' | 'checkout-web' | 'nequi' | 'bancolombia' | 'pse' | 'cash';

interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  component?: React.ComponentType<any>;
}

const paymentMethods: PaymentMethodConfig[] = [
  {
    id: 'card',
    name: 'Tarjeta de Crédito/Débito',
    icon: CreditCard,
    description: 'Pago directo con tokenización',
    color: 'from-blue-500 to-blue-600',
    component: CardPaymentComponent
  },
  {
    id: 'widget',
    name: 'Widget Wompi',
    icon: Smartphone,
    description: 'Pago embebido sin salir de la página',
    color: 'from-purple-500 to-purple-600',
    component: WompiWidgetComponent
  },
  {
    id: 'checkout-web',
    name: 'Checkout Web',
    icon: Globe,
    description: 'Experiencia completa en Wompi',
    color: 'from-green-500 to-green-600',
    component: CheckoutWebComponent
  },
  {
    id: 'cash',
    name: 'Efectivo',
    icon: DollarSign,
    description: 'Pago al recibir el servicio',
    color: 'from-gray-500 to-gray-600'
  }
];

export default function UnifiedCheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('widget');
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      // Simular carga de orden - en producción sería una llamada al API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockOrder = {
        id: orderId,
        service: 'Limpieza del hogar',
        date: '2025-01-01',
        time: '10:00 AM',
        price: 50000,
        currency: 'COP',
        customer: {
          email: 'cliente@example.com',
          name: 'Juan Pérez'
        },
        encargado: { name: 'Miguel Paredes' }
      };
      
      setOrder(mockOrder);
    } catch (error) {
      setError('Error cargando información del pedido');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (transactionId: string) => {
    console.log('✅ Pago exitoso:', transactionId);
    router.push(`/payment-success/${orderId}?transaction=${transactionId}&method=${selectedMethod}`);
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ Error en pago:', error);
    setError(error);
  };

  const handleCashPayment = () => {
    // Para pago en efectivo, simplemente confirmamos el pedido
    handlePaymentSuccess('cash-' + Date.now());
  };

  const renderPaymentComponent = () => {
    if (!order) return null;

    const selectedConfig = paymentMethods.find(m => m.id === selectedMethod);
    const PaymentComponent = selectedConfig?.component;

    const commonProps = {
      amount: order.price,
      currency: order.currency,
      customerEmail: order.customer.email,
      customerName: order.customer.name,
      reference: `ORDER-${orderId}`,
      redirectUrl: `${window.location.origin}/payment-success/${orderId}`,
      onPaymentSuccess: handlePaymentSuccess,
      onPaymentError: handlePaymentError
    };

    if (selectedMethod === 'cash') {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <DollarSign className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Pago en Efectivo</h3>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-green-900 mb-2">💵 Pago al Recibir</h4>
            <div className="text-sm text-green-800 space-y-1">
              <p>• Pagarás directamente al encargado</p>
              <p>• Ten el monto exacto preparado</p>
              <p>• Recibirás comprobante del servicio</p>
              <p>• Sin comisiones adicionales</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">Monto a Pagar</h4>
            <p className="text-2xl font-bold text-green-600">
              ${order.price.toLocaleString('es-CO')} {order.currency}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Pago directo al encargado: {order.encargado.name}
            </p>
          </div>

          <button
            onClick={handleCashPayment}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <span className="flex items-center justify-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirmar Pago en Efectivo
            </span>
          </button>
        </div>
      );
    }

    if (PaymentComponent) {
      return <PaymentComponent {...commonProps} />;
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500 text-center">Método de pago no disponible</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del pedido...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadOrder}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="ml-3 text-xl font-semibold text-gray-900">Checkout Unificado</h1>
        </div>

        <div className="p-6">
          {/* Información del pedido */}
          {order && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h2 className="font-semibold text-blue-900 mb-2">Resumen del Pedido</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <p><strong>Servicio:</strong> {order.service}</p>
                  <p><strong>Encargado:</strong> {order.encargado.name}</p>
                  <p><strong>Cliente:</strong> {order.customer.name}</p>
                </div>
                <div>
                  <p><strong>Fecha:</strong> {order.date}</p>
                  <p><strong>Hora:</strong> {order.time}</p>
                  <p><strong>Total:</strong> ${order.price.toLocaleString('es-CO')} {order.currency}</p>
                </div>
              </div>
            </div>
          )}

          {/* Información de arquitectura */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-purple-900 mb-2">🚀 Nueva Arquitectura Enterprise</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800">
              <div>
                <p>✅ Tokenización de tarjetas</p>
                <p>✅ Widget embebido de Wompi</p>
                <p>✅ Checkout Web optimizado</p>
              </div>
              <div>
                <p>✅ Firma de integridad SHA256</p>
                <p>✅ Tokens de aceptación</p>
                <p>✅ Todos los métodos de pago</p>
              </div>
            </div>
          </div>

          {/* Error de pago */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
                <div>
                  <h3 className="font-semibold text-red-900">Error en el Pago</h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Selector de método de pago */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Método de Pago</h2>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedMethod === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="w-6 h-6 mr-3 text-gray-600" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{method.name}</h3>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                        {selectedMethod === method.id && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Componente de pago */}
            <div className="lg:col-span-2">
              {renderPaymentComponent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
