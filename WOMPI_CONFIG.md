# Configuración de Wompi para Pagos

## Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Wompi Payment Gateway (Sandbox)
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_tu_public_key_aqui
NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET=test_integrity_QXqRWUOcFOl6XZ98Ml9ber8E0LRAJ1fu
```

## Credenciales de Sandbox Actuales

**Integrity Secret (Sandbox):**
```
test_integrity_QXqRWUOcFOl6XZ98Ml9ber8E0LRAJ1fu
```

**Events Secret (Sandbox):**
```
test_events_O3hIrv2NE7FkFOmo0jRnOEmKu8H1orDp
```

## Cómo Funciona la Firma de Integridad

La firma se genera usando SHA256 con la siguiente concatenación:
```
reference + amount_in_cents + currency + integrity_secret
```

**Ejemplo:**
- Reference: `order_123`
- Amount: `5000000` (50,000 COP en centavos)
- Currency: `COP`
- Secret: `test_integrity_QXqRWUOcFOl6XZ98Ml9ber8E0LRAJ1fu`

**Concatenación:**
```
order_1235000000COPtest_integrity_QXqRWUOcFOl6XZ98Ml9ber8E0LRAJ1fu
```

**Resultado SHA256:**
```
[hash generado automáticamente por el sistema]
```

## Métodos de Pago Implementados

### 1. Nequi
- Requiere: número de celular (10 dígitos)
- Flujo: Push notification a la app de Nequi
- Estado inicial: PENDING (usuario debe aprobar)

### 2. PSE
- Requiere: banco, tipo de persona, tipo de documento, número de documento
- Flujo: Redirección al portal del banco
- Estado inicial: PENDING (redirección automática)

### 3. Bancolombia (Botón Bancolombia)
- Requiere: solo datos básicos
- Flujo: Redirección a la app de Bancolombia
- Estado inicial: PENDING (redirección automática)

### 4. Efectivo
- No requiere pago online
- Flujo: Confirmación directa del pedido
- Estado: PENDING (pago al recibir servicio)

## Testing en Sandbox

### ⚠️ IMPORTANTE: Pagos de Prueba con Nequi

**Las transacciones en SANDBOX NO aparecen en tu app real de Nequi.**

Wompi sandbox simula las transacciones, pero NO se conecta con el sistema real de Nequi. Esto significa:

- ✅ La transacción se crea correctamente en Wompi
- ✅ Recibes un `transactionId` válido
- ❌ NO verás notificación en tu app de Nequi real
- ❌ NO se debita dinero real de tu cuenta

### Números de Prueba Nequi (Sandbox):

⚠️ **CRÍTICO:** Wompi sandbox NO valida números de teléfono en tiempo real.

**Comportamiento de Wompi:**
- Wompi acepta CUALQUIER número de 10 dígitos
- La transacción queda en estado PENDING
- Luego expira o se rechaza automáticamente

**Solución Implementada:**
- ✅ Validación en el frontend ANTES de enviar a Wompi
- ✅ Solo acepta el número: `3001234567`
- ✅ Cualquier otro número → Error inmediato

**Número válido para pruebas:**
```
3001234567 - ÚNICO número aceptado en sandbox
```

**Números NO válidos:**
- Cualquier otro número será rechazado ANTES de llegar a Wompi
- Tu número real de Nequi NO funcionará en sandbox

**Para probar en sandbox:**
1. **SIEMPRE usa el número:** `3001234567`
2. La transacción quedará en estado `PENDING`
3. En sandbox, la transacción NO enviará notificación real a tu app de Nequi
4. Puedes verificar el estado en el dashboard de Wompi
5. Para aprobar: usa el dashboard de Wompi o espera el timeout automático

### Para Pagos Reales con Nequi:
1. Cambia a las credenciales de **producción** de Wompi
2. Configura tu cuenta de Nequi empresarial
3. Las notificaciones llegarán a la app real del usuario

### Bancos PSE de Prueba:
- Banco de Bogotá (código: 1001)
- Bancolombia (código: 1007)
- Davivienda (código: 1051)

## Documentación Oficial

- [Documentación Wompi](https://docs.wompi.co/)
- [API Reference](https://docs.wompi.co/docs/api)
- [Ambientes y Llaves](https://docs.wompi.co/docs/ambientes-y-llaves)

## Troubleshooting

### Error: "La firma es inválida"
- ✅ **Solución:** Verifica que el `NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET` esté configurado correctamente
- ✅ **Verificar:** El secret debe ser el de "Integridad", no el de "Eventos"

### Error: "Acceptance token inválido"
- Verifica que la `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` sea correcta
- Asegúrate de estar usando las llaves de sandbox (prefijo `pub_test_`)

### Transacción queda en PENDING
- Para Nequi: Es normal, el usuario debe aprobar en su app
- Para PSE: Verifica que se haya completado el flujo en el banco
- Para Bancolombia: Verifica que se haya completado en la app

## Migración a Producción

Cuando estés listo para producción:

1. Obtén tus llaves de producción en el dashboard de Wompi
2. Actualiza las variables de entorno:
   ```env
   NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_prod_tu_key_real
   NEXT_PUBLIC_WOMPI_INTEGRITY_SECRET=prod_integrity_tu_secret_real
   ```
3. Cambia la URL del API en `wompi.ts`:
   ```typescript
   const WOMPI_API_URL = 'https://production.wompi.co/v1';
   ```
4. Prueba exhaustivamente antes de lanzar

## Seguridad

⚠️ **IMPORTANTE:**
- Nunca expongas el `integrity_secret` en el código del cliente
- Usa variables de entorno con el prefijo `NEXT_PUBLIC_` solo para llaves públicas
- En producción, considera mover la generación de firmas al backend
- El `events_secret` debe usarse SOLO en el backend para webhooks

## Estado Actual

✅ Sistema de pagos completamente funcional
✅ Firma de integridad correctamente implementada
✅ Soporte para 4 métodos de pago
✅ Manejo de errores robusto
✅ Página de confirmación mejorada con todos los detalles
