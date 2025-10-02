'use client';

import React, { useState } from 'react';
import { CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';

interface CardData {
  number: string;
  card_holder: string;
  exp_month: string;
  exp_year: string;
  cvc: string;
}

interface CardPaymentComponentProps {
  amount: number;
  currency: string;
  customerEmail: string;
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentError: (error: string) => void;
}

export default function CardPaymentComponent({
  amount,
  currency,
  customerEmail,
  onPaymentSuccess,
  onPaymentError
}: CardPaymentComponentProps) {
  const [cardData, setCardData] = useState<CardData>({
    number: '4242424242424242', // Número de prueba
    card_holder: 'JUAN PEREZ',
    exp_month: '12',
    exp_year: '25',
    cvc: '123'
  });
  
  const [installments, setInstallments] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Partial<CardData>>({});

  // Validaciones
  const validateCardNumber = (number: string): boolean => {
    const cleaned = number.replace(/\s/g, '');
    return /^\d{13,19}$/.test(cleaned);
  };

  const validateCVC = (cvc: string): boolean => {
    return /^\d{3,4}$/.test(cvc);
  };

  const validateExpiry = (month: string, year: string): boolean => {
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    const expMonth = parseInt(month);
    const expYear = parseInt(year);
    
    if (expMonth < 1 || expMonth > 12) return false;
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;
    
    return true;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CardData> = {};

    if (!validateCardNumber(cardData.number)) {
      newErrors.number = 'Número de tarjeta inválido';
    }

    if (!cardData.card_holder || cardData.card_holder.length < 5) {
      newErrors.card_holder = 'Nombre del titular requerido (mínimo 5 caracteres)';
    }

    if (!validateExpiry(cardData.exp_month, cardData.exp_year)) {
      newErrors.exp_month = 'Fecha de expiración inválida';
    }

    if (!validateCVC(cardData.cvc)) {
      newErrors.cvc = 'CVC inválido (3-4 dígitos)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCardNumber = (value: string): string => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardData(prev => ({ ...prev, number: formatted }));
    if (errors.number) {
      setErrors(prev => ({ ...prev, number: undefined }));
    }
  };

  const handleInputChange = (field: keyof CardData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const tokenizeCard = async (): Promise<string> => {
    const response = await fetch('/api/wompi/tokenize/card', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: cardData.number.replace(/\s/g, ''),
        cvc: cardData.cvc,
        exp_month: cardData.exp_month.padStart(2, '0'),
        exp_year: cardData.exp_year,
        card_holder: cardData.card_holder
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error tokenizando tarjeta');
    }

    const data = await response.json();
    return data.data.id;
  };

  const getAcceptanceTokens = async () => {
    const response = await fetch('/api/wompi/acceptance-tokens');
    if (!response.ok) {
      throw new Error('Error obteniendo tokens de aceptación');
    }
    const data = await response.json();
    return data.data;
  };

  const createCardTransaction = async (token: string, acceptanceTokens: any): Promise<string> => {
    const response = await fetch('/api/wompi/create-card-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount_in_cents: amount * 100,
        currency: currency,
        customer_email: customerEmail,
        token: token,
        installments: installments,
        acceptance_token: acceptanceTokens.acceptance_token,
        accept_personal_auth: acceptanceTokens.accept_personal_auth
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error creando transacción');
    }

    const data = await response.json();
    return data.data.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Tokenizar tarjeta
      const token = await tokenizeCard();
      
      // 2. Obtener tokens de aceptación
      const acceptanceTokens = await getAcceptanceTokens();
      
      // 3. Crear transacción
      const transactionId = await createCardTransaction(token, acceptanceTokens);
      
      onPaymentSuccess(transactionId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error procesando pago';
      onPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center mb-4">
        <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Pago con Tarjeta</h3>
      </div>

      {/* Información de prueba */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <h4 className="font-semibold text-blue-900 mb-2">🧪 Datos de Prueba</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>✅ Aprobada:</strong> 4242 4242 4242 4242</p>
          <p><strong>❌ Rechazada:</strong> 4111 1111 1111 1111</p>
          <p><strong>CVC:</strong> Cualquier 3 dígitos</p>
          <p><strong>Fecha:</strong> Cualquier fecha futura</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Número de tarjeta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de tarjeta
          </label>
          <input
            type="text"
            value={cardData.number}
            onChange={handleCardNumberChange}
            placeholder="4242 4242 4242 4242"
            maxLength={19}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.number ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.number && (
            <p className="text-red-500 text-sm mt-1">{errors.number}</p>
          )}
        </div>

        {/* Nombre del titular */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del titular
          </label>
          <input
            type="text"
            value={cardData.card_holder}
            onChange={handleInputChange('card_holder')}
            placeholder="JUAN PEREZ"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.card_holder ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.card_holder && (
            <p className="text-red-500 text-sm mt-1">{errors.card_holder}</p>
          )}
        </div>

        {/* Fecha de expiración y CVC */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mes
            </label>
            <select
              value={cardData.exp_month}
              onChange={(e) => setCardData(prev => ({ ...prev, exp_month: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.exp_month ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month.toString().padStart(2, '0')}>
                  {month.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Año
            </label>
            <select
              value={cardData.exp_year}
              onChange={(e) => setCardData(prev => ({ ...prev, exp_year: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.exp_month ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() + i;
                return (
                  <option key={year} value={(year % 100).toString().padStart(2, '0')}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CVC
            </label>
            <input
              type="text"
              value={cardData.cvc}
              onChange={handleInputChange('cvc')}
              placeholder="123"
              maxLength={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.cvc ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
        </div>

        {(errors.exp_month || errors.cvc) && (
          <div className="text-red-500 text-sm">
            {errors.exp_month && <p>{errors.exp_month}</p>}
            {errors.cvc && <p>{errors.cvc}</p>}
          </div>
        )}

        {/* Cuotas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de cuotas
          </label>
          <select
            value={installments}
            onChange={(e) => setInstallments(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1}>1 cuota (sin intereses)</option>
            <option value={3}>3 cuotas</option>
            <option value={6}>6 cuotas</option>
            <option value={12}>12 cuotas</option>
          </select>
        </div>

        {/* Información de seguridad */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center text-sm text-gray-600">
            <Lock className="w-4 h-4 mr-2" />
            <span>Tu información está protegida con encriptación SSL</span>
          </div>
        </div>

        {/* Botón de pago */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              Procesando pago...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Pagar ${amount.toLocaleString('es-CO')} {currency}
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
