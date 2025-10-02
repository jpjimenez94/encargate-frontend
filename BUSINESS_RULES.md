# Reglas de Negocio - Encárgate App

## 🔒 Reglas de Pago

### 1. Pago Solo Después de Aceptación del Proveedor

**Flujo:**
```
1. Cliente crea pedido → Estado: PENDING
2. Proveedor recibe notificación
3. Proveedor acepta pedido → Estado: ACCEPTED
4. Cliente recibe notificación
5. Cliente puede proceder al pago
```

**Validaciones Implementadas:**
- ✅ Checkout verifica que `orderStatus === 'ACCEPTED' || 'IN_PROGRESS'`
- ✅ Si el pedido no está aceptado, muestra error y redirige
- ✅ Mensaje: "El proveedor debe aceptar tu pedido antes de que puedas realizar el pago"

**Archivo:** `/src/app/checkout-co/[orderId]/page.tsx` líneas 73-81

### 2. No Permitir Doble Pago

**Validación:**
- ✅ Verifica `paymentStatus !== 'PAID'`
- ✅ Si ya está pagado, muestra error y redirige
- ✅ Mensaje: "Este pedido ya ha sido pagado"

**Archivo:** `/src/app/checkout-co/[orderId]/page.tsx` líneas 83-88

### 3. Proveedor No Puede Cancelar Pedidos Pagados

**Regla:**
- ❌ Proveedor NO puede cancelar si `paymentStatus === 'PAID'`
- ✅ Solo puede cancelar pedidos en estado PENDING o ACCEPTED sin pago

**Implementación Pendiente:**
- Agregar validación en página de gestión de pedidos del proveedor
- Deshabilitar botón "Cancelar" si está pagado
- Mostrar mensaje: "No puedes cancelar un pedido que ya ha sido pagado"

---

## 💬 Reglas de Chat/Mensajería

### 1. Chat Solo Hasta Completar Servicio

**Estados donde el chat está HABILITADO:**
- ✅ PENDING
- ✅ ACCEPTED
- ✅ IN_PROGRESS

**Estados donde el chat está CERRADO:**
- ❌ COMPLETED
- ❌ CANCELLED

**Archivo:** `/src/components/OrderChat.tsx` función `isChatEnabled()`

### 2. Bloqueo de Información de Contacto

**Patrones Bloqueados:**
- 📞 Números de teléfono (10 dígitos)
- 📧 Emails
- 💬 WhatsApp, Telegram, Instagram, Facebook
- 📱 Palabras: celular, teléfono, correo, email, contacto, llamar

**Validación:**
```typescript
const CONTACT_PATTERNS = [
  /\b\d{10}\b/g,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  /\bwhatsapp\b/gi,
  // ... más patrones
];
```

**Comportamiento:**
- ✅ Detecta información de contacto en tiempo real
- ✅ Bloquea el envío del mensaje
- ✅ Muestra advertencia: "El mensaje contiene información de contacto prohibida"
- ✅ Advertencia desaparece después de 5 segundos

**Archivo:** `/src/components/OrderChat.tsx` función `containsContactInfo()`

### 3. Advertencia de Seguridad

**Mensaje Visible:**
```
🔒 Por tu seguridad:
No compartas números de teléfono, emails o redes sociales.
Toda comunicación debe ser a través de esta plataforma.
```

---

## 📋 Flujo Completo del Pedido

### Paso 1: Creación del Pedido
```
Cliente → Booking → Crear Pedido
Estado: PENDING
PaymentStatus: PENDING
Botón: "📤 Enviar Pedido al Proveedor"
```

### Paso 2: Aceptación del Proveedor
```
Proveedor → Recibe Notificación
Proveedor → Acepta Pedido
Estado: ACCEPTED
Cliente → Recibe Notificación
```

### Paso 3: Pago
```
Cliente → Puede acceder a Checkout
Cliente → Selecciona Método de Pago
Cliente → Realiza Pago
PaymentStatus: PAID
Estado: IN_PROGRESS
```

### Paso 4: Ejecución
```
Proveedor → Completa Servicio
Estado: COMPLETED
Chat → Se Cierra Automáticamente
Cliente → Puede Calificar
```

---

## 🚫 Restricciones por Estado

### Estado: PENDING
- ✅ Chat habilitado
- ❌ No se puede pagar
- ✅ Proveedor puede cancelar
- ✅ Cliente puede cancelar

### Estado: ACCEPTED
- ✅ Chat habilitado
- ✅ Se puede pagar
- ✅ Proveedor puede cancelar (si no está pagado)
- ✅ Cliente puede cancelar (si no está pagado)

### Estado: IN_PROGRESS (Pagado)
- ✅ Chat habilitado
- ❌ No se puede pagar (ya pagado)
- ❌ Proveedor NO puede cancelar
- ❌ Cliente NO puede cancelar

### Estado: COMPLETED
- ❌ Chat cerrado
- ❌ No se puede pagar
- ❌ No se puede cancelar
- ✅ Cliente puede calificar

### Estado: CANCELLED
- ❌ Chat cerrado
- ❌ No se puede pagar
- ❌ No se puede cancelar

---

## 🔧 Implementaciones Pendientes

### 1. Validación de Cancelación en Proveedor
**Archivo a modificar:** `/src/app/provider-orders/page.tsx`

```typescript
const canCancelOrder = (order: Order) => {
  return order.paymentStatus !== 'PAID';
};

// En el botón de cancelar:
disabled={!canCancelOrder(order)}
```

### 2. Auto-Aceptación de Pedidos (Opcional)
**Configuración del proveedor:**
```typescript
interface ProviderSettings {
  autoAcceptOrders: boolean;
}

// Si está habilitado:
if (provider.settings.autoAcceptOrders) {
  order.status = 'ACCEPTED';
}
```

### 3. Integración del Chat en Páginas de Pedido
**Agregar en:**
- `/src/app/order/[id]/page.tsx` (Cliente)
- `/src/app/provider-orders/page.tsx` (Proveedor)

```tsx
import OrderChat from '@/components/OrderChat';

// En el componente:
{showChat && (
  <OrderChat
    orderId={order.id}
    orderStatus={order.status}
    onClose={() => setShowChat(false)}
  />
)}
```

---

## 📊 Resumen de Archivos Modificados

### Nuevos Archivos:
- ✅ `/src/components/OrderChat.tsx` - Chat con filtros
- ✅ `/BUSINESS_RULES.md` - Este documento

### Archivos Modificados:
- ✅ `/src/app/booking/[id]/page.tsx` - Crear pedido en PENDING
- ✅ `/src/app/checkout-co/[orderId]/page.tsx` - Validaciones de pago

### Pendientes de Modificar:
- ⏳ `/src/app/provider-orders/page.tsx` - Validación de cancelación
- ⏳ `/src/app/order/[id]/page.tsx` - Integrar chat
- ⏳ Backend - Endpoints de chat y validaciones

---

## 🎯 Beneficios de las Reglas

1. **Seguridad:** Protege a usuarios de fraudes y contacto fuera de plataforma
2. **Control:** Proveedor revisa antes de comprometerse
3. **Transparencia:** Cliente sabe cuándo puede pagar
4. **Protección:** No se pueden cancelar servicios ya pagados
5. **Privacidad:** Información de contacto protegida
6. **Moderación:** Chat cerrado después del servicio
