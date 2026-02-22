# Sistema de Monetización — Kamples

> Última actualización: sesión AG-FIX  
> Fuentes: StripeService.php, PagosController.php, ConnectController.php, DescargasController.php, TransaccionesRepository.php, PlanesIsland.tsx

---

## Resumen

Kamples monetiza mediante **suscripciones recurrentes** (Stripe Billing) y **revenue share** a creadores (Stripe Connect Express). Los creadores ganan una fracción de cada descarga realizada por usuarios de pago. La plataforma retiene una comisión variable según el plan del descargador.

---

## Planes de Suscripción

| | **Free** | **Pro** | **Premium** |
|---|---|---|---|
| Precio mensual | $0 | $5.00 | $19.99 |
| Precio anual | — | $50.00 (10 meses) | $199.90 (10 meses) |
| Descargas/día | 5 | 50 | Ilimitadas (`-1`) |
| Transferencia/mes | 1 GB | 10 GB | 50 GB |
| Subidas/mes | Ilimitadas | Ilimitadas | Ilimitadas |
| Revenue share | Sin monetización | 70% creador / 30% plataforma | 80% creador / 20% plataforma |
| Prueba gratuita | 30 días (20 desc/día) | — | — |

- **Descuento anual:** equivale a 10 meses (ahorro de 2 meses, ~17%).
- **Precios definidos en:** `StripeService::PLANES` (backend) y vars de entorno `STRIPE_PRICE_PRO` / `STRIPE_PRICE_PREMIUM` (IDs de Stripe).
- **Discrepancia conocida:** el endpoint público `GET /pagos/planes` expone precios distintos a los de `PLANES` (ej: Pro muestra $9.99 en API pública vs $5.00 en backend). El frontend PlanesIsland muestra $5.

---

## Revenue Share — Cómo Ganan los Creadores

### Fórmula de Cálculo

```
descargasBaseEstimadas = 200
montoPorDescarga = precioMensualPlan / 200
pagoCreador = montoPorDescarga × revenueShare
comisionPlataforma = montoPorDescarga × (1 - revenueShare)
```

### Ejemplos Concretos

| Plan del descargador | Precio | Monto/descarga | Creador recibe | Plataforma retiene |
|---|---|---|---|---|
| **Pro** ($5, 70%) | $5.00 | $0.025 | $0.0175 | $0.0075 |
| **Premium** ($19.99, 80%) | $19.99 | ~$0.0999 | ~$0.0800 | ~$0.0200 |
| **Free** | $0 | $0 | $0 | $0 |

### Condiciones para que se registre revenue share

1. El descargador tiene plan de pago (no free — precio > 0)
2. El sample pertenece a **otro** creador (descargar tu propio sample no genera pago)
3. La transacción se registra en tabla `transacciones` con tipo `'descarga'`
4. Aplica tanto a descargas individuales como ZIP de colecciones (`DescargasZipController`)

### Qué NO consume créditos de descarga

- Descargar tu propio sample
- Re-descargar un sample que ya descargaste previamente

### Créditos Bonus

- Cada sample que un usuario **sube** otorga +1 crédito bonus de descarga
- Límite efectivo diario = límite del plan + créditos bonus acumulados
- Implementado en `SamplesUploadController` al confirmar upload exitoso

---

## Stripe Integration

### Productos Stripe Utilizados

| Producto | Uso |
|---|---|
| **Stripe Billing** | Suscripciones recurrentes (checkout sessions, customer portal) |
| **Stripe Connect Express** | Onboarding de creadores + transferencias de revenue share |
| **Stripe Webhooks** | Sincronización de estados (suscripción activa/cancelada, cuenta Connect) |

### Variables de Entorno Requeridas

```
GLORY_STRIPE_SECRET_KEY / STRIPE_SECRET_KEY
GLORY_STRIPE_WEBHOOK_SECRET / STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_PRO          # Price ID de Stripe para plan Pro
STRIPE_PRICE_PREMIUM      # Price ID de Stripe para plan Premium
```

### Endpoints API

#### Pagos (suscripciones)

| Endpoint | Método | Auth | Función |
|---|---|---|---|
| `/pagos/checkout` | POST | Sí | Crea Checkout Session de Stripe |
| `/pagos/portal` | POST | Sí | Genera link al Customer Portal |
| `/pagos/webhook` | POST | No (público) | Recibe webhooks de Stripe |
| `/pagos/planes` | GET | No | Información pública de planes |

#### Connect (creadores)

| Endpoint | Método | Auth | Función |
|---|---|---|---|
| `/connect/onboarding` | POST | Sí | Crea cuenta Express en Stripe |
| `/connect/estado` | GET | Sí | Estado actual de la cuenta Connect |
| `/connect/dashboard` | POST | Sí | Login link al Express Dashboard |
| `/connect/balance` | GET | Sí | Balance disponible y pendiente |

### Webhooks Procesados

| Evento | Acción |
|---|---|
| `checkout.session.completed` | Activa suscripción, actualiza plan en BD, notifica al usuario |
| `customer.subscription.updated` | Sincroniza plan según lookup_key (`pro`/`premium`) |
| `customer.subscription.deleted` | Degrada a plan Free |
| `account.updated` | Actualiza estado Connect del creador |

