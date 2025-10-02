'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CreditCard, Smartphone, Building2, DollarSign, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient, Order } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
// import { usePayment } from '@/hooks/usePayment'; // Comentado temporalmente
import { UnifiedPaymentData } from '@/services/unified-payment-service';
import { PaymentMethod } from '@/services/payment-state-manager';
import { wompiService } from '@/services/wompi';

// Componentes de iconos optimizados
const NequiIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="nequiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF1493" />
        <stop offset="50%" stopColor="#662D91" />
        <stop offset="100%" stopColor="#00CED1" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="20" fill="url(#nequiGradient)"/>
    <path d="M50 15 L75 35 L75 65 L50 85 L25 65 L25 35 Z" fill="white" fillOpacity="0.9"/>
    <path d="M50 25 L65 35 L65 55 L50 65 L35 55 L35 35 Z" fill="#662D91"/>
    <text x="50" y="75" textAnchor="middle" className="text-xs font-bold" fill="white">NEQUI</text>
  </svg>
);

const BancolombiaIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="12" fill="#FFDD00"/>
    <rect x="10" y="20" width="80" height="8" fill="#005EB8"/>
    <rect x="10" y="32" width="80" height="8" fill="#E31E24"/>
    <rect x="10" y="44" width="80" height="8" fill="#005EB8"/>
    <circle cx="50" cy="65" r="12" fill="#005EB8"/>
    <circle cx="50" cy="65" r="8" fill="white"/>
    <circle cx="50" cy="65" r="4" fill="#005EB8"/>
    <text x="50" y="88" textAnchor="middle" className="text-xs font-bold" fill="#005EB8">BANCOLOMBIA</text>
  </svg>
);

const PSEIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#003f7f"/>
    <circle cx="50" cy="50" r="42" fill="#0066cc"/>
    <g transform="translate(18, 35)">
      <path d="M0 0h12c4 0 7 2 7 6s-3 6-7 6H4v8h-4V0zm4 8h8c1 0 2-1 2-2s-1-2-2-2H4v4z" fill="white"/>
      <path d="M22 0h12c3 0 5 2 5 4c0 1-1 2-2 3c1 1 2 2 2 4c0 3-2 5-5 5H22c-3 0-5-2-5-5h4c0 1 1 1 1 1h8c1 0 1-1 1-1s0-1-1-1h-8c-3 0-5-2-5-5s2-5 5-5zm0 4c-1 0-1 1-1 1s0 1 1 1h8c1 0 1-1 1-1s0-1-1-1h-8z" fill="white"/>
      <path d="M44 0h16v4h-12v4h10v4h-10v4h12v4H44V0z" fill="white"/>
    </g>
    <text x="50" y="75" textAnchor="middle" className="text-xs" fill="white">ACH</text>
  </svg>
);

const CashIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="25" width="90" height="50" rx="6" fill="#059669"/>
    <rect x="8" y="28" width="84" height="44" rx="4" fill="#10B981"/>
    <circle cx="50" cy="50" r="15" fill="white"/>
    <text x="50" y="58" textAnchor="middle" className="text-lg font-bold" fill="#059669">$</text>
    <rect x="82" y="32" width="6" height="36" rx="3" fill="#047857"/>
    <circle cx="20" cy="40" r="2" fill="#047857"/>
    <circle cx="80" cy="60" r="2" fill="#047857"/>
  </svg>
);

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

