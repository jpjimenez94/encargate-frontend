'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CreditCard, Smartphone, Building2, DollarSign, Lock, CheckCircle } from 'lucide-react';
import { apiClient, Order } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { usePayment } from '@/hooks/usePayment';
import { wompiService } from '@/services/wompi';
import { pricingService, PricingBreakdown } from '@/services/pricing';

// Types
type PaymentMethodType = 'nequi' | 'bancolombia' | 'pse' | 'card' | 'cash';

// Icon Components - Logos reales de las marcas
const NequiIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center`}>
    <img 
      src="/payment-logos/nequi.png" 
      alt="Nequi" 
      className="w-full h-full object-contain"
    />
  </div>
);

const BancolombiaIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center`}>
    <img 
      src="/payment-logos/bancolombia.svg" 
      alt="Bancolombia" 
      className="w-full h-full object-contain"
    />
  </div>
);

const PSEIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center`}>
    <img 
      src="/payment-logos/pse.svg" 
      alt="PSE" 
      className="w-full h-full object-contain"
    />
  </div>
);

const CashIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <div className={`${className} bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md`}>
    <svg viewBox="0 0 40 40" fill="white" className="w-6 h-6">
      <rect x="4" y="12" width="32" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="20" cy="20" r="5" fill="currentColor"/>
      <text x="20" y="23" fontSize="6" fill="white" textAnchor="middle" fontWeight="bold">$</text>
      <circle cx="8" cy="16" r="1" fill="currentColor"/>
      <circle cx="32" cy="24" r="1" fill="currentColor"/>
    </svg>
  </div>
);

// Main Component
export default function CheckoutCoPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('nequi');
  const orderId = resolvedParams.orderId;

  // Datos específicos por método
  const [nequiPhone, setNequiPhone] = useState('');
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
  const [pseBanks, setPseBanks] = useState<Array<{ financial_institution_code: string; financial_institution_name: string }>>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [acceptanceToken, setAcceptanceToken] = useState<{ acceptance_token: string; permalink: string } | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [pricingBreakdown, setPricingBreakdown] = useState<PricingBreakdown | null>(null);
  
  // Cargar bancos PSE cuando se selecciona PSE
  useEffect(() => {
    if (paymentMethod === 'pse' && pseBanks.length === 0) {
      const loadBanks = async () => {
        try {
          setLoadingBanks(true);
          console.log('🏦 Cargando bancos PSE desde API...');
          const banks = await wompiService.getPSEBanks();
          console.log('🏦 Bancos cargados:', banks);
          setPseBanks(banks);
        } catch (error) {
          console.error('❌ Error cargando bancos PSE:', error);
          showError('Error', 'No se pudieron cargar los bancos PSE');
        } finally {
          setLoadingBanks(false);
        }
      };
      loadBanks();
    }
  }, [paymentMethod]);

    // Cargar token de aceptación para todos los métodos de pago de Wompi (excepto efectivo)
    useEffect(() => {
      const wompiMethods: PaymentMethodType[] = ['nequi', 'bancolombia', 'pse', 'card'];
      if (wompiMethods.includes(paymentMethod) && !acceptanceToken) {
        wompiService.getAcceptanceToken().then(token => {
          console.log('✅ Token de aceptación obtenido:', token);
          setAcceptanceToken(token);
        }).catch(error => {
          console.error('❌ Error obteniendo token de aceptación:', error);
        });
      }
    }, [paymentMethod, acceptanceToken]);

  useEffect(() => {
    const loadData = async () => {
      console.log('🔍 Checkout: Verificando usuario:', user);
      console.log('🔍 Checkout: Rol del usuario:', user?.role);
      
      if (!user || user.role !== 'CLIENTE') {
        console.log('❌ Checkout: Usuario no válido, redirigiendo a login');
        router.push('/login');
        return;
      }
      
      console.log('✅ Checkout: Usuario válido, continuando...');

      try {
        setLoading(true);
        
        // Si es "pending", cargar datos de localStorage
        if (orderId === 'pending') {
          const savedBooking = localStorage.getItem('pendingBooking');
          if (savedBooking) {
            const data = JSON.parse(savedBooking);
            setBookingData(data);
          } else {
            showError('Error', 'No se encontraron datos de reserva');
            router.push('/home');
          }
        } else {
          // Si hay orderId, cargar pedido existente
          const orderData = await apiClient.getOrderById(orderId);
          
          // VALIDACIÓN: Solo permitir pago si el pedido fue aceptado por el proveedor
          if (orderData.status !== 'ACCEPTED' && orderData.status !== 'IN_PROGRESS') {
            showError(
              'Pedido No Aceptado',
              'El proveedor debe aceptar tu pedido antes de que puedas realizar el pago. Te notificaremos cuando esto suceda.'
            );
            router.push(`/order/${orderId}`);
            return;
          }
          
          // VALIDACIÓN: No permitir pago si ya fue pagado
          if (orderData.paymentStatus === 'PAID') {
            showError('Ya Pagado', 'Este pedido ya ha sido pagado.');
            router.push(`/order/${orderId}`);
            return;
          }
          
          setOrder(orderData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        showError('Error', 'No se pudo cargar la información');
        router.push('/home');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadData();
    }
  }, [orderId, user, router]);

  // Calcular desglose de precios cuando se carga el pedido o método de pago cambia
  useEffect(() => {
    const currentData = order || bookingData;
    if (currentData && paymentMethod !== 'cash') {
      // Calcular desglose de precios con estrategia mixta
      const breakdown = pricingService.calculatePricingLocal(currentData.price);
      setPricingBreakdown(breakdown);
      console.log('💰 Desglose de precios calculado:', breakdown);
    } else {
      setPricingBreakdown(null);
    }
  }, [order, bookingData, paymentMethod]);

  const handlePayment = async () => {
    if ((!order && !bookingData) || !user) return;
    
    const currentData = order || bookingData;

    // Validaciones según método de pago
    if (paymentMethod === 'nequi') {
      if (!nequiPhone || nequiPhone.length !== 10) {
        showError('Error', 'Por favor ingresa un número de celular válido');
        return;
      }
    }

    if (paymentMethod === 'pse') {
      if (!pseBank || !pseDocNumber) {
        showError('Error', 'Por favor completa todos los campos de PSE');
        return;
      }
    }

    if (paymentMethod === 'card') {
      if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
        showError('Error', 'Por favor completa todos los campos de la tarjeta');
        return;
      }
      
      const numberClean = cardData.number.replace(/\s/g, '');
      if (numberClean.length !== 16) {
        showError('Error', 'Número de tarjeta inválido (debe tener 16 dígitos)');
        return;
      }
      
      if (cardData.cvv.length !== 3) {
        showError('Error', 'CVV debe tener 3 dígitos');
        return;
      }
      
      if (!cardData.expiry.includes('/') || cardData.expiry.length !== 5) {
        showError('Error', 'Fecha de expiración inválida (formato MM/YY)');
        return;
      }
    }

    // Validar términos y condiciones para todos los métodos de Wompi (excepto efectivo)
    const wompiMethods: PaymentMethodType[] = ['nequi', 'bancolombia', 'pse', 'card'];
    if (wompiMethods.includes(paymentMethod)) {
      if (!termsAccepted) {
        showError('Términos Requeridos', 'Debes aceptar los términos y condiciones para procesar el pago.');
        return;
      }
      
      if (!acceptanceToken) {
        showError('Error', 'No se pudo obtener el token de aceptación. Recarga la página e intenta nuevamente.');
        return;
      }
    }

    // Efectivo: crear pedido sin pago online
    if (paymentMethod === 'cash') {
      try {
        setProcessing(true);
        
        // Si es booking pendiente, crear el pedido ahora
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
            paymentMethod: 'cash'
          });
          
          // Limpiar localStorage
          localStorage.removeItem('pendingBooking');
          
          showSuccess('¡Pedido Confirmado!', 'Pagarás en efectivo al recibir el servicio');
          router.push(`/payment-success/${newOrder.id}?method=cash`);
        } else if (order) {
          // Si ya existe el pedido, confirmar el pago en efectivo en el backend
          await apiClient.confirmCashPayment(order.id);
          showSuccess('¡Pedido Confirmado!', 'Pagarás en efectivo al recibir el servicio');
          router.push(`/payment-success/${order.id}?method=cash`);
        }
      } catch (error) {
        console.error('Error confirming order:', error);
        showError('Error', 'No se pudo confirmar el pedido');
      } finally {
        setProcessing(false);
      }
      return;
    }

    try {
      setProcessing(true);

      // Si es booking pendiente, primero crear el pedido
      let finalOrderId = orderId;
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
          paymentMethod: 'card' // Wompi se considera como tarjeta
        });
        
        finalOrderId = newOrder.id;
        localStorage.removeItem('pendingBooking');
      }

      const paymentData = {
        amount: Math.round(currentData.price * 100), // Convertir a centavos
        currency: 'COP',
        reference: finalOrderId,
        customerEmail: user.email,
        customerName: user.name,
        redirectUrl: `${window.location.origin}/payment-success/${finalOrderId}?method=${paymentMethod}`,
      };

      let transaction;

      // Procesar según método de pago
      if (paymentMethod === 'nequi') {
        console.log('🟡 Calling createNequiTransaction with phone:', nequiPhone);
        console.log('🟡 Payment data:', paymentData);
        
        transaction = await wompiService.createNequiTransaction({
          ...paymentData,
          phoneNumber: nequiPhone,
        });
        
        console.log('🟢 Transaction returned from Wompi:', transaction);
        console.log('🟢 Transaction status:', transaction.status);
        console.log('🟢 Transaction ID:', transaction.id);
      } else if (paymentMethod === 'pse') {
        console.log('🏦 Iniciando pago con PSE...');
        console.log('🏦 Datos PSE:', { pseBank, pseUserType, pseDocType, pseDocNumber });
        console.log('🏦 Bancos disponibles en estado:', pseBanks);
        
        try {
          // Buscar el banco en la lista ya cargada
          const selectedBank = pseBanks.find(b => b.financial_institution_name === pseBank);
          
          if (!selectedBank) {
            console.error('❌ Banco no encontrado en la lista');
            console.error('❌ Banco buscado:', pseBank);
            console.error('❌ Bancos disponibles:', pseBanks.map(b => b.financial_institution_name));
            showError('Error', `Banco "${pseBank}" no encontrado. Por favor selecciona otro banco.`);
            setProcessing(false);
            return;
          }
          
          console.log('🏦 Banco seleccionado:', selectedBank);
          console.log('🏦 Creando transacción PSE...');

          transaction = await wompiService.createPSETransaction({
            ...paymentData,
            userType: pseUserType,
            userLegalIdType: pseDocType,
            userLegalId: pseDocNumber,
            financialInstitutionCode: selectedBank.financial_institution_code,
          });
          
          console.log('🏦 Transacción PSE creada:', transaction);
        } catch (pseError: any) {
          console.error('❌ Error en PSE:', pseError);
          showError('Error PSE', pseError.message || 'No se pudo procesar el pago con PSE. Intenta con otro método.');
          setProcessing(false);
          return;
        }
      } else if (paymentMethod === 'card') {
        console.log('💳 Iniciando pago con tarjeta...');
        console.log('💳 Datos de pago:', { ...paymentData, cardData: 'HIDDEN' });
        
        try {
          // Preparar datos de la tarjeta
          const [exp_month, exp_year] = cardData.expiry.split('/');
          
          transaction = await wompiService.createCardTransaction({
            amount: paymentData.amount,
            currency: paymentData.currency,
            reference: paymentData.reference,
            customerEmail: paymentData.customerEmail,
            cardData: {
              number: cardData.number.replace(/\s/g, ''),
              cvc: cardData.cvv,
              exp_month,
              exp_year,
              card_holder: cardData.name,
            },
            installments: 1,
          });
          
          console.log('💳 Transacción con tarjeta creada:', transaction);
          console.log('💳 Transaction status:', transaction.status);
        } catch (cardError: any) {
          console.error('❌ Error en tarjeta:', cardError);
          
          // Mensajes específicos según el tipo de error
          let errorTitle = 'Error con Tarjeta';
          let errorMessage = cardError.message || 'No se pudo procesar el pago con tarjeta.';
          
          // Detectar errores específicos de validación de Wompi
          if (errorMessage.includes('número de tarjeta es inválido') || errorMessage.includes('Luhn check')) {
            errorTitle = 'Tarjeta Inválida';
            errorMessage = 'El número de tarjeta ingresado no es válido. Verifica que sea correcto.';
          } else if (errorMessage.includes('exp_year') || errorMessage.includes('exp_month')) {
            errorTitle = 'Fecha de Vencimiento Inválida';
            errorMessage = 'La fecha de vencimiento de la tarjeta no es válida. Usa el formato MM/AA (ej: 12/25).';
          } else if (errorMessage.includes('cvc') || errorMessage.includes('CVV')) {
            errorTitle = 'CVV Inválido';
            errorMessage = 'El código de seguridad (CVV) ingresado no es válido.';
          } else if (errorMessage.includes('amount_in_cents')) {
            errorTitle = 'Error de Monto';
            errorMessage = 'Hubo un error con el monto del pago. Intenta nuevamente.';
          } else if (errorMessage.includes('Términos')) {
            errorTitle = 'Términos Requeridos';
            // Ya viene el mensaje correcto del error
          } else if (!errorMessage || errorMessage === 'Error al crear transacción con tarjeta') {
            errorMessage = 'No se pudo procesar el pago con tarjeta. Verifica los datos e intenta nuevamente.';
          }
          
          showError(errorTitle, errorMessage);
          setProcessing(false);
          return;
        }
      } else if (paymentMethod === 'bancolombia') {
        console.log('🔴 Iniciando pago con Bancolombia...');
        console.log('🔴 Datos de pago:', paymentData);
        
        try {
          transaction = await wompiService.createBancolombiaTransaction(paymentData);
          console.log('🔴 Transacción Bancolombia creada:', transaction);
          console.log('🔴 Transaction status:', transaction.status);
          console.log('🔴 Redirect URL:', transaction.redirect_url);
          console.log('🔴 Payment method:', transaction.payment_method);
        } catch (bancolombiaError: any) {
          console.error('❌ Error en Bancolombia:', bancolombiaError);
          showError('Error Bancolombia', bancolombiaError.message || 'No se pudo procesar el pago con Bancolombia. Intenta con otro método.');
          setProcessing(false);
          return;
        }
      }

      if (!transaction) {
        console.error('❌ No se creó ninguna transacción');
        throw new Error('No se pudo crear la transacción');
      }

      // Si hay URL de redirección (PSE, Bancolombia), guardar transactionId y redirigir
      if (transaction.redirect_url) {
        console.log('═══════════════════════════════════════');
        console.log('🔄 REDIRECCIÓN DETECTADA');
        console.log('═══════════════════════════════════════');
        console.log('🔄 Método de pago:', paymentMethod);
        console.log('🔄 Transaction ID:', transaction.id);
        console.log('🔄 Redirect URL:', transaction.redirect_url);
        console.log('═══════════════════════════════════════');
        
        // Guardar el transactionId en el pedido antes de redirigir
        try {
          await apiClient.updateOrder(finalOrderId, { paymentIntentId: transaction.id });
          console.log('✅ TransactionId saved to order');
        } catch (error) {
          console.error('❌ Error saving transactionId to order:', error);
        }
        
        // También guardarlo en localStorage como backup
        localStorage.setItem(`transaction_${finalOrderId}`, transaction.id);
        
        console.log('🔄 Redirigiendo a:', transaction.redirect_url);
        console.log('🔄 Ejecutando window.location.href...');
        window.location.href = transaction.redirect_url;
        return;
      } else {
        console.log('⚠️ No hay redirect_url en la transacción');
        console.log('⚠️ Transaction completa:', transaction);
      }

      // Verificar estado de la transacción
      console.log('═══════════════════════════════════════');
      console.log('🟢 CHECKOUT - CHECKING TRANSACTION STATUS');
      console.log('═══════════════════════════════════════');
      console.log('Transaction ID:', transaction.id);
      console.log('Transaction status:', transaction.status);
      console.log('Transaction object:', transaction);
      console.log('═══════════════════════════════════════');
      
      if (transaction.status === 'APPROVED') {
        console.log('✅ Status is APPROVED - Redirecting to success');
        // Pago aprobado inmediatamente
        await apiClient.updateOrderStatus(finalOrderId, 'ACCEPTED');
        showSuccess('¡Pago Exitoso!', 'Tu pago ha sido procesado correctamente');
        router.push(`/payment-success/${finalOrderId}?transactionId=${transaction.id}&method=${paymentMethod}`);
      } else if (transaction.status === 'PENDING') {
        console.log('⏳ Status is PENDING - Redirecting to pending');
        // Para Nequi, el usuario debe aprobar en su app
        showSuccess('Pago Pendiente', 'Revisa tu app de Nequi para aprobar el pago');
        localStorage.setItem(`transaction_${finalOrderId}`, transaction.id);
        router.push(`/payment-pending/${finalOrderId}?transactionId=${transaction.id}`);
      } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
        console.log('❌ Status is DECLINED/ERROR - Cancelling order and payment');
        
        // Cancelar automáticamente el pedido y pago cuando es rechazado
        try {
          await apiClient.cancelOrderAndPayment(finalOrderId, transaction.id);
          console.log('✅ Order and payment cancelled successfully');
        } catch (cancelError) {
          console.error('⚠️ Error cancelling order after payment rejection:', cancelError);
          // Continuar aunque falle la cancelación
        }
        
        // Pago rechazado o error
        throw new Error('El pago fue rechazado y el pedido ha sido cancelado automáticamente. Por favor verifica los datos e intenta nuevamente.');
      } else {
        console.log('❓ Status is UNKNOWN:', transaction.status);
        // Estado desconocido
        throw new Error(`Estado de transacción desconocido: ${transaction.status}`);
      }

    } catch (error: any) {
      console.error('❌ Error processing payment:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      // Mensajes de error más específicos y notorios
      let errorTitle = '❌ Error en el Pago';
      let errorMessage = error.message || 'No se pudo procesar el pago';
      
      // Detectar tipos específicos de error
      if (errorMessage.includes('Número no válido') || errorMessage.includes('número no válido')) {
        errorTitle = '⚠️ Número Inválido';
        errorMessage = '❌ El número de Nequi no es válido para sandbox.\n\n✅ Usa el número de prueba: 3001234567';
      } else if (errorMessage.includes('monto mínimo') || errorMessage.includes('$1,500')) {
        errorTitle = '💰 Monto Mínimo Requerido';
        errorMessage = '❌ El monto mínimo para transacciones Nequi es $1,500 COP.\n\n💡 El precio actual es muy bajo para procesar con Nequi.\n\n✅ Prueba con otro método de pago o aumenta el monto.';
      } else if (errorMessage.includes('firma')) {
        errorTitle = '🔒 Error de Configuración';
        errorMessage = '❌ Error de configuración del sistema.\n\n📞 Por favor contacta al soporte.';
      } else if (errorMessage.includes('rechazada') || errorMessage.includes('declined') || errorMessage.includes('rechazado')) {
        errorTitle = '❌ Transacción Rechazada';
        errorMessage = `❌ ${errorMessage}\n\n🗑️ El pedido ha sido cancelado automáticamente.\n\n💡 Verifica los datos e intenta crear un nuevo pedido.`;
      }
      
      // Mostrar error con formato más notorio
      showError(errorTitle, errorMessage);
      
      // También mostrar en consola con formato notorio
      console.error('═══════════════════════════════════════');
      console.error('🚨 ERROR DE PAGO DETECTADO');
      console.error('═══════════════════════════════════════');
      console.error('Título:', errorTitle);
      console.error('Mensaje:', errorMessage);
      console.error('Error original:', error);
      console.error('═══════════════════════════════════════');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!order && !bookingData) {
    return null;
  }

  const displayData = order || bookingData;
  
  // Helper para validar si es un método de Wompi
  const wompiMethods: PaymentMethodType[] = ['nequi', 'bancolombia', 'pse', 'card'];
  const isWompiMethod = wompiMethods.includes(paymentMethod);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen pb-24">
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
              <span className="font-medium text-gray-900">{displayData.service}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Encargado:</span>
              <span className="font-medium text-gray-900">{displayData.encargado?.name || displayData.encargadoName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha:</span>
              <span className="font-medium text-gray-900">
                {new Date(displayData.date).toLocaleDateString('es-CO')}
              </span>
            </div>
            
            {/* Desglose de precios - Solo para métodos de Wompi */}
            {pricingBreakdown && isWompiMethod ? (
              <>
                <div className="pt-2 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Precio del servicio:</span>
                    <span className="text-gray-900">${pricingBreakdown.servicePrice.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Comisión plataforma ({pricingBreakdown.platformMarginPercent}%):</span>
                    <span className="text-gray-900">${pricingBreakdown.platformMargin.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Costo de transacción:</span>
                    <span className="text-gray-900">${Math.round(pricingBreakdown.wompiCostClient).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                    <span className="text-lg font-semibold text-gray-900">Total a pagar:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${Math.round(pricingBreakdown.totalPrice).toLocaleString('es-CO')} COP
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${displayData.price.toLocaleString('es-CO')} COP
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Método de pago */}
        <div className="p-4 space-y-4">
          <h2 className="font-semibold text-gray-900">Método de Pago</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('nequi')}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'nequi'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-center mb-2">
                <NequiIcon className="w-12 h-12" />
              </div>
              <p className={`text-sm font-medium ${
                paymentMethod === 'nequi' ? 'text-purple-600' : 'text-gray-600'
              }`}>
                Nequi
              </p>
            </button>

            {/* Bancolombia - OCULTO
            <button
              onClick={() => setPaymentMethod('bancolombia')}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'bancolombia'
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-center mb-2">
                <BancolombiaIcon className="w-12 h-12" />
              </div>
              <p className={`text-sm font-medium ${
                paymentMethod === 'bancolombia' ? 'text-yellow-700' : 'text-gray-600'
              }`}>
                Bancolombia
              </p>
            </button> */}

            {/* PSE */}
            <button
              onClick={() => setPaymentMethod('pse')}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'pse'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-center mb-2">
                <PSEIcon className="w-12 h-12" />
              </div>
              <p className={`text-sm font-medium ${
                paymentMethod === 'pse' ? 'text-green-600' : 'text-gray-600'
              }`}>
                PSE
              </p>
            </button>

            {/* Tarjeta */}
            <button
              onClick={() => setPaymentMethod('card')}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'card'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-center mb-2">
                <CreditCard className={`w-12 h-12 ${
                  paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-400'
                }`} />
              </div>
              <p className={`text-sm font-medium ${
                paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-600'
              }`}>
                Tarjeta
              </p>
            </button>

            {/* Efectivo */}
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === 'cash'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-center mb-2">
                <CashIcon className="w-12 h-12" />
              </div>
              <p className={`text-sm font-medium ${
                paymentMethod === 'cash' ? 'text-green-600' : 'text-gray-600'
              }`}>
                Efectivo
              </p>
            </button>
          </div>

          {/* Formulario Nequi */}
          {paymentMethod === 'nequi' && (
            <div className="space-y-4 mt-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-purple-800 mb-2">
                  <strong>Pago con Nequi:</strong> Recibirás una notificación en tu app de Nequi para aprobar el pago.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                  <p className="text-xs text-yellow-800">
                    <strong>⚠️ Sandbox:</strong> Usa el número de prueba <strong>3001234567</strong> para simular pagos exitosos.
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Celular Nequi
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={nequiPhone}
                    onChange={(e) => setNequiPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="3991111111"
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    maxLength={10}
                  />
                  <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <div className="text-xs text-gray-500 mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                  <p className="font-semibold text-blue-800 mb-1">📱 Números de prueba Wompi:</p>
                  <p>✅ <strong className="text-green-600">3991111111</strong> - Transacción APROBADA</p>
                  <p>❌ <strong className="text-red-600">3992222222</strong> - Transacción RECHAZADA</p>
                </div>
              </div>
            </div>
          )}


          {/* Formulario PSE */}
          {paymentMethod === 'pse' && (
            <div className="space-y-4 mt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  <strong>PSE:</strong> Pago seguro desde tu cuenta bancaria. Serás redirigido al portal de tu banco.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Persona
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPseUserType('NATURAL')}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      pseUserType === 'NATURAL'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    Natural
                  </button>
                  <button
                    onClick={() => setPseUserType('JURIDICA')}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      pseUserType === 'JURIDICA'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    Jurídica
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banco
                </label>
                <select
                  value={pseBank}
                  onChange={(e) => setPseBank(e.target.value)}
                  disabled={loadingBanks}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">{loadingBanks ? 'Cargando bancos...' : 'Selecciona tu banco'}</option>
                  {pseBanks.map((bank) => (
                    <option key={bank.financial_institution_code} value={bank.financial_institution_name}>
                      {bank.financial_institution_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento
                </label>
                <select
                  value={pseDocType}
                  onChange={(e) => setPseDocType(e.target.value as 'CC' | 'NIT')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="NIT">NIT</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="PPN">Pasaporte</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Documento
                </label>
                <input
                  type="text"
                  value={pseDocNumber}
                  onChange={(e) => setPseDocNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="1999888777"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div className="text-xs text-gray-500 mt-2 bg-green-50 border border-green-200 rounded p-2">
                <p className="font-semibold text-green-800 mb-1">🏦 Datos de prueba PSE (Sandbox):</p>
                <p>• <strong>Documento:</strong> 1999888777</p>
                <p>• Los bancos disponibles son de prueba de Wompi</p>
                <p>• Selecciona cualquier banco para simular el flujo</p>
              </div>
            </div>
          )}

          {/* Formulario de Tarjeta */}
          {paymentMethod === 'card' && (
            <div className="space-y-4 mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>💳 Tarjeta:</strong> Pago seguro con tarjeta de crédito o débito.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Tarjeta
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardData.number}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\s/g, '');
                      const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
                      setCardData({ ...cardData, number: formatted.slice(0, 19) });
                    }}
                    placeholder="4242 4242 4242 4242"
                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={19}
                  />
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      if (cleaned.length >= 2) {
                        setCardData({ ...cardData, expiry: `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}` });
                      } else {
                        setCardData({ ...cardData, expiry: cleaned });
                      }
                    }}
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

              <div className="text-xs text-gray-500 mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                <p className="font-semibold text-blue-800 mb-1">💳 Tarjetas de prueba Wompi:</p>
                <p>✅ <strong className="text-green-600">4242 4242 4242 4242</strong> - APROBADA</p>
                <p>❌ <strong className="text-red-600">4111 1111 1111 1111</strong> - RECHAZADA</p>
                <p>• <strong>CVV:</strong> 123 | <strong>Fecha:</strong> 12/25</p>
              </div>
            </div>
          )}

          {/* Mensaje para efectivo */}
          {paymentMethod === 'cash' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-blue-800">
                <strong>Pago en efectivo:</strong> Pagarás directamente al encargado cuando llegue a tu domicilio. Asegúrate de tener el monto exacto.
              </p>
            </div>
          )}

          {/* Checkbox de términos y condiciones - Para todos los métodos de Wompi */}
          {isWompiMethod && (
            <div className="mt-6 bg-gray-50 border border-gray-300 rounded-lg p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Acepto los{' '}
                  {acceptanceToken?.permalink ? (
                    <a
                      href={acceptanceToken.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      términos y condiciones
                    </a>
                  ) : (
                    <span className="text-blue-600 font-medium">términos y condiciones</span>
                  )}
                  {' '}y autorizo el tratamiento de mis datos personales para procesar el pago.
                </span>
              </label>
            </div>
          )}

          {/* Mensaje de seguridad */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mt-4">
            <Lock className="w-4 h-4" />
            <span>Todos los pagos están protegidos con encriptación SSL</span>
          </div>
        </div>

        {/* Botón de pago */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-md mx-auto">
            <button
              onClick={handlePayment}
              disabled={processing || (isWompiMethod && !termsAccepted)}
              className={`w-full py-4 rounded-lg font-semibold text-white transition-colors ${
                processing || (isWompiMethod && !termsAccepted)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : paymentMethod === 'nequi'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                  : paymentMethod === 'bancolombia'
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
                  : paymentMethod === 'pse'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
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
                  {paymentMethod === 'cash' ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Confirmar Pedido
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Pagar ${(pricingBreakdown && isWompiMethod 
                        ? Math.round(pricingBreakdown.totalPrice) 
                        : displayData.price
                      ).toLocaleString('es-CO')} COP
                    </>
                  )}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
