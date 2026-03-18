# Colecciones — 2026-03-18

## Objetivo
Describir el sistema vigente de colecciones: lectura, edición, mezcla, jerarquía, relación con samples y problemas recientes de coherencia visual y de conteo.

## Backend
- App/Kamples/Api/Controladores/ColeccionesController.php: endpoints de lectura, detalle, slug y sugerencias.
- App/Kamples/Api/Controladores/ColeccionesCrudController.php: creación, edición, borrado, mover/agregar sample e imagen.
- App/Kamples/Api/Controladores/ColeccionesCombinarController.php: combinación de colecciones y rollback.
- App/Kamples/Database/Repositories/ColeccionesRepository.php: listado de colecciones, subcolecciones, conteos y tags agregados.
- App/Kamples/Database/Repositories/ColeccionSamplesRepository.php: fuente de verdad de la relación colección-sample y del orden interno.

## Frontend
- App/React/islands/libreria/LibreriaIsland.tsx y App/React/hooks/useLibreriaIsland.ts: librería del usuario y vistas cuadrícula/lista/árbol.
- App/React/components/social/TarjetaColeccion.tsx: tarjeta de colección y acciones rápidas.
- App/React/components/colecciones/FiltroSubcolecciones.tsx: filtro de jerarquía.
- App/React/utils/libreriaColecciones.ts: helpers de estructura, orden y persistencia local.

## Modelo funcional
- Una colección puede contener subcolecciones mediante parent_id.
- Los samples dentro de una colección tienen orden propio y posición persistida.
- El backend calcula conteos y tags agregados; el frontend no debe inventarlos.
- La combinación de colecciones registra changelog y deja material para deshacer merges.

## Flujos importantes
1. Listado del usuario: ColeccionesRepository devuelve estructura base y metadatos agregados.
2. Detalle: se consulta la colección y luego su lista de samples con el orden elegido.
3. Agregar/mover sample: la posición se calcula de forma atómica para no duplicar índices por carrera.
4. Combinar: se mueven relaciones, se registra backup y se ofrece undo dentro de la ventana soportada.

## Cambios recientes que afectan este dominio
- 173A-2 a 173A-5 dejaron coherente la búsqueda entre mis colecciones, públicas y guardadas.
- Se unificó el contador usando el total agregado del backend como fuente de verdad.
- La vista árbol fue reforzada para mantener visibles los padres aunque el match venga por una hija.
- Se expuso la colección original del sample desde backend hasta el detalle y menús contextuales.
- 173A-7 añadió el nombre del padre en la meta de la tarjeta de subcolecciones.

## Riesgos y gotchas
- Sigue pendiente investigar la inconsistencia entre conteo de tarjeta y conteo interno reportada en 183A-13.
- El flash “Esta colección aún no tiene samples” de 183A-14 apunta a una carrera entre fetch, caché o reseteo de estado en UI.
- Las jerarquías deben documentarse siempre como estructura de backend primero y vista filtrada después; si se hace al revés aparecen incoherencias.

## Regla Sentinel
- No se detectó necesidad de una regla nueva de Glory Sentinel para este dominio.
