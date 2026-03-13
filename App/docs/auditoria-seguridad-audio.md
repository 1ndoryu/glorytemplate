# Auditoria de Seguridad de Audio — QQ120

Revision profunda de la seguridad del sistema de archivos de audio: anti-bot, proteccion de WAV, streaming, descargas.

---

## 1. Arquitectura de Servicio de Audio

| Capa | Metodo | Proteccion | Riesgo |
|------|--------|-----------|--------|
| **WAV original** | Streaming via PHP (token HMAC) | HMAC-SHA256 + expiracion 15min + userId | Seguro |
| **MP3 optimizado** | Acceso estatico directo | Ninguna (performance) | Enumerable |
| **Preview MP3** | Acceso estatico directo | Ninguna (discovery) | Enumerable |
| **Waveform** | URL publica | Ninguna (es una imagen) | Aceptable |
| **Registro de descarga** | REST endpoint autenticado | Plan + compra + limites diarios | Seguro |

---

## 2. Sistema de Tokens HMAC (C202)

El sistema mas robusto del stack. Cuando un usuario inicia una descarga:

1. `DescargasController::descargar()` verifica: autenticacion, plan activo, compra (si premium), limites diarios/mensuales, cuenta no baneada
2. Genera token: `base64(sampleId:userId:expira:hmac_sha256(...))`
3. Firma con `AUTH_SALT` (secreto WP, unico por instalacion)
4. Token valido 15 minutos
5. `DescargasStreamController::streamDescarga()` valida firma, expiracion, y sirve via `readfile()`

**Fortalezas:**
- HMAC-SHA256 con secreto del servidor
- Token incluye userId (no transferible entre usuarios)
- Comparacion constant-time (`hash_equals()`)
- Archivo servido via PHP (ruta nunca expuesta al cliente)
- Headers anti-cache: `no-store, no-cache, must-revalidate`
- `X-Content-Type-Options: nosniff`

**Correccion aplicada (QQ120):**
- Ahora `streamDescarga()` verifica `AuthMiddleware::verificarCuentaActiva()` antes de servir
- Antes: usuario baneado con token aun valido podia descargar hasta que el token expirara
- Ahora: ban/suspension se verifica en tiempo real al momento del streaming

---

## 3. Proteccion de WAV Originales

**Estado: SEGURO**

Los archivos WAV originales NO son accesibles directamente:
- Se sirven exclusivamente via `DescargasStreamController::streamDescarga()`
- La ruta del filesystem nunca se expone en la API (se convierte a URL HTTP via `rutaAUrl()`)
- `rutaOriginal` solo se envian al frontend cuando `esMio = true` (creador del sample)
- Incluso si alguien conoce la ruta, necesita token HMAC valido para descargar

**Proteccion adicional en NormalizadorSample:**
```php
/* C202: rutaOriginal y rutaOptimizada solo se exponen cuando el usuario es el creador */
...((bool) ($row[self::ALIAS_ES_MIO] ?? false) ? [
    'rutaOriginal'    => self::rutaAUrl($row[SamplesCols::RUTA_ORIGINAL] ?? ''),
    'rutaOptimizada'  => self::rutaAUrl($row[SamplesCols::RUTA_OPTIMIZADA] ?? ''),
] : []),
```

---

## 4. Enumeracion de Previews y MP3 Optimizados

**Estado: RIESGO MEDIO**

Las URLs de preview y waveform se exponen publicamente en la API:
- `rutaPreview`: `/wp-content/uploads/kamples/{id}/preview.mp3`
- `rutaWaveform`: `/wp-content/uploads/kamples/{id}/waveform.png`

**Riesgo:** Un bot podria enumerar IDs incrementales (1, 2, 3...) y descargar todos los previews.

**Mitigacion actual:**
- Los previews son recortes de baja calidad (30s, MP3 128kbps) — valor comercial bajo
- Son necesarios para la funcionalidad del reproductor en el feed

**Recomendaciones futuras (no criticas para MVP):**
1. Usar IDs no secuenciales (UUID/slug) en las URLs de preview en vez de IDs numericos
2. Rate limiting a nivel de web server (nginx/Apache) para archivos estaticos en `/kamples/`
3. `robots.txt` con `Disallow: /wp-content/uploads/kamples/` para prevenir indexacion

---

## 5. Anti-Bot

**Estado: NO IMPLEMENTADO**

No hay deteccion de bots en el endpoint de streaming ni en los archivos estaticos.

**Aceptable para MVP** — el token HMAC con userId vinculado previene descargas masivas automaticas (cada token requiere sesion autenticada). El riesgo real es en previews estaticos.

**Recomendaciones para escalar:**
1. Rate limiting por IP en endpoint `/descargas/stream` (ej: 10 reqs/min)
2. Honeypot: URL de preview falsa que detecta scraping automatico
3. User-Agent validation basica (bloquear UA vacios o conocidos de bots)

---

## 6. Control de Acceso por Plan

El sistema tiene control granular:
- **Free:** Limites diarios (5 descargas/dia), mensual (1 GB/mes)
- **Pro:** Limites ampliados (50 descargas/dia), mensual (10 GB/mes)
- **Premium:** Limites altos (100 descargas/dia), mensual (20 GB/mes)
- **Samples premium:** Requieren compra individual (verificacion de `yaComprado`)
- **Advisory locks:** Previenen race conditions en descargas simultaneas

---

## 7. Hallazgos y Correcciones

### Corregido en esta auditoria:

| # | Hallazgo | Severidad | Estado |
|---|----------|-----------|--------|
| 1 | Usuario baneado puede streamear con token valido | ALTA | CORREGIDO — verificacion de cuenta activa en streaming |

### Pendientes (TO-DO):

| # | Hallazgo | Severidad | Recomendacion |
|---|----------|-----------|---------------|
| 2 | Sin rate limiting en streaming | MEDIA | Implementar throttle por IP |
| 3 | Previews enumerables por ID | MEDIA | UUIDs en URLs o rate limit web server |
| 4 | Sin audit logging en streaming | BAJA | Registrar descargas para compliance |
| 5 | Sin bot detection | BAJA | Aceptable para MVP |

---

## 8. Resumen

El sistema de audio es **fundamentalmente seguro** para produccion:
- WAV protegidos por token HMAC (no adivinables, no transferibles)
- Acceso controlado por plan y compra
- Limites diarios/mensuales implementados
- Rutas de filesystem nunca expuestas al cliente
- La correccion QQ120 cierra la brecha de usuarios baneados con tokens activos

Los riesgos medianos (enumeracion de previews, rate limiting) son aceptables para MVP pero deben abordarse cuando el trafico crezca.
