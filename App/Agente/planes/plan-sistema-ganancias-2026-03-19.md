# Plan 183A-96 — Sistema de compra de samples y ganancias

## Estado: COMPLETADO

## Fases

### Fase 1 — Fix bug "no tiene precio" ✅
- `SamplesRepository::buscarParaDescarga()` no incluía `PRECIO` en el SELECT
- **Fix**: Agregado PRECIO y SLUG al SELECT

### Fase 2 — Revenue share 20% flat ✅
- Todos los planes: `revenue_share => 0.80` (80% creador, 20% plataforma)
- `listarPlanes()` actualizado para mostrar 80/20 en todos los planes

### Fase 3 — Tab "Ganancias" en perfil ✅
- TabGanancias.tsx: admin ve stats + transacciones, otros ven EstadoVacio
- usePerfilIsland.ts: tabs dinámicos (TABS_BASE / TABS_CON_GANANCIAS)
- PerfilIsland.tsx: render condicional por tab activa

### Fase 4 — Config PayPal email ✅
- Migración v064: `paypal_email` en usuarios_ext
- Backend: validación + normalización en PerfilController
- Frontend: sección en ConfiguracionSecciones

### Fase 5 — Datos de prueba + migraciones ✅
- 3 transacciones de prueba insertadas para user 1
- Migración v065: UNIQUE constraints para idempotencia

### Fase 6 — Auditoría de integridad ✅
Bugs encontrados y corregidos:
- **Revenue share mismatch**: listarPlanes() mostraba 50/50 y 70/30, backend calcula 80/20
- **Estado dual**: queries de ingresos solo filtraban 'completed' pero inserts usan 'completada'
  - Fix: todas las queries ahora aceptan ambos estados
  - Fix: registrarRevenueShare normalizado a ESTADO_COMPLETADA
  - Fix: datos existentes normalizados en BD
- **Race condition webhook**: sin idempotencia por stripe_payment_id
  - Fix: existeStripePaymentId() + UNIQUE index en stripe_payment_id
- **Race condition compra doble**: sin constraint en (comprador, sample)
  - Fix: UNIQUE partial index uq_compra_sample_por_usuario
- **Literal string**: 'compra_sample' reemplazado por TransaccionesEnums::TIPO_COMPRA_SAMPLE
- TO-DO futuro: success page post-checkout, AbortController en API calls, rate limiting webhook
