// usePayment Hook - Interfaz React para el sistema unificado de pagos
// Arquitectura: Custom Hook + Observer Pattern

import { useState, useEffect, useCallback } from 'react';
import { unifiedPaymentService, UnifiedPaymentData, PaymentResult } from '@/services/unified-payment-service';
import { paymentStateManager, PaymentState, PaymentStatus } from '@/services/payment-state-manager';

export interface UsePaymentOptions {
  orderId: string;
  autoMonitor?: boolean; // Default: true
  onStateChange?: (state: PaymentState) => void;
}

export interface UsePaymentReturn {
  // Estado
  paymentState: PaymentState | null;
  isProcessing: boolean;
  error: string | null;
  
  // Acciones
  processPayment: (data: UnifiedPaymentData) => Promise<PaymentResult>;
  checkPaymentStatus: () => Promise<void>;
  clearError: () => void;
  
  // Helpers
  canRetry: boolean;
  isCompleted: boolean;
  requiresUserAction: boolean;
}

export function usePayment(options: UsePaymentOptions): UsePaymentReturn {
  const { orderId, autoMonitor = true, onStateChange } = options;
  
  const [paymentState, setPaymentState] = useState<PaymentState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar estado inicial
  useEffect(() => {
    const initialState = paymentStateManager.getPaymentState(orderId);
    setPaymentState(initialState);
  }, [orderId]);

  // Suscribirse a cambios de estado
  useEffect(() => {
    const unsubscribe = paymentStateManager.subscribe(orderId, {
      onStateChange: (newState) => {
        setPaymentState(newState);
        onStateChange?.(newState);
        
        // Limpiar error si el estado mejora
        if (newState.status !== 'ERROR') {
          setError(null);
        }
      }
    });

    return unsubscribe;
  }, [orderId, onStateChange]);

  // Auto-monitoring
  useEffect(() => {
    if (!autoMonitor || !paymentState?.transactionId) return;
    
    // Solo monitorear si está en estado pendiente o aprobado
    if (paymentState.status === 'PENDING' || paymentState.status === 'APPROVED') {
      const interval = setInterval(async () => {
        try {
          await unifiedPaymentService.checkAndUpdatePaymentStatus(orderId);
        } catch (err) {
          console.error('Auto-monitoring error:', err);
        }
      }, 5000); // Cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [orderId, autoMonitor, paymentState?.status, paymentState?.transactionId]);

  /**
   * Procesa un pago
   */
  const processPayment = useCallback(async (data: UnifiedPaymentData): Promise<PaymentResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await unifiedPaymentService.processPayment(data);
      
      if (!result.success) {
        setError(result.error || 'Error procesando pago');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        requiresRedirect: false,
        state: paymentState || paymentStateManager.createPaymentState(orderId, data.method)
      };
    } finally {
      setIsProcessing(false);
    }
  }, [orderId, paymentState]);

  /**
   * Verifica manualmente el estado del pago
   */
  const checkPaymentStatus = useCallback(async (): Promise<void> => {
    if (!paymentState?.transactionId) {
      setError('No hay transactionId para verificar');
      return;
    }

    setIsProcessing(true);
    try {
      await unifiedPaymentService.forcePaymentCheck(orderId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error verificando pago';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [orderId, paymentState?.transactionId]);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Computed properties
  const canRetry = paymentState?.status === 'ERROR' || !!error;
  const isCompleted = paymentState?.status === 'CONFIRMED';
  const requiresUserAction = paymentState?.status === 'PENDING' && paymentState?.method === 'nequi';

  return {
    // Estado
    paymentState,
    isProcessing,
    error,
    
    // Acciones
    processPayment,
    checkPaymentStatus,
    clearError,
    
    // Helpers
    canRetry,
    isCompleted,
    requiresUserAction
  };
}

/**
 * Hook simplificado para solo monitorear un pago existente
 */
export function usePaymentMonitor(orderId: string) {
  const [state, setState] = useState<PaymentState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Cargar estado inicial
    const initialState = paymentStateManager.getPaymentState(orderId);
    setState(initialState);
    setIsLoading(false);

    // Suscribirse a cambios
    const unsubscribe = paymentStateManager.subscribe(orderId, {
      onStateChange: setState
    });

    return unsubscribe;
  }, [orderId]);

  const forceCheck = useCallback(async () => {
    await unifiedPaymentService.forcePaymentCheck(orderId);
  }, [orderId]);

  return {
    state,
    isLoading,
    forceCheck,
    isCompleted: state?.status === 'CONFIRMED',
    isPending: state?.status === 'PENDING',
    hasError: state?.status === 'ERROR'
  };
}
