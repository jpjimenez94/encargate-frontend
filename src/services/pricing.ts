export interface PricingBreakdown {
  // Precio base
  servicePrice: number;           // P - Precio base del servicio
  
  // Comisión Wompi
  wompiPercent: number;           // 2.65%
  wompiFixed: number;             // $700
  wompiSubtotal: number;          // Percent + Fixed
  wompiIVA: number;               // 19% sobre subtotal
  wompiCost: number;              // Cw - Costo total de Wompi
  wompiCostClient: number;        // Cw/2 - Lo que paga el cliente
  wompiCostProvider: number;      // Cw/2 - Lo que paga el proveedor
  
  // Margen de plataforma
  platformMargin: number;         // Mg - Ganancia de la plataforma
  platformMarginPercent: number;  // % configurado
  
  // Precios finales
  totalPrice: number;             // Pc = P + Mg + (Cw/2) - Lo que paga el cliente
  providerEarnings: number;       // Pp = P - (Cw/2) - Lo que recibe el proveedor
  platformEarnings: number;       // = Mg - Ganancia neta de la plataforma
}

class PricingService {
  private apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  /**
   * Calcula el desglose de precios con estrategia mixta
   */
  async calculatePricing(
    servicePrice: number,
    marginPercent?: number
  ): Promise<PricingBreakdown> {
    const params = new URLSearchParams({
      servicePrice: servicePrice.toString(),
    });
    
    if (marginPercent) {
      params.append('marginPercent', marginPercent.toString());
    }

    const response = await fetch(`${this.apiUrl}/pricing/calculate?${params}`);
    
    if (!response.ok) {
      throw new Error('Error calculando precios');
    }

    return response.json();
  }

  /**
   * Calcula solo el costo de Wompi
   */
  async calculateWompiCost(amount: number): Promise<{ amount: number; wompiCost: number }> {
    const response = await fetch(
      `${this.apiUrl}/pricing/wompi-cost?amount=${amount}`
    );
    
    if (!response.ok) {
      throw new Error('Error calculando costo de Wompi');
    }

    return response.json();
  }

  /**
   * Formatea el desglose para mostrar al cliente
   */
  formatBreakdownForClient(breakdown: PricingBreakdown): string {
    return `
Precio del servicio: $${breakdown.servicePrice.toLocaleString('es-CO')}
Comisión de plataforma: $${breakdown.platformMargin.toLocaleString('es-CO')}
Costo de transacción: $${breakdown.wompiCostClient.toLocaleString('es-CO')}
─────────────────────────────
TOTAL A PAGAR: $${breakdown.totalPrice.toLocaleString('es-CO')}
    `.trim();
  }

  /**
   * Calcula el desglose localmente (sin llamar al backend)
   * Útil para cálculos rápidos en UI
   */
  calculatePricingLocal(
    servicePrice: number,
    marginPercent: number = 5
  ): PricingBreakdown {
    const WOMPI_PERCENT = 0.0265;
    const WOMPI_FIXED = 700;
    const WOMPI_IVA = 0.19;
    const MIN_MARGIN = 2000;

    // Margen de la plataforma
    let platformMargin = servicePrice * (marginPercent / 100);
    if (platformMargin < MIN_MARGIN) {
      platformMargin = MIN_MARGIN;
    }

    // Calcular costo de Wompi
    const baseAmount = servicePrice + platformMargin;
    const wompiPercent = baseAmount * WOMPI_PERCENT;
    const wompiSubtotal = wompiPercent + WOMPI_FIXED;
    const wompiIVA = wompiSubtotal * WOMPI_IVA;
    const wompiCost = wompiSubtotal + wompiIVA;

    // ESTRATEGIA MIXTA
    const wompiCostClient = wompiCost / 2;
    const wompiCostProvider = wompiCost / 2;

    // Precios finales
    const totalPrice = servicePrice + platformMargin + wompiCostClient;
    const providerEarnings = servicePrice - wompiCostProvider;
    const platformEarnings = platformMargin;

    return {
      servicePrice,
      wompiPercent,
      wompiFixed: WOMPI_FIXED,
      wompiSubtotal,
      wompiIVA,
      wompiCost,
      wompiCostClient,
      wompiCostProvider,
      platformMargin,
      platformMarginPercent: marginPercent,
      totalPrice,
      providerEarnings,
      platformEarnings,
    };
  }
}

export const pricingService = new PricingService();
