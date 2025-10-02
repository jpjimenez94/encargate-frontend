// Unified Payment Service - Maneja todos los métodos de pago de forma consistente
// Arquitectura: Strategy Pattern + Command Pattern

import { wompiService, WompiTransaction, NequiPaymentData, PSEPaymentData, WompiPaymentData } from './wompi';
import { apiClient } from './api';
import { paymentStateManager, PaymentMethod, PaymentState } from './payment-state-manager';

export interface UnifiedPaymentData {
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  method: PaymentMethod;
  
  // Datos específicos por método
  nequi?: {
    phoneNumber: string;
  };
  pse?: {
    userType: string;
    userLegalIdType: string;
    userLegalId: string;
    financialInstitutionCode: string;
  };
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  redirectUrl?: string;
  requiresRedirect: boolean;
  error?: string;
  state: PaymentState;
}

class UnifiedPaymentService {
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Procesa un pago usando el método especificado
   */
  async processPayment(paymentData: UnifiedPaymentData): Promise<PaymentResult> {
    const { orderId, method } = paymentData;
    
    try {
      // 1. Crear estado inicial
      const state = paymentStateManager.createPaymentState(orderId, method);
      paymentStateManager.updatePaymentState(orderId, { status: 'CREATING' });

      // 2. Procesar según el método
      let transaction: WompiTransaction;
      
      switch (method) {
        case 'nequi':
          transaction = await this.processNequiPayment(paymentData);
          break;
        case 'bancolombia':
          transaction = await this.processBancolombiaPayment(paymentData);
          break;
        case 'pse':
          transaction = await this.processPSEPayment(paymentData);
          break;
        case 'cash':
          return await this.processCashPayment(paymentData);
        default:
          throw new Error(`Método de pago no soportado: ${method}`);
      }

      // 3. Actualizar estado con transactionId
      const updatedState = paymentStateManager.markTransactionCreated(
        orderId, 
        transaction.id, 
        transaction.redirect_url
      );

      // 4. Guardar transactionId en el pedido (crítico para recuperación)
      await this.saveTransactionToOrder(orderId, transaction.id);

      // 5. Iniciar monitoring automático
      this.startPaymentMonitoring(orderId);

      return {
        success: true,
        transactionId: transaction.id,
        redirectUrl: transaction.redirect_url,
        requiresRedirect: !!transaction.redirect_url,
        state: updatedState
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorState = paymentStateManager.markPaymentFailed(orderId, errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        requiresRedirect: false,
        state: errorState
      };
    }
  }

  /**
   * Procesa pago con Nequi
   */
  private async processNequiPayment(paymentData: UnifiedPaymentData): Promise<WompiTransaction> {
    if (!paymentData.nequi?.phoneNumber) {
      throw new Error('Número de teléfono requerido para Nequi');
    }

    const nequiData: NequiPaymentData = {
      amount: paymentData.amount,
      currency: paymentData.currency,
      customerEmail: paymentData.customerEmail,
      phoneNumber: paymentData.nequi.phoneNumber
    };

    return await wompiService.createNequiTransaction(nequiData);
  }

  /**
   * Procesa pago con Bancolombia
   */
  private async processBancolombiaPayment(paymentData: UnifiedPaymentData): Promise<WompiTransaction> {
    const bancolombiaData: WompiPaymentData = {
      amount: paymentData.amount,
      currency: paymentData.currency,
      customerEmail: paymentData.customerEmail,
      redirectUrl: `${window.location.origin}/payment-success/${paymentData.orderId}?method=bancolombia`
    };

    return await wompiService.createBancolombiaTransaction(bancolombiaData);
  }

  /**
   * Procesa pago con PSE
   */
  private async processPSEPayment(paymentData: UnifiedPaymentData): Promise<WompiTransaction> {
    if (!paymentData.pse) {
      throw new Error('Datos PSE requeridos');
    }

    const pseData: PSEPaymentData = {
      amount: paymentData.amount,
      currency: paymentData.currency,
      customerEmail: paymentData.customerEmail,
      userType: paymentData.pse.userType,
      userLegalIdType: paymentData.pse.userLegalIdType,
      userLegalId: paymentData.pse.userLegalId,
      financialInstitutionCode: paymentData.pse.financialInstitutionCode,
      redirectUrl: `${window.location.origin}/payment-success/${paymentData.orderId}?method=pse`
    };

    return await wompiService.createPSETransaction(pseData);
  }

  /**
   * Procesa pago en efectivo
   */
  private async processCashPayment(paymentData: UnifiedPaymentData): Promise<PaymentResult> {
    try {
      // Actualizar pedido a PENDING para efectivo
      await apiClient.updateOrderStatus(paymentData.orderId, 'PENDING');
      
      const state = paymentStateManager.markPaymentConfirmed(paymentData.orderId);
      
      return {
        success: true,
        requiresRedirect: false,
        state
      };
    } catch (error) {
      throw new Error(`Error procesando pago en efectivo: ${error}`);
    }
  }

  /**
   * Guarda el transactionId en el pedido (con reintentos)
   */
  private async saveTransactionToOrder(orderId: string, transactionId: string, retries = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await apiClient.updateOrder(orderId, { paymentIntentId: transactionId });
        console.log(`✅ TransactionId ${transactionId} saved to order ${orderId}`);
        return;
      } catch (error) {
        console.error(`❌ Attempt ${i + 1} failed to save transactionId:`, error);
        if (i === retries - 1) {
          console.error(`❌ Failed to save transactionId after ${retries} attempts`);
          // No lanzar error - el pago puede continuar sin esto
        }
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  /**
   * Inicia el monitoring automático de un pago
   */
  private startPaymentMonitoring(orderId: string): void {
    // Limpiar interval existente si existe
    this.stopPaymentMonitoring(orderId);

    const interval = setInterval(async () => {
      try {
        await this.checkAndUpdatePaymentStatus(orderId);
      } catch (error) {
        console.error(`Error monitoring payment ${orderId}:`, error);
      }
    }, 3000); // Cada 3 segundos

    this.pollingIntervals.set(orderId, interval);

    // Auto-cleanup después de 10 minutos
    setTimeout(() => {
      this.stopPaymentMonitoring(orderId);
    }, 10 * 60 * 1000);
  }

  /**
   * Detiene el monitoring de un pago
   */
  private stopPaymentMonitoring(orderId: string): void {
    const interval = this.pollingIntervals.get(orderId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(orderId);
    }
  }

  /**
   * Verifica y actualiza el estado de un pago
   */
  async checkAndUpdatePaymentStatus(orderId: string): Promise<PaymentState | null> {
    const state = paymentStateManager.getPaymentState(orderId);
    if (!state || !state.transactionId) {
      return null;
    }

    // No verificar si ya está confirmado
    if (state.status === 'CONFIRMED') {
      this.stopPaymentMonitoring(orderId);
      return state;
    }

    try {
      // Consultar estado en Wompi
      const transaction = await wompiService.getTransaction(state.transactionId);
      console.log(`🔍 Checking payment ${orderId}: ${transaction.status}`);

      if (transaction.status === 'APPROVED') {
        // Marcar como aprobado
        const approvedState = paymentStateManager.markPaymentApproved(orderId);
        
        // Confirmar en el backend
        try {
          await apiClient.confirmOrderPayment(orderId, state.transactionId);
          const confirmedState = paymentStateManager.markPaymentConfirmed(orderId);
          console.log(`✅ Payment ${orderId} confirmed automatically`);
          
          // Detener monitoring
          this.stopPaymentMonitoring(orderId);
          
          return confirmedState;
        } catch (confirmError) {
          console.error(`❌ Error confirming payment ${orderId}:`, confirmError);
          return approvedState;
        }
      } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
        const errorState = paymentStateManager.markPaymentFailed(
          orderId, 
          transaction.status_message || 'Pago rechazado'
        );
        this.stopPaymentMonitoring(orderId);
        return errorState;
      }

      return state;
    } catch (error) {
      console.error(`Error checking payment status for ${orderId}:`, error);
      return state;
    }
  }

  /**
   * Obtiene el estado actual de un pago
   */
  getPaymentState(orderId: string): PaymentState | null {
    return paymentStateManager.getPaymentState(orderId);
  }

  /**
   * Fuerza la verificación manual de un pago
   */
  async forcePaymentCheck(orderId: string): Promise<PaymentState | null> {
    return await this.checkAndUpdatePaymentStatus(orderId);
  }

  /**
   * Limpia recursos al destruir el servicio
   */
  cleanup(): void {
    for (const [orderId] of this.pollingIntervals) {
      this.stopPaymentMonitoring(orderId);
    }
  }
}

// Singleton instance
export const unifiedPaymentService = new UnifiedPaymentService();

// Cleanup automático al cerrar la ventana
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    unifiedPaymentService.cleanup();
  });
}
