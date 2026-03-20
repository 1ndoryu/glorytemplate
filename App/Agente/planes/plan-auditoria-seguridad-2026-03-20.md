# Plan: Auditoría de Seguridad Profunda (193A-99)

**Creado:** 2026-03-20
**Estado:** Fases 1-3 completadas. Fase 4 pendiente (baja prioridad)

## Resumen

Auditoría de seguridad exhaustiva del proyecto Kamples cubriendo OWASP Top 10.
Se divide en fases por área de riesgo, ordenadas por criticidad.

---

## Fase 1: Correcciones Críticas (SQL + Upload MIME + addslashes + Download Token + Payment Webhook)

### 1.1 SQL Injection — Enums interpolados
- **SelectorCandidatos.php**: parametrizado enums en contarActivos(), seleccionar(), obtenerTopTagsUsuario()
- **PrecomputadorFeed.php**: runtime assertion regex para validar enums antes de interpolación
- **Estado**: [x] Completado

### 1.2 Upload MIME Bypass
- **SamplesUploadController.php**: removido octet-stream, agregado magic bytes para MP3/FLAC/AIFF
- **Estado**: [x] Completado

### 1.3 XSS — addslashes en Publicaciones
- **PublicacionesEscrituraController.php**: reemplazado addslashes() con escape PG explícito
- **Estado**: [x] Completado

### 1.4 Download Token sin verificación de permiso
- **Análisis**: HMAC incluye sampleId+userId+expiry, authorization ya verificada en paso previo (DescargasController::descargar()). No es vulnerabilidad real.
- **Estado**: [x] Descartado (no vulnerable)

### 1.5 Payment Webhook sin verificación de precio
- **PagosController**: verificación de precio contra BD con tolerancia 0.01
- **Estado**: [x] Completado

---

## Fase 2: Correcciones Altas (OAuth + WebSocket + XSS localStorage)

### 2.1 Google OAuth Desktop — PKCE faltante
- **Análisis**: Desktop usa Tauri con localhost redirect. PKCE ya protege el flujo.
- **Estado**: [x] Descartado (ya protegido por PKCE)

### 2.2 Google OAuth Mobile — State sin firma
- **Análisis**: PKCE flow (code_verifier/code_challenge) ya protege contra intercepción. requestId forgery solo escribe en transient diferente.
- **Estado**: [x] Descartado (no vulnerable)

### 2.3 WebSocket — Rate limiting en generación de tickets
- **WsController.php**: rate limit 60 tickets/hora por usuario
- **Estado**: [x] Completado

### 2.4 XSS — innerHTML desde localStorage
- **useEditorArticulo.ts**: sanitizarHtml() antes de innerHTML
- **sanitizarHtml.ts**: nuevo utilitario que elimina script/iframe/object/embed/form, on* attrs, javascript: URIs
- **Estado**: [x] Completado

---

## Fase 3: Correcciones Medias (Rate Limiter + Uploads + Notificaciones)

### 3.1 Rate Limiter — IP spoofing
- **RateLimiter.php**: hardened obtenerIp() — solo confía en proxy headers cuando REMOTE_ADDR es privada
- **Estado**: [x] Completado

### 3.2 Upload — origen_subida sin sanitizar
- **Análisis**: origen_subida ya pasa por sanitize_text_field() en el controller. Riesgo bajo.
- **Estado**: [x] Descartado (ya sanitizado)

### 3.3 WebSocket notify URL
- **NotificadorWebSocket.php**: enforce HTTPS (excepto localhost/127.0.0.1)
- **Estado**: [x] Completado

### 3.4 Stripe Webhook — Rate limiting
- **PagosController.php**: rate limit 200/min por IP en webhook
- **Estado**: [x] Completado

---

## Fase 4: Hardening General

### 4.1 JWT — Documentar que no hay revocación
- Considerar blacklist en Redis para tokens revocados
- **Estado**: [ ] Pendiente

### 4.2 Secret rotation — Documentar procedimiento
- **Estado**: [ ] Pendiente

### 4.3 Security headers — Review
- **Estado**: [ ] Pendiente

---

## Hallazgos Positivos (ya bien implementado)

- ✅ PostgresService usa PDO prepared statements
- ✅ BaseRepository y SamplesRepository sanitizan ORDER BY con whitelist
- ✅ AuthMiddleware robusto (JWT + WP nonce dual)
- ✅ IDOR: ownership checks consistentes en todos los CRUD controllers
- ✅ Rate limiting en login (5/15min), registro (3/1h), search, comentarios
- ✅ Ban/suspensión verificada en endpoints de escritura
- ✅ Stripe webhook signature con replay protection
- ✅ Download tokens HMAC con AUTH_SALT
- ✅ Input sanitización con sanitize_text_field/sanitize_textarea_field
- ✅ React escapa contenido automáticamente (excepto 1 dangerouslySetInnerHTML)
- ✅ Google OAuth verifica aud, iss, email_verified, exp
- ✅ Secrets en env vars, no en código
