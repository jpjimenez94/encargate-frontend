# Casos de Prueba Wompi - Todos los Métodos

## 🔵 NEQUI

### ✅ Caso Exitoso
**Input:**
- Número: `3001234567`
- Monto: >= $1,500 COP

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

**Comportamiento:**
- ✅ Redirige a `/payment-pending`
- ✅ Muestra: "Revisa tu app de Nequi"

---

### ❌ Caso Error: Número Inválido
**Input:**
- Número: Cualquier número diferente a `3001234567`

**Respuesta de Wompi:**
```json
{
  "data": {
    "id": "xxx",
    "status": "ERROR",
    "status_message": "Número no válido en Sandbox"
  }
}
```

**Comportamiento Esperado:**
- ❌ Lanza error
- ❌ Muestra toast: "Número no válido en Sandbox"
- ❌ NO redirige a payment-success

---

### ❌ Caso Error: Monto Muy Bajo
**Input:**
- Número: `3001234567`
- Monto: < $1,500 COP

**Respuesta de Wompi:**
```json
{
  "data": {
    "id": "xxx",
    "status": "ERROR",
    "status_message": "El monto mínimo de una transacción es $1,500"
  }
}
```

**Comportamiento Esperado:**
- ❌ Lanza error
- ❌ Muestra toast: "El monto mínimo es $1,500"
- ❌ NO redirige a payment-success

---

## 🟢 PSE

### ✅ Caso Exitoso
**Input:**
- Banco: Cualquier banco de la lista
- Tipo usuario: PERSON o COMPANY
- Tipo documento: CC, NIT, etc.
- Número documento: Válido

**Respuesta Esperada:**
```json
{
  "data": {
    "id": "xxx",
    "status": "PENDING",
    "redirect_url": "https://..."
  }
}
```

**Comportamiento:**
- ✅ Redirige a URL de PSE
- ✅ Usuario completa pago en banco

---

### ❌ Caso Error: Datos Inválidos
**Respuesta de Wompi:**
```json
{
  "error": {
    "messages": ["Campo inválido"]
  }
}
```

**Comportamiento Esperado:**
- ❌ Lanza error
- ❌ Muestra mensaje de error
- ❌ NO redirige

---

## 🟡 BANCOLOMBIA

### ✅ Caso Exitoso
**Input:**
- Monto válido
- Email válido

**Respuesta Esperada:**
```json
{
  "data": {
    "id": "xxx",
    "status": "PENDING",
    "redirect_url": "https://..."
  }
}
```

**Comportamiento:**
- ✅ Redirige a app de Bancolombia
- ✅ Usuario completa pago

---

## 📊 Resumen de Estados de Wompi

| Estado | Significado | Acción |
|--------|-------------|--------|
| `PENDING` | Esperando aprobación del usuario | ✅ Válido - Redirigir a payment-pending |
| `APPROVED` | Pago aprobado inmediatamente | ✅ Válido - Redirigir a payment-success |
| `ERROR` | Error en la transacción | ❌ Inválido - Mostrar error |
| `DECLINED` | Transacción rechazada | ❌ Inválido - Mostrar error |
| Cualquier otro | Estado desconocido | ❌ Inválido - Mostrar error |

---

## 🔧 Estructura de Respuesta de Wompi

### Respuesta Exitosa:
```json
{
  "data": {
    "id": "transaction-id",
    "status": "PENDING" | "APPROVED",
    "reference": "order-id",
    "redirect_url": "https://..." // Solo para PSE/Bancolombia
  }
}
```

### Respuesta con Error:
```json
{
  "data": {
    "id": "transaction-id",
    "status": "ERROR" | "DECLINED",
    "status_message": "Mensaje de error"
  }
}
```

O:

```json
{
  "error": {
    "messages": ["Error 1", "Error 2"],
    "reason": "Razón del error"
  }
}
```

---

## ✅ Lógica de Validación Correcta

```typescript
// 1. Verificar que existe data.data
if (!data.data) {
  throw new Error(data.error?.messages || 'Error');
}

// 2. Verificar que el status es válido
if (data.data.status !== 'APPROVED' && data.data.status !== 'PENDING') {
  throw new Error(data.data.status_message || 'Transacción rechazada');
}

// 3. Si llegamos aquí, es válido
return data.data;
```

---

## 🎯 Mensajes al Cliente

### Nequi:
- ✅ Éxito: "Revisa tu app de Nequi para aprobar el pago"
- ❌ Número inválido: "Número de Nequi no válido. Usa 3001234567 para pruebas"
- ❌ Monto bajo: "El monto mínimo es $1,500 COP"

### PSE:
- ✅ Éxito: Redirige automáticamente al banco
- ❌ Error: Mensaje específico del error

### Bancolombia:
- ✅ Éxito: Redirige automáticamente a la app
- ❌ Error: Mensaje específico del error
