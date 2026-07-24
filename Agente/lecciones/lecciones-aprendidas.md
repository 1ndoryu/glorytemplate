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
