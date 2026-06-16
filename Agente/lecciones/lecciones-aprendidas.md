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
