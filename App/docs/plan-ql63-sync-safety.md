# QL63 — Auditoria seguridad sync upload + delete

## Hallazgos de la auditoria

### Upload confirmation: SEGURO
- Upload se confirma con HTTP 200 + JSON `{ ok: true, sample_id: number }`
- `registrarSubidaLocal()` persiste sampleId en Tauri Store ANTES de que se intente borrar
- `item.estado = 'completado'` solo despues de confirmacion exitosa
- `borrarAlSubirExitoso` solo ejecuta `remove()` DESPUES de todo lo anterior

### Delete after upload: SEGURO
- El flujo es: upload exitoso → `registrarSubidaLocal()` → `item.estado = 'completado'` → check config → `remove()`
- Si `remove()` falla: solo warning log, upload permanece como completado (non-blocking)

### Borrado bidireccional: SEGURO con mejoras
- `borrarEnServidorAlBorrarLocal`: watcher detecta `remove` → `marcarNoSincronizar()` → soft-delete al servidor
- `softDeleteEnServidor()`: si offline, encola operacion para retry

## Problemas encontrados y corregidos

### 1. Exclusion mutua (QL63)
**Problema:** `borrarAlSubirExitoso` y `borrarEnServidorAlBorrarLocal` podian estar activos simultaneamente. Aunque tecnicamente es seguro (el tracking resuelve la referencia), semanticamente son operaciones contradictorias que confunden al usuario.

**Solucion:** Exclusion mutua en `useConfiguracionSync.ts`:
- Activar `borrarAlSubirExitoso` → desactiva `borrarEnServidorAlBorrarLocal`
- Activar `borrarEnServidorAlBorrarLocal` → desactiva `borrarAlSubirExitoso`
- Defense in depth: `cargarConfigAvanzada()` en `syncState.ts` resuelve conflictos en datos persistidos

### 2. Rate-limited soft-deletes silenciosamente ignorados
**Problema:** Si el usuario borraba >50 archivos en 5 minutos, los que excedan el limite eran silenciosamente ignorados (no soft-deleted en servidor). El archivo local se borraba pero quedaba vivo en servidor.

**Solucion:** Cola de reintentos `colaBorradosPendientes[]` en `syncWatcherSetup.ts`:
- Borrados que excedan el limite se encolan (sampleId)
- Al resetear el ciclo (cada 5min), la cola se drena primero
- Warning ahora muestra que fue encolado, no ignorado

### 3. Race conditions menores (no corregidos, bajo riesgo)
- **Offline delete + re-download:** Si el usuario borra offline, re-descarga, y luego reconecta → soft-delete encolado se ejecuta sobre archivo que ahora existe localmente. Escenario muy improbable con papelera activa.
- **Upload in-flight + local delete:** Mitigado por `esMovimientoInterno()` guard.

## Archivos modificados
- `desktop/src/hooks/useConfiguracionSync.ts` — exclusion mutua en setters
- `desktop/src/services/syncWatcherSetup.ts` — cola de reintentos para rate-limited deletes
- `desktop/src/services/syncState.ts` — enforcement exclusion mutua al cargar config