export default function UnifiedCheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const orderId = params.orderId as string;
  
  // Estados principales
  const [order, setOrder] = useState<Order | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('nequi');
  
  // Datos específicos por método
  const [nequiPhone, setNequiPhone] = useState('');
  const [pseBank, setPseBank] = useState('');
  const [pseUserType, setPseUserType] = useState<'NATURAL' | 'JURIDICA'>('NATURAL');
  const [pseDocType, setPseDocType] = useState<'CC' | 'NIT'>('CC');
  const [pseDocNumber, setPseDocNumber] = useState('');
  const [pseBanks, setPseBanks] = useState<Array<{ financial_institution_code: string; financial_institution_name: string }>>([]);

  // Hook de pago unificado
  const {
    paymentState,
    isProcessing,
    error,
    processPayment,
    clearError,
    canRetry,
    isCompleted
  } = usePayment({
    orderId,
    autoMonitor: true,
    onStateChange: (state) => {
      console.log('Payment state changed:', state);
      if (state.status === 'CONFIRMED') {
        showSuccess('¡Pago Confirmado!', 'Tu pago ha sido procesado exitosamente');
        router.push(`/payment-success/${orderId}?method=${state.method}`);
      }
    }
  });

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar pedido existente o datos de booking
        try {
          const orderData = await apiClient.getOrderById(orderId);
          setOrder(orderData);
        } catch {
          // Si no existe el pedido, buscar en localStorage
          const pendingBooking = localStorage.getItem('pendingBooking');
          if (pendingBooking) {
            setBookingData(JSON.parse(pendingBooking));
          } else {
            showError('Error', 'No se encontró información del pedido');
            router.push('/home');
            return;
          }
        }

        // Cargar bancos PSE
        const banks = await wompiService.getPSEBanks();
        setPseBanks(banks);
      } catch (error) {
        console.error('Error loading data:', error);
        showError('Error', 'No se pudo cargar la información necesaria');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orderId, router, showError]);

  // Manejar el procesamiento del pago
  const handlePayment = async () => {
    if (!user) {
      showError('Error', 'Debes estar autenticado para realizar el pago');
      return;
    }

    clearError();

    // Validaciones específicas por método
    if (selectedMethod === 'nequi' && !nequiPhone) {
      showError('Error', 'Ingresa tu número de celular Nequi');
      return;
    }

    if (selectedMethod === 'pse') {
      if (!pseBank || !pseDocNumber) {
        showError('Error', 'Completa todos los campos para PSE');
        return;
      }
    }

    const currentData = order || bookingData;
    if (!currentData) {
      showError('Error', 'No hay datos del pedido');
      return;
    }

    try {
      // Preparar datos unificados
      const paymentData: UnifiedPaymentData = {
        orderId: orderId,
        amount: Math.round(currentData.price * 100), // Convertir a centavos
        currency: 'COP',
        customerEmail: user.email,
        customerName: user.name,
        method: selectedMethod
      };

      // Agregar datos específicos según el método
      if (selectedMethod === 'nequi') {
        paymentData.nequi = { phoneNumber: nequiPhone };
      } else if (selectedMethod === 'pse') {
        const selectedBank = pseBanks.find(b => b.financial_institution_name === pseBank);
        if (!selectedBank) {
          showError('Error', 'Banco no encontrado');
          return;
        }
        paymentData.pse = {
          userType: pseUserType,
          userLegalIdType: pseDocType,
          userLegalId: pseDocNumber,
          financialInstitutionCode: selectedBank.financial_institution_code
        };
      }

      // Si es booking pendiente, crear el pedido primero
      if (bookingData) {
        const newOrder = await apiClient.createOrder({
          encargadoId: bookingData.encargadoId,
          categoryId: bookingData.categoryId,
          service: bookingData.service,
          description: bookingData.description,
          address: bookingData.address,
          date: bookingData.date,
          time: bookingData.time,
          price: bookingData.price,
          paymentMethod: selectedMethod === 'cash' ? 'cash' : 'card'
        });
        
        paymentData.orderId = newOrder.id;
        localStorage.removeItem('pendingBooking');
      }

      // Procesar el pago
      const result = await processPayment(paymentData);

      if (result.success) {
        if (result.requiresRedirect && result.redirectUrl) {
          // Redirección para Bancolombia/PSE
          window.location.href = result.redirectUrl;
        } else if (selectedMethod === 'cash') {
          // Pago en efectivo
          showSuccess('¡Pedido Confirmado!', 'Pagarás en efectivo al recibir el servicio');
          router.push(`/payment-success/${paymentData.orderId}?method=cash`);
        } else {
          // Nequi - mostrar instrucciones
          showSuccess('Pago Iniciado', 'Revisa tu app de Nequi para aprobar el pago');
          router.push(`/payment-pending/${paymentData.orderId}?transactionId=${result.transactionId}`);
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      showError('Error', 'No se pudo procesar el pago. Intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del pago...</p>
        </div>
      </div>
    );
  }

  const currentData = order || bookingData;
  if (!currentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">No se encontró información del pedido</p>
        </div>
      </div>
    );
  }

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
              <p><strong>Servicio:</strong> {currentData.service}</p>
              <p><strong>Fecha:</strong> {currentData.date}</p>
              <p><strong>Hora:</strong> {currentData.time}</p>
              <p><strong>Total:</strong> ${currentData.price.toLocaleString('es-CO')} COP</p>
            </div>
          </div>

          {/* Estado del pago */}
          {paymentState && (
            <div className={`p-4 rounded-lg border ${
              paymentState.status === 'ERROR' ? 'bg-red-50 border-red-200' :
              paymentState.status === 'CONFIRMED' ? 'bg-green-50 border-green-200' :
              'bg-yellow-50 border-yellow-200'
            }`}>
              <h3 className="font-semibold mb-2">Estado del Pago</h3>
              <p className="text-sm">
                Estado: <span className="font-medium">{paymentState.status}</span>
              </p>
              {paymentState.transactionId && (
                <p className="text-xs text-gray-600 mt-1">
                  ID: {paymentState.transactionId.slice(-12)}
                </p>
              )}
            </div>
          )}

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
                placeholder="3001234567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {selectedMethod === 'pse' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Banco</label>
                <select
                  value={pseBank}
                  onChange={(e) => setPseBank(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona tu banco</option>
                  {pseBanks.map((bank) => (
                    <option key={bank.financial_institution_code} value={bank.financial_institution_name}>
                      {bank.financial_institution_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de usuario</label>
                  <select
                    value={pseUserType}
                    onChange={(e) => setPseUserType(e.target.value as 'NATURAL' | 'JURIDICA')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="NATURAL">Persona Natural</option>
                    <option value="JURIDICA">Persona Jurídica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de documento</label>
                  <select
                    value={pseDocType}
                    onChange={(e) => setPseDocType(e.target.value as 'CC' | 'NIT')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="NIT">NIT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de documento</label>
                <input
                  type="text"
                  value={pseDocNumber}
                  onChange={(e) => setPseDocNumber(e.target.value)}
                  placeholder="12345678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Botón de pago */}
          <button
            onClick={handlePayment}
            disabled={isProcessing || isCompleted}
            className={`w-full py-4 rounded-lg font-semibold text-white transition-colors ${
              selectedMethod === 'cash'
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                    Pagar ${currentData.price.toLocaleString('es-CO')} COP
                  </>
                )}
              </span>
            )}
          </button>

          {/* Botón de reintentar si hay error */}
          {canRetry && (
            <button
              onClick={() => {
                clearError();
                handlePayment();
              }}
              className="w-full py-3 rounded-lg font-semibold text-blue-600 border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Reintentar Pago
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
