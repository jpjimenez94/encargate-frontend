# Test Manual de Wompi - Verificación de Errores

## 🧪 Escenarios de Prueba

### Test 1: Número Inválido
**Input:** `1234567890` (cualquier número que no sea 3001234567)

**Respuesta Esperada de Wompi:**
```json
{
  "data": {
    "id": "11976423-1759202859-85539",
    "status": "ERROR",
    "status_message": "Número no válido en Sandbox"
  }
}
```

**Comportamiento Esperado:**
1. ❌ `wompiService.createNequiTransaction()` debe lanzar Error
2. ❌ Catch en checkout debe capturar el error
3. ❌ Debe mostrar toast de error
4. ❌ NO debe mostrar "Pago Exitoso"
5. ❌ NO debe redirigir a payment-success

**Logs Esperados:**
```
═══════════════════════════════════════
🔵 WOMPI RESPONSE ANALYSIS
═══════════════════════════════════════
HTTP Status: 422
Has data.error?: false
Has data.data?: true
data.data.status: ERROR
data.data.status_message: Número no válido en Sandbox
═══════════════════════════════════════
🔍 Checking transaction status: ERROR
❌ Transaction status is ERROR/DECLINED
🔴 Nequi transaction error caught: Número no válido en Sandbox
❌ Error processing payment: Error: Número no válido en Sandbox
═══════════════════════════════════════
🚨 ERROR DE PAGO DETECTADO
═══════════════════════════════════════
```

---

### Test 2: Monto Muy Bajo
**Input:** Número válido `3001234567` pero precio < $1,500

**Respuesta Esperada:**
```json
{
  "data": {
    "status": "ERROR",
    "status_message": "El monto mínimo de una transacción es $1,500"
  }
}
```

**Comportamiento Esperado:**
1. ❌ Error lanzado
2. ❌ Toast: "💰 Monto Mínimo Requerido"
3. ❌ NO redirige a success

---

### Test 3: Número Válido (Éxito)
**Input:** `3001234567` con precio >= $1,500

**Respuesta Esperada:**
```json
{
  "data": {
    "id": "xxx",
    "status": "PENDING",
    "reference": "order-id"
  }
}
```

**Comportamiento Esperado:**
1. ✅ Transacción creada
2. ✅ Toast: "Pago Pendiente"
3. ✅ Redirige a payment-pending

---

## 📋 Checklist de Verificación

Antes de decir que funciona, verificar:

- [ ] Console muestra "WOMPI RESPONSE ANALYSIS"
- [ ] Console muestra status de la transacción
- [ ] Si status = ERROR → Console muestra "❌ Transaction status is ERROR/DECLINED"
- [ ] Si status = ERROR → Console muestra "🔴 Nequi transaction error caught"
- [ ] Si status = ERROR → Console muestra "🚨 ERROR DE PAGO DETECTADO"
- [ ] Si status = ERROR → Toast de error aparece
- [ ] Si status = ERROR → NO aparece "Pago Exitoso"
- [ ] Si status = ERROR → NO redirige a payment-success
- [ ] Si status = PENDING → Redirige a payment-pending
- [ ] Si status = APPROVED → Redirige a payment-success

---

## 🔍 Cómo Probar

1. **Abrir DevTools (F12)**
2. **Ir a Console**
3. **Limpiar console (Ctrl+L)**
4. **Intentar pago con número inválido**
5. **Verificar TODOS los logs**
6. **Tomar screenshot si falla**

---

## 🐛 Si Sigue Mostrando "Pago Exitoso"

Verificar en este orden:

1. **¿El error se lanza en wompi.ts?**
   - Buscar: `❌ Transaction status is ERROR/DECLINED`
   - Si NO aparece → El problema está en wompi.ts línea 230

2. **¿El error se captura en checkout?**
   - Buscar: `🔴 Nequi transaction error caught`
   - Si NO aparece → El try-catch no está funcionando

3. **¿El error llega al catch principal?**
   - Buscar: `❌ Error processing payment`
   - Si NO aparece → El error no se está propagando

4. **¿Se muestra el toast de error?**
   - Buscar: `🚨 ERROR DE PAGO DETECTADO`
   - Si NO aparece → showError() no se está llamando

5. **¿Se está redirigiendo incorrectamente?**
   - Buscar: `router.push` en los logs
   - Si redirige a payment-success → Hay un bug en el flujo

---

## 🔧 Debugging Adicional

Si necesitas más información, agregar estos logs temporales:

```typescript
// En checkout-co/[orderId]/page.tsx línea 222
console.log('🟢 ABOUT TO CHECK STATUS:', transaction.status);
console.log('🟢 WILL REDIRECT TO:', 
  transaction.status === 'APPROVED' ? 'payment-success' :
  transaction.status === 'PENDING' ? 'payment-pending' :
  'SHOULD THROW ERROR'
);
```

---

## ✅ Criterio de Éxito

El test PASA si:
1. Número inválido → Error visible al usuario
2. NO muestra "Pago Exitoso"
3. NO redirige a payment-success
4. Muestra mensaje claro del error
5. Usuario puede intentar nuevamente
