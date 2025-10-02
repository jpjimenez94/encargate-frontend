'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Smartphone, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

interface WompiWidgetComponentProps {
  amount: number;
  currency: string;
  customerEmail: string;
  customerName?: string;
  reference?: string;
  redirectUrl?: string;
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentError: (error: string) => void;
}

declare global {
  interface Window {
    WidgetCheckout: any;
  }
}

export default function WompiWidgetComponent({
  amount,
  currency,
  customerEmail,
  customerName,
  reference,
  redirectUrl,
  onPaymentSuccess,
  onPaymentError
}: WompiWidgetComponentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [widgetConfig, setWidgetConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    loadWidgetConfig();
  }, [amount, currency, customerEmail]);

  const loadWidgetConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/wompi/widget/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount_in_cents: amount * 100,
          currency: currency,
          customer_email: customerEmail,
          reference: reference,
          redirect_url: redirectUrl
        }),
      });

      if (!response.ok) {
        throw new Error('Error generando configuración del widget');
      }

      const data = await response.json();
      setWidgetConfig(data.data);
      
      // Cargar script de Wompi después de obtener la configuración
      loadWompiScript();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error cargando widget';
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWompiScript = () => {
    // Verificar si el script ya está cargado
    if (document.querySelector('script[src="https://checkout.wompi.co/widget.js"]')) {
      initializeWidget();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.type = 'text/javascript';
    script.onload = () => {
      initializeWidget();
    };
    script.onerror = () => {
      setError('Error cargando el widget de Wompi');
      onPaymentError('Error cargando el widget de Wompi');
    };

    document.head.appendChild(script);
  };

  const initializeWidget = () => {
    if (!widgetConfig || !window.WidgetCheckout) {
      return;
    }

    try {
      widgetRef.current = new window.WidgetCheckout(widgetConfig);
    } catch (error) {
      console.error('Error inicializando widget:', error);
      setError('Error inicializando el widget de pago');
      onPaymentError('Error inicializando el widget de pago');
    }
  };

  const openWidget = () => {
    if (!widgetRef.current) {
      setError('Widget no está listo');
      return;
    }

    widgetRef.current.open((result: any) => {
      if (result.transaction) {
        const transaction = result.transaction;
        console.log('Transacción completada:', transaction);
        
        if (transaction.status === 'APPROVED') {
          onPaymentSuccess(transaction.id);
        } else if (transaction.status === 'DECLINED') {
          onPaymentError(`Pago rechazado: ${transaction.status_message || 'Transacción declinada'}`);
        } else if (transaction.status === 'ERROR') {
          onPaymentError(`Error en el pago: ${transaction.status_message || 'Error procesando la transacción'}`);
        } else {
          // Para estados PENDING, podríamos redirigir a una página de seguimiento
          console.log('Transacción pendiente:', transaction);
          onPaymentSuccess(transaction.id);
        }
      } else {
        onPaymentError('No se recibió información de la transacción');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mr-3"></div>
          <span className="text-gray-600">Cargando widget de pago...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle className="w-6 h-6 mr-2" />
          <h3 className="text-lg font-semibold">Error</h3>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadWidgetConfig}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <Smartphone className="w-6 h-6 text-purple-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Widget Wompi</h3>
      </div>

      {/* Información del widget */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-purple-900 mb-2">💜 Pago Embebido</h4>
        <div className="text-sm text-purple-800 space-y-1">
          <p>• Pago sin salir de la página</p>
          <p>• Todos los métodos disponibles (Nequi, PSE, Bancolombia, Tarjetas)</p>
          <p>• Experiencia optimizada de Wompi</p>
          <p>• Seguridad garantizada</p>
        </div>
      </div>

      {/* Resumen del pago */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-900 mb-2">Resumen del Pago</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Monto:</span>
            <span className="font-medium">${amount.toLocaleString('es-CO')} {currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{customerEmail}</span>
          </div>
          {customerName && (
            <div className="flex justify-between">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-medium">{customerName}</span>
            </div>
          )}
          {reference && (
            <div className="flex justify-between">
              <span className="text-gray-600">Referencia:</span>
              <span className="font-medium">{reference}</span>
            </div>
          )}
        </div>
      </div>

      {/* Botón para abrir widget */}
      <button
        onClick={openWidget}
        disabled={!widgetRef.current}
        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
      >
        <span className="flex items-center justify-center">
          <Smartphone className="w-5 h-5 mr-2" />
          Abrir Widget de Pago
        </span>
      </button>

      {/* Información adicional */}
      <div className="mt-4 text-center">
        <div className="flex items-center justify-center text-sm text-gray-500">
          <CheckCircle className="w-4 h-4 mr-1" />
          <span>Powered by Wompi - Pagos seguros</span>
        </div>
      </div>

      {/* Métodos de pago disponibles */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 text-center mb-2">Métodos de pago disponibles:</p>
        <div className="flex justify-center space-x-4 text-xs text-gray-500">
          <span>💜 Nequi</span>
          <span>🏦 Bancolombia</span>
          <span>🏛️ PSE</span>
          <span>💳 Tarjetas</span>
        </div>
      </div>
    </div>
  );
}
