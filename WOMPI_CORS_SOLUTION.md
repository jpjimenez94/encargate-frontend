# Solución al Error CORS de Wompi

## 🚨 Problema Actual

```
Access to fetch at 'https://sandbox.wompi.co/v1/merchants/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Causa:** Wompi no permite peticiones directas desde el navegador (CORS).

## ✅ Solución: Proxy desde el Backend

Las llamadas a Wompi deben hacerse desde el backend NestJS, no desde el frontend.

### Arquitectura Correcta:

```
Frontend (Next.js)
    ↓
Backend (NestJS) 
    ↓
Wompi API
```

### Implementación:

#### 1. Backend: Crear endpoint proxy

```typescript
// backend/src/wompi/wompi.controller.ts
@Post('create-nequi-transaction')
async createNequiTransaction(@Body() paymentData: any) {
  return await this.wompiService.createNequiTransaction(paymentData);
}

@Post('create-pse-transaction')
async createPSETransaction(@Body() paymentData: any) {
  return await this.wompiService.createPSETransaction(paymentData);
}

@Get('acceptance-token')
async getAcceptanceToken() {
  return await this.wompiService.getAcceptanceToken();
}
```

#### 2. Frontend: Llamar al backend

```typescript
// frontend/src/services/wompi.ts
async createNequiTransaction(paymentData: NequiPaymentData) {
  const response = await fetch(`${API_BASE_URL}/wompi/create-nequi-transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(paymentData)
  });
  
  return await response.json();
}
```

### Ventajas:

1. ✅ No hay problemas de CORS
2. ✅ Las claves de Wompi están seguras en el backend
3. ✅ Mejor control y logging
4. ✅ Puedes agregar validaciones adicionales

### Alternativa Temporal (Solo para desarrollo):

Si necesitas probar rápido, puedes usar un proxy CORS:

```typescript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/wompi/:path*',
        destination: 'https://sandbox.wompi.co/:path*'
      }
    ]
  }
}
```

Pero esto **NO es recomendado para producción**.

## 🎯 Recomendación

Mueve TODA la lógica de Wompi al backend NestJS. El frontend solo debe:
1. Recopilar datos del usuario
2. Enviar al backend
3. Recibir respuesta
4. Mostrar resultado al usuario
