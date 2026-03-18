# Canciones y sampleos — 2026-03-18

## Objetivo
Documentar el dominio musical vigente: canciones, artistas, relaciones de sampleo, metadatos de extracción y búsqueda asociada.

## Backend principal
- App/Kamples/Api/Controladores/CancionesController.php: endpoints para canciones y artistas por slug.
- App/Kamples/Database/Repositories/CancionesRepository.php: consultas de canciones, artistas, género, tags, totals y youtube_id.
- App/Kamples/Database/Repositories/RelacionesSampleRepository.php: relaciones bidireccionales de sampleo entre canciones.
- App/Kamples/Database/Repositories/ColaExtraccionSamplesRepository.php: cola de extracción y pipeline técnico de audio.
- App/Kamples/Api/Helpers/NormalizadorSample.php: normalización de payloads hacia DTOs de frontend.

## Frontend principal
- App/React/components/samples/BuscadorCanciones.tsx: buscador debounced para enlazar canciones desde UI.
- Las vistas de sample detalle y menús contextuales consumen metadatos normalizados del backend.

## Modelo de datos
- Las canciones son entidades propias con artistas, roles, género, tags y metadatos externos.
- Las relaciones de sampleo viven en una tabla bidireccional; no se duplican estructuras por dirección.
- La cola de extracción produce archivos de audio y metadatos derivados como BPM, key o waveform.

## Flujos importantes
1. Búsqueda de canciones: debounce cliente, query backend, máximo de resultados acotado para UI rápida.
2. Asignación o relación de sampleo: el backend resuelve la canción fuente, la destino y la relación entre ambas.
3. Extracción: la cola coordina descarga, corte, análisis musical y persistencia de resultados.
4. Normalización: el helper backend transforma snake_case y joins complejos al formato esperado por TypeScript.

## Estado actual y pendientes
- El backend de canciones y artistas existe; la UI dedicada de artista sigue siendo una fase pendiente.
- La deduplicación del pipeline se apoya en varias capas, incluyendo restricciones únicas y upserts.
- La documentación legacy de metadata existe, pero esta versión debe considerarse la referencia v4.0 para el código actual.

## Gotchas
- No conviene documentar sampleos como si fueran solo un atributo del sample; son un dominio relacional aparte entre canciones.
- Los metadatos musicales vienen de una mezcla de scraping y análisis local, así que la fuente de cada campo puede variar.
- El normalizador backend es parte de la superficie pública real del frontend; cambios ahí impactan muchas pantallas.

## Regla Sentinel
- No se detectó necesidad de una regla nueva de Glory Sentinel para este dominio.
