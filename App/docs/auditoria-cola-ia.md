# Auditoría Cola de Procesamiento IA (D5b)

> Fecha: 2026-03-06 | Agente: AG-SPD

## Resumen

El sistema encola items cuando Groq devuelve 429 (rate limit) y los reprocesa via WP Cron cada 15min.

## Flujo end-to-end

```
ServicioModeracionIA / PipelineAudio
  → (429 rate limit)
  → ColaProcesamientoIaRepository::encolar()
  → INSERT estado='pendiente'
  → WP Cron cada 15min (kamples_cola_ia_cron)
  → ProcesadorColaIA::procesar()
  → marcarProcesando() (lock optimista)
  → match tipo/operacion → procesar
  → marcarCompletado() | marcarError()
```

## Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `Services/ProcesadorColaIA.php` | Cron processor, MAX 5 items/run |
| `Repositories/ColaProcesamientoIaRepository.php` | DB access, CRUD, estadisticas |
| `Controladores/ColaIaController.php` | REST endpoints admin (5 rutas) |
| `services/apiColaIa.ts` | Cliente TS para endpoints |
| `hooks/useTabColaIa.ts` | Hook del tab admin |
| `components/admin/TabColaIaAdmin.tsx` | UI del panel |

## Bugs encontrados y corregidos

### Bug 1: marcarError() — argumentos incorrectos (CRITICO)
- **Donde:** ProcesadorColaIA.php lineas 177-187
- **Problema:** Se llamaba con 4 argumentos (id, mensaje, intentos, maxIntentos) pero la firma solo acepta 3 (id, mensaje, minutosEspera). El repo gestiona intentos internamente.
- **Impacto:** TypeError en cada error → items quedan congelados en estado 'procesando' para siempre.
- **Fix:** Pasar (id, mensaje, minutosEsperaCalculados). Para rate limit: ceil(retrySegundos/60). Para otros: default 30min.

### Bug 2: listarItems() — filtro $tipo ignorado (MEDIO)
- **Donde:** ColaIaController.php L106 vs ColaProcesamientoIaRepository.php L290
- **Problema:** Controller pasaba 4 args pero el repo solo aceptaba 3 (sin $tipo). El filtro de tipo nunca funcionaba.
- **Fix:** Agregar parametro ?string $tipo a listarItems() con condicion WHERE dinamica.

### Bug 3: Sin polling en frontend (BAJO)
- **Donde:** useTabColaIa.ts
- **Problema:** Solo cargaba datos una vez al montar. El admin nunca veia actualizaciones en tiempo real.
- **Fix:** setInterval cada 15s con cleanup en return del useEffect.

## Estado actual post-fix

- Encolado: Funciona correctamente (dedup por entidad+operacion+estado)
- Procesamiento: Corregido — marcarError() ahora recibe argumentos correctos
- Lock optimista: Funciona (UPDATE WHERE estado IN pendiente/reintento)
- Filtros admin: Corregido — estado Y tipo funcionan
- Polling: Cada 15 segundos
- Reintentos: Manual (individual/masivo) + automatico via proximo_intento
- Cron: Cada 15min (WP Cron — requiere trafico para dispararse)

## Observaciones

- WP Cron es pseudo-cron (solo se ejecuta con trafico). En produccion sin trafico constante, considerar wp-cron real via sistema cron.
- MAX_ITEMS_POR_EJECUCION = 5 es conservador para free tier Groq. Ajustar si se tiene plan pago.
- Los items 'procesando' que quedaron congelados por el Bug 1 necesitan reset manual: UPDATE cola_procesamiento_ia SET estado='pendiente', intentos=0 WHERE estado='procesando'.
