# 🇨🇴 Configuración de Wompi

## 📋 Paso 1: Obtener tus llaves de Wompi

1. Ve a https://comercios.wompi.co/
2. Inicia sesión o crea una cuenta
3. Ve a **Configuración** → **Llaves API**
4. Copia tus llaves de **Sandbox** (para pruebas)

Verás algo como:
```
Public Key: pub_test_xxxxxxxxxxxxxxxxx
Private Key: prv_test_xxxxxxxxxxxxxxxxx
Events Secret: xxxxxxxxxxxxxxxxx
```

---

## 🔧 Paso 2: Configurar variables de entorno

### Frontend (.env.local)

Abre el archivo `.env.local` en la raíz del proyecto frontend y reemplaza con tus llaves:

```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api

# Wompi Keys - Sandbox
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_TU_LLAVE_PUBLICA_AQUI
WOMPI_PRIVATE_KEY=prv_test_TU_LLAVE_PRIVADA_AQUI
WOMPI_EVENTS_SECRET=TU_SECRET_DE_EVENTOS_AQUI
```

### Backend (.env)

Abre el archivo `.env` en la raíz del proyecto backend y agrega:

```env
# Wompi Configuration
WOMPI_PUBLIC_KEY=pub_test_TU_LLAVE_PUBLICA_AQUI
WOMPI_PRIVATE_KEY=prv_test_TU_LLAVE_PRIVADA_AQUI
WOMPI_EVENTS_SECRET=TU_SECRET_DE_EVENTOS_AQUI
WOMPI_API_URL=https://sandbox.wompi.co/v1
```

---

## 💳 Paso 3: Datos de prueba

### Tarjetas de Prueba Wompi:

**Tarjeta Aprobada:**
```
Número: 4242 4242 4242 4242
CVV: 123
Fecha: Cualquier fecha futura (12/25)
Nombre: APPROVED
```

**Tarjeta Rechazada:**
```
Número: 4111 1111 1111 1111
CVV: 123
Fecha: Cualquier fecha futura
Nombre: DECLINED
```

### Nequi de Prueba:
```
Teléfono: 3001234567
```

### PSE de Prueba:
```
Banco: Banco de Prueba PSE
Tipo: Persona Natural
Documento: CC - 123456789
Usuario: prueba
Contraseña: prueba
```

---

## 🚀 Paso 4: Reiniciar servidores

Después de configurar las variables de entorno:

```bash
# Frontend
cd encargate-app
npm run dev

# Backend
cd encargate-nestjs-backend
npm run start:dev
```

---

## 🧪 Paso 5: Probar pagos

1. Reserva un servicio
2. Haz clic en "Proceder al Pago"
3. Selecciona un método de pago:
   - **Nequi**: Ingresa 3001234567
   - **PSE**: Selecciona banco y completa datos
   - **Bancolombia**: Confirma el pago
   - **Efectivo**: Sin pago online

4. Completa el pago
5. Verás la confirmación

---

## 📊 Paso 6: Ver transacciones

Ve a tu dashboard de Wompi:
- https://comercios.wompi.co/
- Sección **Transacciones**
- Verás todas las pruebas realizadas

---

## 🔄 Cambiar a Producción

Cuando estés listo para producción:

1. En Wompi, ve a **Configuración** → **Llaves API**
2. Cambia a modo **Producción**
3. Copia las nuevas llaves (sin `_test`)
4. Actualiza tus `.env` con las llaves de producción
5. Cambia `WOMPI_API_URL` a `https://production.wompi.co/v1`

---

## ⚠️ Importante

- **NUNCA** subas tus llaves privadas a GitHub
- Las llaves `_test` son solo para desarrollo
- En producción, usa variables de entorno seguras
- El archivo `.env.local` está en `.gitignore`

---

## 📞 Soporte

- Documentación: https://docs.wompi.co/
- Soporte: soporte@wompi.co
- Comunidad: https://community.wompi.co/
