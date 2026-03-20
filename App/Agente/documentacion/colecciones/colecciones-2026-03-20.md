# Colecciones — 2026-03-20

## Objetivo
Describir el sistema vigente de colecciones: lectura, edición, mezcla, jerarquía, relación con samples y la nueva operación de volúmenes.

## Backend
- App/Kamples/Api/Controladores/ColeccionesController.php: endpoints de lectura, detalle, slug, sugerencias y registro de rutas de operaciones complejas.
- App/Kamples/Api/Controladores/ColeccionesCrudController.php: creación, edición, borrado, mover/agregar sample e imagen.
- App/Kamples/Api/Controladores/ColeccionesCombinarController.php: combinación, undo y creación de volúmenes.
- App/Kamples/Database/Repositories/ColeccionesRepository.php: listado de colecciones, subcolecciones, conteos, tags agregados y operaciones transaccionales de estructura.
- App/Kamples/Database/Repositories/ColeccionSamplesRepository.php: fuente de verdad de la relación colección-sample y del orden interno.
- App/Kamples/Database/Repositories/SyncChangelogRepository.php: contrato de sincronización desktop para altas de colección y movimientos de samples.

## Frontend
- App/React/islands/libreria/LibreriaIsland.tsx y App/React/hooks/useLibreriaIsland.ts: librería del usuario y vistas cuadrícula/lista/árbol.
- App/React/islands/colecciones/ColeccionDetalleIsland.tsx y App/React/hooks/useColeccionDetalle.tsx: detalle de colección y acciones de propietario.
- App/React/components/social/ModalCombinarColeccion.tsx: combinación de colecciones.
- App/React/components/social/ModalCrearVolumenColeccion.tsx: creación de volumen hijo desde una colección raíz.
- App/React/components/colecciones/FiltroSubcolecciones.tsx: filtro de jerarquía.
- App/React/utils/libreriaColecciones.ts: helpers de estructura, orden y persistencia local.

## Modelo funcional
- Una colección puede contener subcolecciones mediante parent_id.
- La profundidad máxima sigue siendo 2 niveles: raíz → hija.
- Los samples dentro de una colección tienen orden propio y posición persistida.
- El backend calcula conteos y tags agregados; el frontend no debe inventarlos.
- La combinación de colecciones registra changelog y deja material para deshacer merges.
- Los volúmenes son subcolecciones hijas creadas desde una colección raíz; la raíz conserva su nombre base y las hijas usan sufijo `Vol {romano}`.

## Flujos importantes
1. Listado del usuario: ColeccionesRepository devuelve estructura base y metadatos agregados.
2. Detalle: se consulta la colección y luego su lista de samples con el orden elegido.
3. Agregar/mover sample: la posición se calcula de forma atómica para no duplicar índices por carrera.
4. Combinar: se mueven relaciones, se registra backup y se ofrece undo dentro de la ventana soportada.
5. Crear volumen: sobre una colección raíz, se crea una hija con nombre de volumen y se mueve la mitad final de los samples directos preservando orden y changelog.

## Volúmenes
- Endpoint: `POST /colecciones/{id}/crear-volumen`.
- Solo aplica a colecciones raíz; una subcolección no puede crear hijas porque rompería la profundidad máxima.
- El usuario elige el número de volumen y backend valida que no se duplique dentro del mismo padre.
- La división actúa solo sobre los samples directos de la raíz, no sobre los heredados desde hijas existentes.
- El sync recibe `collection_created` para la nueva subcolección y `sample_removed`/`sample_added` por cada sample movido.

## Cambios recientes que afectan este dominio
- 173A-2 a 173A-5 dejaron coherente la búsqueda entre mis colecciones, públicas y guardadas.
- Se unificó el contador usando el total agregado del backend como fuente de verdad.
- La vista árbol fue reforzada para mantener visibles los padres aunque el match venga por una hija.
- Se expuso la colección original del sample desde backend hasta el detalle y menús contextuales.
- 173A-7 añadió el nombre del padre en la meta de la tarjeta de subcolecciones.
- 183A-13 corrigió el detalle para recalcular `total_items` y `total_samples` desde los samples realmente cargados cuando el payload incluye subcolecciones o vistas expandidas.
- 183A-14 desactivó el refresco automático del feed dentro del detalle de colección y evita que un fallo transitorio del proveedor se pinte como colección vacía.
- 183A-15 añadió el guardado rápido en TarjetaColeccion reutilizando el bookmark del detalle, con estado `esta_guardada` en explorar y guardado optimista en la UI.
- 183A-16 eliminó el segundo fetch del breadcrumb: el detalle de subcolección ahora trae `coleccion_padre` en el mismo payload inicial.
- 193A-10 añadió volúmenes como subcolecciones hijas creadas por operación transaccional desde el detalle de la colección raíz.

## Riesgos y gotchas
- El detalle no debe confiar en campos agregados viejos si ya recibió `samples`; en ese caso el total visible debe salir del array normalizado.
- El `FeedSamples` reutilizado dentro de una colección no debe usar el mismo refresco por visibilidad/polling que el feed general, porque una caída puntual del proveedor produce flashes de vacío.
- Las jerarquías deben documentarse siempre como estructura de backend primero y vista filtrada después; si se hace al revés aparecen incoherencias.
- El split de volumen no debe tocar samples heredados de hijas existentes; si lo hace, mezcla semánticas de volumen y subcolección manual.
- El nombre del volumen debe generarse en backend y validarse por jerarquía, no por simple coincidencia global de nombre.

## Regla Sentinel
- No se detectó una regla nueva específica para este dominio. El riesgo principal sigue siendo de integridad transaccional y sincronización, no de un patrón estático simple.