---

## Flujo Completo: De Descarga a Pago

```
1. ONBOARDING CREADOR
   Creador → POST /connect/onboarding → Stripe crea cuenta Express
   Creador completa verificación en Stripe → webhook account.updated

2. SUSCRIPCIÓN DESCARGADOR
   Usuario → POST /pagos/checkout → Stripe Checkout Session
   Usuario paga → webhook checkout.session.completed → plan actualizado en BD

3. DESCARGA CON REVENUE SHARE
   Usuario (plan Pro/Premium) descarga sample de otro creador
   → DescargasController verifica:
     a. Advisory lock (previene race condition TOCTOU en créditos)
     b. Límite diario no excedido (plan + bonus)
     c. Límite de transferencia GB/mes no excedido
     d. Sample premium requiere plan Pro+
   → Genera token HMAC firmado (30 min) para streaming seguro
   → Registra en tabla transacciones (TransaccionesRepository::registrarRevenueShare)
   → Calcula: montoPorDescarga, pagoCreador, comisionPlataforma

4. TRANSFERENCIA A CREADOR
   StripeService::transferirACreador() existe como método
   (pendiente: mecanismo batch/cron para ejecutar transferencias automáticas)

5. CONSULTA DE BALANCE
   Creador → GET /connect/balance → balance disponible/pendiente desde Stripe
   Creador → POST /connect/dashboard → accede a Express Dashboard para payouts
```

---

## Tracking de Pagos — Tabla `transacciones`

### Columnas Principales

| Columna | Tipo | Descripción |
|---|---|---|
| `comprador_id` | int | Usuario que descargó |
| `creador_id` | int | Dueño del sample |
| `sample_id` | int | Sample descargado |
| `tipo` | text | Tipo de transacción (`'descarga'`) |
| `monto` | decimal | Monto total de la transacción |
| `pago_creador` | decimal | Porción para el creador |
| `comision_plataforma` | decimal | Porción para la plataforma |
| `estado` | text | Estado (`TransaccionesEnums::ESTADO_COMPLETED`) |

### Queries de Dashboard (optimizadas)

- `ingresosDashboard()` — 1 query con `SUM() FILTER()` para mes actual, anterior y total
- `ingresosGrafico()` — Agrupado por día, whitelist de intervalos (7/30/90/365 días)
- `listarDelCreador()` — JOIN con samples y usuarios para tabla detallada

---

## Seguridad de Descargas

| Mecanismo | Descripción |
|---|---|
| **Advisory Lock** | `UsuariosExtRepository::advisoryLock` previene TOCTOU en verificación de créditos |
| **HMAC Streaming** | Token firmado temporal (30 min) para servir archivos WAV |
| **.htaccess** | Bloquea acceso directo a WAV/MP3 |
| **Limit checks** | Doble verificación: descargas/día + transferencia GB/mes |

---

## Frontend — PlanesIsland

- **Vista:** Modal con tarjetas de planes, toggle mensual/anual
- **Hook:** `usePlanesIsland.tsx` — lógica de checkout y portal
- **Service:** `apiPagos.ts` — funciones tipadas para interacción con API
- **Detección checkout exitoso:** parámetro URL `?checkout=exito`
- **Filtro actual:** solo muestra plan Pro en la vista (`PLANES.filter(plan => plan.id === 'pro')`)

---

## Pendientes / TO-DOs

1. **Transferencias automáticas:** `StripeService::transferirACreador()` existe pero no se llama automáticamente. Falta mecanismo batch/cron para ejecutar transferencias periódicas a creadores.
2. **Discrepancia precios API:** `GET /pagos/planes` expone precios distintos a `StripeService::PLANES`. Unificar fuente de verdad.
3. **Enum tipo transacción:** El valor `'descarga'` está hardcodeado en código. Crear `TransaccionesEnums::TIPO_DESCARGA` si no existe.
4. **Tab monetización admin:** Ingresos Stripe por período, top creadores, desglose por plan (roadmap C321).
5. **Venta directa:** roadmap menciona "marketplace híbrido (suscripción + venta directa + revenue share)" pero venta directa no está implementada.
6. **Plan Premium en PlanesIsland:** actualmente filtrado, solo se muestra Pro.

---

## Gotchas

- **Free "50/50":** La API pública dice revenue share 50/50 para Free, pero el backend calcula $0 (precio = 0). En la práctica, Free no genera revenue share.
- **Samples premium:** un sample marcado como premium solo puede descargarse por usuarios Pro+. El creador siempre puede descargar los suyos.
- **Créditos bonus ilimitados:** no hay cap en créditos bonus acumulados. Un usuario que suba mucho contenido puede acumular descargas extras significativas.
- **SSL obligatorio:** Para APIs de pago, `CURLOPT_SSL_VERIFYPEER = true` y `CURLOPT_SSL_VERIFYHOST = 2` deben estar explícitos (varía según distribución PHP/Docker).
