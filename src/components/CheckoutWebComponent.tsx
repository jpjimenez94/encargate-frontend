'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Globe, Shield, CreditCard } from 'lucide-react';

interface CheckoutWebComponentProps {
  amount: number;
  currency: string;
  customerEmail: string;
  customerName?: string;
  reference?: string;
  redirectUrl?: string;
  onRedirect?: () => void;
}

export default function CheckoutWebComponent({
  amount,
  currency,
  customerEmail,
  customerName,
  reference,
  redirectUrl,
  onRedirect
}: CheckoutWebComponentProps) {
  const [formHTML, setFormHTML] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateCheckoutForm();
  }, [amount, currency, customerEmail]);

  const generateCheckoutForm = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/wompi/checkout-web/form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount_in_cents: amount * 100,
          currency: currency,
          customer_email: customerEmail,
          customer_name: customerName,
          reference: reference,
          redirect_url: redirectUrl
        }),
      });

      if (!response.ok) {
        throw new Error('Error generando formulario de checkout');
      }

      const data = await response.json();
      setFormHTML(data.data.html);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error cargando checkout';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckoutRedirect = () => {
    if (onRedirect) {
      onRedirect();
    }
    
    // El formulario se enviará automáticamente
    const form = document.querySelector('#wompi-checkout-form') as HTMLFormElement;
    if (form) {
      form.submit();
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mr-3"></div>
          <span className="text-gray-600">Preparando checkout...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="flex items-center text-red-600 mb-4">
          <ExternalLink className="w-6 h-6 mr-2" />
          <h3 className="text-lg font-semibold">Error</h3>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={generateCheckoutForm}
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
        <Globe className="w-6 h-6 text-green-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Checkout Web Wompi</h3>
      </div>

      {/* Información del checkout web */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-green-900 mb-2">🌐 Checkout Optimizado</h4>
        <div className="text-sm text-green-800 space-y-1">
          <p>• Experiencia completa de pago en Wompi</p>
          <p>• Interfaz optimizada y responsive</p>
          <p>• Todos los métodos de pago disponibles</p>
          <p>• Máxima seguridad y confiabilidad</p>
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

      {/* Formulario oculto generado dinámicamente */}
      <div 
        id="wompi-checkout-form-container"
        style={{ display: 'none' }}
        dangerouslySetInnerHTML={{ __html: formHTML }}
      />

      {/* Botón para ir al checkout */}
      <button
        onClick={handleCheckoutRedirect}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
      >
        <span className="flex items-center justify-center">
          <ExternalLink className="w-5 h-5 mr-2" />
          Ir a Checkout Wompi
        </span>
      </button>

      {/* Información de seguridad */}
      <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
        <Shield className="w-4 h-4 mr-1" />
        <span>Serás redirigido a checkout.wompi.co</span>
      </div>

      {/* Métodos de pago disponibles */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 text-center mb-2">Métodos de pago disponibles:</p>
        <div className="flex justify-center space-x-4 text-xs text-gray-500">
          <span>💜 Nequi</span>
          <span>🏦 Bancolombia</span>
          <span>🏛️ PSE</span>
          <span>💳 Tarjetas</span>
          <span>💵 Efectivo</span>
        </div>
      </div>

      {/* Ventajas del checkout web */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <CreditCard className="w-4 h-4 mr-2 text-green-500" />
          <span>Experiencia de pago optimizada</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Shield className="w-4 h-4 mr-2 text-green-500" />
          <span>Certificación PCI DSS</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Globe className="w-4 h-4 mr-2 text-green-500" />
          <span>Interfaz responsive y moderna</span>
        </div>
      </div>
    </div>
  );
}
