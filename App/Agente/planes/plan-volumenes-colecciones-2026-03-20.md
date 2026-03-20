# Plan volúmenes colecciones — 2026-03-20

## Tarea
- 193A-10 — Funcionalidad de volúmenes en colecciones

## Objetivo
- Permitir dividir una colección raíz grande creando un nuevo volumen hijo con sufijo `Vol II`, `Vol III`, etc, moviendo aproximadamente la mitad de los samples directos de la colección original al nuevo volumen sin perder orden, jerarquía ni sincronización desktop.

## Estado verificado
- La jerarquía actual ya soporta 2 niveles mediante `parent_id`.
- El detalle de una colección raíz ya puede mostrar sus propios samples más los de sus hijas con `incluirSubcolecciones`.
- El sync desktop depende de `sync_changelog`, así que el split debe registrar `collection_created` para el nuevo volumen y `sample_removed`/`sample_added` por cada sample movido.
- La UI ya tiene patrón de operación compleja en colecciones con modal dedicado: combinar y eliminar.

## Decisiones de diseño
- Solo se permitirá dividir colecciones raíz. Las subcolecciones no podrán crear hijos porque la profundidad máxima sigue siendo 2.
- El nuevo volumen se crea como hija de la colección original usando el nombre base más `Vol {romano}`.
- El número de volumen lo elige el usuario, pero backend valida que no se repita dentro del mismo padre.
- La división se hará sobre los samples directos de la colección raíz, no sobre los heredados desde hijas existentes.
- Para evitar ambigüedad y facilitar rollback mental, se moverá la segunda mitad según el orden actual por posición de la colección, no una muestra pseudoaleatoria.

## Fases
1. Backend repositorio
- Helper para generar nombre de volumen y validar número disponible.
- Transacción que crea volumen hijo y mueve la mitad de samples directos preservando posiciones.

2. Backend HTTP
- Endpoint `POST /colecciones/{id}/crear-volumen`.
- Rate limit, validaciones, changelog y respuesta tipada.

3. Frontend
- API client para crear volumen.
- Nuevo item de menú en detalle de colección.
- Modal para elegir número de volumen y confirmar el split.
- Refresco local del detalle tras crear el volumen.

4. Documentación y validación
- Actualizar documentación de colecciones.
- Validar PHP, TypeScript y revisar que la respuesta del detalle siga mostrando padre + subcolecciones.

## Riesgos
- Si se mueven samples sin registrar changelog, el desktop puede reconstruir mal el árbol.
- Si se usa el nombre de la colección activa sin normalizar raíz/hija, podrían generarse nombres inconsistentes.
- Si se intenta dividir una colección con menos de 2 samples directos, no existe una mitad válida.