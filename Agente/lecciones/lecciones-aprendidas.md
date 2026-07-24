# Lecciones Aprendidas

## 2026-06-06 — Permisos y base path en deploy de assets React

### docker cp rompe permisos para Apache
- `docker cp` copia archivos como `root:root` con `drwx------` (700) en directorios
- Apache (www-data) no puede leerlos → 403 Forbidden → pantalla blanca
- **Regla:** después de cualquier `docker cp` ejecutar `chown -R www-data:www-data` y `chmod -R 755`
- **Mejor alternativa:** usar `deploy --name <sitio> --update` (coolify-manager) que hace build dentro del container

### Vite `base` nunca debe hardcodear el nombre del directorio
- `base: '/wp-content/themes/glorytemplate/...'` falla si el theme se llama diferente en producción (`glory/`)
- **Regla:** siempre usar `base: './'` (relativo) en producción
- El CSS genera `url(./fuente.woff2)` en vez de `url(/wp-content/themes/glorytemplate/.../fuente.woff2)`
- Fix aplicado en `Glory/assets/react/vite.config.ts`

## 2026-07-24 — Framer Motion Reorder + sort por prioridad = conflicto de renders

### El drag visual y el sort automático se pisan
- `Reorder.Group` actualiza el orden visualmente al arrastrar
- Si un `useMemo` con sort (ej: `compararPorPrioridad`) se ejecuta en el siguiente render, reordena todo y el drag "rebota"
- El campo `orden` se actualiza correctamente en `reordenarTareas`, pero el sort lo sobreescribe antes de que el DOM lo refleje
- **Patrón de fix:** usar un `useRef` como flag (`skipNextSortRef`) que se activa antes del `setState` y se lee en el `useMemo` del sort. Un solo render sin sort basta para que el orden manual se estabilice.
- **Regla:** cuando combines drag & drop con sort reactivo, siempre necesitas un mecanismo para "proteger" el render post-drag del sort automático.

## 2026-07-24 — lastModified dentro del debounce = pérdida de datos al recargar

### El sync manager actualizaba `lastModified` tarde
- `useSyncManager` tenía `setSyncMeta({lastModified: Date.now()})` DENTRO del `setTimeout` de 2s
- Si el usuario recargaba antes de que el debounce se ejecutara, `lastModified` seguía siendo el valor de la sync anterior
- `performInitialSync` comparaba `lastModified <= lastSync` → false → descargaba datos del servidor → pisaba cambios locales no sincronizados
- **Patrón de fix:** actualizar `lastModified` INMEDIATAMENTE al detectar `hasChanges`, antes del debounce. El debounce solo controla el HTTP request, no la metadata de estado.
- **Regla general:** cualquier metadata que determine si hay cambios pendientes debe actualizarse en el momento del cambio, no en el momento del flush/sync. El debounce es para el envío, no para el registro del estado.
- **Segundo patrón defensivo:** al recibir datos del servidor en `setHabitos`, preservar campos locales (como `ordenEjecucion`) que el servidor no incluya. Esto protege contra race conditions y datos parciales.
