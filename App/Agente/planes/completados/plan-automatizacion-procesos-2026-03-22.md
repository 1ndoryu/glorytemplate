# Plan 223A-3 — Automatización Extractor Audio + Scraper WhoSampled

**Fecha:** 2026-03-22
**Complejidad:** ALTA
**Estado:** En ejecución

## Contexto

Extractor de audio y scraper WhoSampled se ejecutan manualmente desde admin panel.
Se necesita ejecución automática cada hora, historial por lote, detección de errores
con auto-stop y notificación, y botones de reactivación.

## Arquitectura

### Componentes nuevos

1. **Tabla `lotes_procesamiento`** — historial por lote (no por item)
2. **`ServicioAutomatizacion.php`** — orquestador con WP Cron horario
3. **`AutomatizacionController.php`** — REST endpoints (historial, reactivar, reporte)
4. **`LotesProcesamientoRepository.php`** — acceso a datos
5. **`TabHistorialLotesAdmin.tsx`** + hook + API service — frontend admin
6. **Modificar `pipeline.py`** — reportar resultados de lote a PHP endpoint
7. **Modificar `cron_runner.py`** — soporte batch-id, reporting scraper

### Componentes modificados

- **`ProcesadorColaIA.php`** — cron 60s → 90s
- **`GestorProcesosFondo.php`** — aceptar env vars extra en `$opcionesExtra`
- **`KamplesInit.php`** — registrar crons automáticos + controller
- **`AdminPanelIsland.tsx`** — nueva tab "Historial"
- **`KamplesController.php`** — registrar AutomatizacionController

### Flujo automatización

```
WP Cron (1h) → ServicioAutomatizacion::ejecutar()
  ├─ ¿Auto-stop activo? → Skip + log
  ├─ ¿Proceso ya running? → Skip
  ├─ Crear lote en DB (estado=ejecutando)
  ├─ putenv("KAMPLES_BATCH_ID=$loteId")
  ├─ GestorProcesosFondo::iniciar(tipo, opciones)
  └─ Python termina → POST /admin/automatizacion/reporte-lote
       ├─ Actualizar lote con stats
       ├─ ¿Todos fallaron? → auto-stop + notificar admin
       └─ Reset fallos consecutivos si hubo éxitos
```

### Tabla lotes_procesamiento

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | SERIAL PK | |
| tipo | VARCHAR(20) | 'extraccion' o 'scraping' |
| estado | VARCHAR(20) | 'ejecutando', 'completado', 'error', 'detenido' |
| iniciado_at | TIMESTAMPTZ | |
| completado_at | TIMESTAMPTZ | |
| exitosos | INT | Items exitosos |
| fallidos | INT | Items fallidos |
| recortes | INT | Solo extracción |
| samples_publicados | INT | Solo extracción |
| canciones_nuevas | INT | Solo scraping |
| sampleos_nuevos | INT | Solo scraping |
| error_mensaje | TEXT | |
| metadata | JSONB | Datos extra |

### Auto-stop

- **Extracción:** Si TODOS los items de 1 lote fallan (20/20 fallos) → STOP
- **Scraping:** Si 50 items fallan consecutivamente (tracker persistente) → STOP
- En ambos casos: notificación a user_id=1 via ServicioNotificaciones

### Endpoints REST

- `GET  /admin/automatizacion/estado` — estado de automatización
- `GET  /admin/automatizacion/historial` — historial de lotes
- `POST /admin/automatizacion/reactivar/{tipo}` — reactivar proceso parado
- `POST /admin/automatizacion/reporte-lote` — Python reporta resultados

## Fases de implementación

### Fase 1: Base de datos
- [x] Migración v074
- [x] Schema PHP
- [x] Cols/Enums generados
- [x] Repository

### Fase 2: Backend PHP
- [x] ServicioAutomatizacion
- [x] AutomatizacionController
- [x] ProcesadorColaIA 60→90s
- [x] GestorProcesosFondo env vars
- [x] KamplesInit + KamplesController

### Fase 3: Python
- [ ] pipeline.py batch reporting
- [ ] cron_runner.py batch support

### Fase 4: Frontend
- [ ] TabHistorialLotesAdmin
- [ ] useHistorialLotes hook
- [ ] apiAutomatizacion service
- [ ] AdminPanelIsland nueva tab

### Fase 5: Groq validator verificación
- [ ] Confirmar rotación API en groq_validator.py
