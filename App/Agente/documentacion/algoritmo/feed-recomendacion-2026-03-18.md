# Feed y recomendación — 2026-03-18

## Objetivo
Documentar el feed actual de Kamples desde el código vigente: cómo carga, cómo pagina, cómo cachea y qué piezas participan en la recomendación y las sugerencias.

## Módulos principales
- Frontend:
  - App/React/hooks/useFeedSamples.ts: orquesta carga inicial, infinite scroll, caché persistente, virtualización y reacción a eventos CRUD.
  - App/React/components/feed/FeedSamples.tsx: render de la lista, sentinela de scroll, estados offline y pull-to-refresh.
  - App/React/hooks/useFeedFiltros.ts: filtros cliente de tags, BPM, precio y composición con el proveedor del feed.
  - App/React/utils/cacheFeedPersistente.ts: caché local page-1 con estrategia stale-while-revalidate.
  - App/React/components/feed/PanelSugerencias.tsx y ModalSugerenciasLike.tsx: superficies de recomendaciones relacionadas.
- Backend:
  - App/Kamples/Api/Controladores/SamplesController.php: endpoints de feed, búsqueda y agregados.
  - App/Kamples/Database/Repositories/SamplesRepository.php: queries de listado con FTS e índices.
  - App/Kamples/Services/MotorRecomendacion.php: cálculo del feed personalizado y similares.
  - App/Kamples/Config/algoritmoPesos.php: pesos, límites y parámetros del ranking.

## Flujo principal
1. La UI intenta hidratar page 1 desde cacheFeedPersistente.
2. Si existe caché válida o stale todavía reutilizable, se pinta al instante.
3. useFeedSamples dispara revalidación en background contra el endpoint del feed.
4. FeedSamples observa un sentinela inferior con IntersectionObserver y solicita nuevas páginas.
5. El hook usa paginación progresiva y virtualización para no renderizar listas completas largas.
6. Los eventos CRUD invalidan o actualizan el feed sin obligar a recargar toda la página.

## Caché y rendimiento
- Solo se cachea la primera página de cada variante de feed.
- TTL de revalidación corto para servir stale rápido y refrescar detrás.
- TTL máximo amplio para evitar pantallas vacías si el backend tarda o el usuario vuelve offline.
- La virtualización reduce el número de tarjetas montadas simultáneamente.
- 173A-6 reforzó el backend con stale shield en page 1 y warmup en cron para usuarios activos.

## Recomendación y búsqueda
- El ranking mezcla varias señales configuradas en algoritmoPesos.php.
- SamplesRepository usa búsqueda full-text con índices GIN para la búsqueda textual server-side.
- Las sugerencias post-like y “similares” dependen del motor de recomendación y del sample actual.

## Gotchas
- El feed ya tuvo una carrera entre cache stale y respuesta remota que provocaba flashes de estados vacíos; se mitigó con flags de primera carga y stale shield.
- Los filtros de cliente y la búsqueda server-side conviven; la documentación debe distinguir qué se resuelve en backend y qué se compone en frontend.
- Las optimizaciones de page 1 no significan que páginas posteriores estén precalentadas.

## Tareas relacionadas recientes
- 173A-6: primera página ligera con stale shield y warmup
- QL109: pull-to-refresh y estado offline Android
- QK83/QL20: búsqueda debounced y control de flashes al hidratar

## Regla Sentinel
- No se detectó necesidad de una regla nueva de Glory Sentinel para este dominio.
