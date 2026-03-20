# Prevención schema generator push — 2026-03-20

## Problema observado
La regeneración de schemas/repositorios dejó dos regresiones silenciosas en push:
- App/Config/Schema/_generated/PushSubscriptionsDTO.php perdió la columna p256dh aunque sigue existiendo en PushSubscriptionsSchema.php.
- App/Kamples/Database/Repositories/PushSubscriptionsRepository.php quedó truncado y perdió métodos custom fuera de la sección base.

## Impacto
- El registro y envío de notificaciones push puede romperse sin errores de sintaxis.
- El fallo aparece en runtime al suscribir, desuscribir o enviar push, por lo que el type-check no lo detecta.

## Regla propuesta
1. Comparar cada `App/Config/Schema/*Schema.php` contra su `App/Config/Schema/_generated/*DTO.php` y reportar columnas faltantes o extras en constructor, `desdeRow()` y `aArrayDB()`.
2. Detectar repositorios regenerados donde desaparecen métodos debajo del bloque custom o donde el archivo se reduce drásticamente respecto a su historial inmediato.
3. Marcar como error cualquier DTO generado que omita columnas usadas por `*Cols` o por servicios/controladores activos.

## Caso original
- Tarea: 193A-71
- Archivos afectados: PushSubscriptionsDTO.php, PushSubscriptionsRepository.php
- Síntoma: la APK dejó de recibir notificaciones y el usuario detectó que PushSubscriptionsDTO había cambiado.