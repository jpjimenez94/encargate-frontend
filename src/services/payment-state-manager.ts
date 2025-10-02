// Payment State Manager - Centraliza el manejo de estados de pago
// Arquitectura: Observer Pattern + State Machine

export type PaymentMethod = 'nequi' | 'bancolombia' | 'pse' | 'cash';
export type PaymentStatus = 'IDLE' | 'CREATING' | 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'CONFIRMED';

export interface PaymentState {
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  error?: string;
  redirectUrl?: string;
  lastUpdated: Date;
}

export interface PaymentStateListener {
  onStateChange: (state: PaymentState) => void;
}

class PaymentStateManager {
  private states: Map<string, PaymentState> = new Map();
  private listeners: Map<string, PaymentStateListener[]> = new Map();
  private persistenceKey = 'payment_states';

  constructor() {
    this.loadFromStorage();
    // Auto-save cada 5 segundos
    setInterval(() => this.saveToStorage(), 5000);
  }

  /**
   * Crea un nuevo estado de pago
   */
  createPaymentState(orderId: string, method: PaymentMethod): PaymentState {
    const state: PaymentState = {
      orderId,
      method,
      status: 'IDLE',
      lastUpdated: new Date()
    };
    
    this.states.set(orderId, state);
    this.notifyListeners(orderId, state);
    this.saveToStorage();
    
    return state;
  }

  /**
   * Actualiza el estado de un pago
   */
  updatePaymentState(orderId: string, updates: Partial<PaymentState>): PaymentState {
    const currentState = this.states.get(orderId);
    if (!currentState) {
      throw new Error(`Payment state not found for order: ${orderId}`);
    }

    const newState: PaymentState = {
      ...currentState,
      ...updates,
      lastUpdated: new Date()
    };

    this.states.set(orderId, newState);
    this.notifyListeners(orderId, newState);
    this.saveToStorage();

    return newState;
  }

  /**
   * Obtiene el estado actual de un pago
   */
  getPaymentState(orderId: string): PaymentState | null {
    return this.states.get(orderId) || null;
  }

  /**
   * Marca un pago como creado con transactionId
   */
  markTransactionCreated(orderId: string, transactionId: string, redirectUrl?: string): PaymentState {
    return this.updatePaymentState(orderId, {
      status: 'PENDING',
      transactionId,
      redirectUrl
    });
  }

  /**
   * Marca un pago como aprobado
   */
  markPaymentApproved(orderId: string): PaymentState {
    return this.updatePaymentState(orderId, {
      status: 'APPROVED'
    });
  }

  /**
   * Marca un pago como confirmado en el backend
   */
  markPaymentConfirmed(orderId: string): PaymentState {
    return this.updatePaymentState(orderId, {
      status: 'CONFIRMED'
    });
  }

  /**
   * Marca un pago como fallido
   */
  markPaymentFailed(orderId: string, error: string): PaymentState {
    return this.updatePaymentState(orderId, {
      status: 'ERROR',
      error
    });
  }

  /**
   * Suscribe un listener a cambios de estado
   */
  subscribe(orderId: string, listener: PaymentStateListener): () => void {
    if (!this.listeners.has(orderId)) {
      this.listeners.set(orderId, []);
    }
    
    this.listeners.get(orderId)!.push(listener);

    // Retorna función de unsubscribe
    return () => {
      const listeners = this.listeners.get(orderId);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notifica a todos los listeners de un orderId
   */
  private notifyListeners(orderId: string, state: PaymentState): void {
    const listeners = this.listeners.get(orderId) || [];
    listeners.forEach(listener => {
      try {
        listener.onStateChange(state);
      } catch (error) {
        console.error('Error in payment state listener:', error);
      }
    });
  }

  /**
   * Guarda estados en localStorage
   */
  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const serializedStates = JSON.stringify(Array.from(this.states.entries()));
        localStorage.setItem(this.persistenceKey, serializedStates);
      } catch (error) {
        console.error('Error saving payment states:', error);
      }
    }
  }

  /**
   * Carga estados desde localStorage
   */
  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const serializedStates = localStorage.getItem(this.persistenceKey);
        if (serializedStates) {
          const entries = JSON.parse(serializedStates);
          this.states = new Map(entries.map(([key, value]: [string, any]) => [
            key,
            { ...value, lastUpdated: new Date(value.lastUpdated) }
          ]));
        }
      } catch (error) {
        console.error('Error loading payment states:', error);
      }
    }
  }

  /**
   * Limpia estados antiguos (más de 24 horas)
   */
  cleanupOldStates(): void {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas

    for (const [orderId, state] of this.states.entries()) {
      if (now.getTime() - state.lastUpdated.getTime() > maxAge) {
        this.states.delete(orderId);
      }
    }
    
    this.saveToStorage();
  }

  /**
   * Obtiene el transactionId de un pedido (con múltiples fallbacks)
   */
  getTransactionId(orderId: string): string | null {
    // 1. Desde el estado centralizado
    const state = this.getPaymentState(orderId);
    if (state?.transactionId) {
      return state.transactionId;
    }

    // 2. Desde localStorage legacy
    if (typeof window !== 'undefined') {
      const legacyId = localStorage.getItem(`transaction_${orderId}`);
      if (legacyId) {
        // Migrar al estado centralizado
        this.updatePaymentState(orderId, { transactionId: legacyId });
        return legacyId;
      }
    }

    return null;
  }
}

// Singleton instance
export const paymentStateManager = new PaymentStateManager();

// Cleanup automático cada hora
if (typeof window !== 'undefined') {
  setInterval(() => {
    paymentStateManager.cleanupOldStates();
  }, 60 * 60 * 1000);
}
