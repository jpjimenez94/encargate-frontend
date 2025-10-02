// Wompi Payment Service - Proxy a través del backend

export interface WompiTransaction {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  reference: string;
  redirect_url?: string;
  status_message?: string;
}

export interface NequiPaymentData {
  amount: number;
  currency: string;
  reference?: string; // Ahora es opcional, el backend genera una automáticamente
  customerEmail: string;
  phoneNumber: string;
  redirectUrl?: string;
}

export interface PSEPaymentData {
  amount: number;
  currency: string;
  reference?: string; // Opcional, el backend genera una automáticamente
  customerEmail: string;
  userType: string;
  userLegalIdType: string;
  userLegalId: string;
  financialInstitutionCode: string;
  redirectUrl: string;
}

export interface WompiPaymentData {
  amount: number;
  currency: string;
  reference?: string; // Opcional, el backend genera una automáticamente
  customerEmail: string;
  redirectUrl: string;
}

export interface CardData {
  number: string;
  cvc: string;
  exp_month: string;
  exp_year: string;
  card_holder: string;
}

export interface CardPaymentData {
  amount: number;
  currency: string;
  reference?: string;
  customerEmail: string;
  cardData: CardData;
  installments?: number;
}

class WompiService {
  private getToken(): string {
    return localStorage.getItem('token') || '';
  }

  private getApiUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  }

  async createNequiTransaction(paymentData: NequiPaymentData): Promise<WompiTransaction> {
    try {
      const response = await fetch(`${this.getApiUrl()}/wompi/create-nequi-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear transacción Nequi');
      }

      const result = await response.json();
      return result.data; // Extraer el objeto transaction del wrapper { data: transaction }
    } catch (error) {
      console.error('Error creating Nequi transaction:', error);
      throw error;
    }
  }

  async createPSETransaction(paymentData: PSEPaymentData): Promise<WompiTransaction> {
    try {
      const response = await fetch(`${this.getApiUrl()}/wompi/create-pse-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear transacción PSE');
      }

      const result = await response.json();
      return result.data; // Extraer el objeto transaction del wrapper { data: transaction }
    } catch (error) {
      console.error('Error creating PSE transaction:', error);
      throw error;
    }
  }

  async createBancolombiaTransaction(paymentData: WompiPaymentData): Promise<WompiTransaction> {
    try {
      const response = await fetch(`${this.getApiUrl()}/wompi/create-bancolombia-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear transacción Bancolombia');
      }

      const result = await response.json();
      return result.data; // Extraer el objeto transaction del wrapper { data: transaction }
    } catch (error) {
      console.error('Error creating Bancolombia transaction:', error);
      throw error;
    }
  }

  async getPSEBanks(): Promise<Array<{ financial_institution_code: string; financial_institution_name: string }>> {
    try {
      const response = await fetch(`${this.getApiUrl()}/wompi/pse-banks`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener bancos PSE');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting PSE banks:', error);
      throw error;
    }
  }

  async getTransaction(transactionId: string): Promise<WompiTransaction> {
    try {
      const response = await fetch(`${this.getApiUrl()}/wompi/transaction/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al consultar transacción');
      }

      const result = await response.json();
      return result.data; // Extraer el objeto transaction del wrapper { data: transaction }
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw error;
    }
  }

  async cancelTransaction(transactionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.getApiUrl()}/wompi/cancel-transaction/${transactionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cancelar transacción');
      }

      return await response.json();
    } catch (error) {
      console.error('Error canceling transaction:', error);
      throw error;
    }
  }

  async getAcceptanceToken(): Promise<{ acceptance_token: string; permalink: string; type: string }> {
    try {
      const response = await fetch(`${this.getApiUrl()}/wompi/acceptance-tokens`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener token de aceptación');
      }

      const result = await response.json();
      console.log('🔐 Response de acceptance tokens:', result);
      
      // El backend devuelve directamente el objeto, no encapsulado en .data
      return result;
    } catch (error) {
      console.error('Error getting acceptance token:', error);
      throw error;
    }
  }

  async tokenizeCard(cardData: CardData): Promise<{ id: string; status: string }> {
    try {
      const response = await fetch(`${this.getApiUrl()}/wompi/tokenize/card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(cardData),
      });

      if (!response.ok) {
        const error = await response.json();
        // El backend ahora devuelve el mensaje de error detallado de Wompi
        throw new Error(error.message || 'Error al tokenizar tarjeta');
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('Error tokenizing card:', error);
      // Propagar el error con el mensaje original
      throw new Error(error.message || 'Error al tokenizar tarjeta');
    }
  }

  async createCardTransaction(paymentData: CardPaymentData): Promise<WompiTransaction> {
    try {
      // Primero tokenizar la tarjeta
      console.log('💳 Tokenizando tarjeta...');
      const tokenData = await this.tokenizeCard(paymentData.cardData);
      console.log('✅ Tarjeta tokenizada:', tokenData.id);

      // Luego crear la transacción con el token
      console.log('💳 Creando transacción con tarjeta...');
      const response = await fetch(`${this.getApiUrl()}/wompi/create-card-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({
          amount_in_cents: Math.round(paymentData.amount * 100),
          currency: paymentData.currency,
          reference: paymentData.reference,
          customer_email: paymentData.customerEmail,
          token: tokenData.id,
          installments: paymentData.installments || 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear transacción con tarjeta');
      }

      const result = await response.json();
      console.log('✅ Transacción con tarjeta creada:', result.data);
      return result.data;
    } catch (error) {
      console.error('Error creating card transaction:', error);
      throw error;
    }
  }
}

export const wompiService = new WompiService();
