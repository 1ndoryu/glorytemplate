# Plan i18n Kamples — 183A-111
**Fecha:** 2026-03-19  
**Estado:** Planificación completada, pendiente ejecución

---

## 1. Escala del Esfuerzo

### Frontend React (App/React/)
| Categoría | Cantidad aprox. | Descripción |
|-----------|----------------|-------------|
| Archivos TSX con texto español en JSX | ~85 | De 215 .tsx totales |
| Archivos TS con lógica (hooks, stores, utils, services) | ~309 | Muchos tienen strings en toast/error |
| Matches de texto español en JSX (`>Texto<`) | ~7,300 | Labels, títulos, párrafos, botones |
| Toast messages (`toast.error`/`toast()`) | ~137 | Error/éxito/info distribuidos en hooks y utils |
| Placeholders | ~105 | En inputs, búsquedas, formularios |
| aria-labels | ~198 | Accesibilidad |
| title= attributes | ~80 | Tooltips |
| Páginas legales (Privacidad, Términos) | 210 líneas | Texto largo legal |
| Landing pública | ~100 líneas | CTA, descripciones marketing |

### Frontend Mezclador (DAW)
| Categoría | Cantidad aprox. |
|-----------|----------------|
| Archivos con texto español | ~15-20 | 
| Strings (mayormente técnicos) | ~50-80 |

### Frontend Desktop (Tauri sync panel)
| Categoría | Cantidad aprox. |
|-----------|----------------|
| Archivos con texto español | ~10-15 |
| Strings (configuración, diagnóstico) | ~40-60 |

### Backend PHP (App/Kamples/Api/)
| Categoría | Cantidad aprox. |
|-----------|----------------|
| Controladores PHP | 83 |
| Líneas con `'error' =>` | ~641 |
| Mensajes user-facing en español | ~200-300 (muchos son técnicos/logs) |
| Helpers con errores centralizados | 3 (Validador, RateLimiter, UsuarioHelper) |

### Resumen
- **Frontend total:** ~1,200-1,500 strings únicos estimados
- **Backend user-facing:** ~200-300 strings
- **Total estimado:** ~1,500-1,800 strings traducibles
- **Mecanismo i18n existente:** NINGUNO
- **Detección de idioma existente:** NINGUNA

---

## 2. Recomendación de Librería

### Elegida: Solución custom ligera (JSON + hook `useT`)

**¿Por qué NO react-i18next o similar?**
- El proyecto usa React Islands (no SPA clásica), cada isla se hidrata independientemente
- No hay bundler centralizado a nivel de app — Glory Framework maneja los islands via PHP
- react-i18next agrega ~12KB gzipped + sus dependencias, complejidad innecesaria
- El proyecto ya tiene un patrón de Zustand stores para estado global

**Enfoque recomendado:**
1. **Un JSON por idioma** (`es.json`, `en.json`) con keys organizadas por dominio
2. **Un hook `useT()`** que lee el idioma del store global y retorna la función `t(key, params?)`
3. **Un store `idiomaStore.ts`** (Zustand) que persiste el idioma en localStorage
4. **Detección automática** via `navigator.language` al primer load
5. **Para PHP:** un helper `T::get('key', $lang)` que lea el mismo JSON o un array PHP equivalente

### Estructura de keys
```json
{
  "nav.buscar": "Search...",
  "nav.inicio": "Home",
  "auth.login": "Log in",
  "auth.registro": "Sign up",
  "sample.descargar": "Download",
  "sample.limite": "You've reached the download limit",
  "error.red": "Network error",
  "error.interno": "Internal server error",
  "planes.pro": "Pro",
  "legal.privacidad.titulo": "Privacy Policy"
}
```

Ventajas:
- 0 dependencias externas
- ~2KB total de código i18n
- Tree-shakeable, islands-friendly
- Mismo sistema para web, desktop (Tauri) y mobile (Capacitor)
- JSON cargable lazy si se quiere (solo el idioma activo)

---

## 3. Detección de Idioma del Navegador

```typescript
/* Detectar idioma del navegador y persistir en localStorage */
function detectarIdioma(): 'es' | 'en' {
  const guardado = localStorage.getItem('kamples_idioma');
  if (guardado === 'es' || guardado === 'en') return guardado;
  
  const nav = navigator.language || navigator.languages?.[0] || 'es';
  return nav.startsWith('en') ? 'en' : 'es';
}
```

- Español es el **fallback** por defecto (la base actual del producto)
- Solo 2 idiomas iniciales: `es` y `en`
- El usuario puede cambiar manualmente desde Configuración
- Se persiste en `localStorage` y se sincroniza via Zustand

---

## 4. Plan de Fases

### Fase 0 — Infraestructura i18n (base)
- Crear `App/React/utils/i18n/` con:
  - `idiomaStore.ts` — Zustand store con detección automática
  - `useT.ts` — Hook que retorna `t(key, params?)`
  - `es.json` — Traducciones español (el idioma actual)
  - `en.json` — Traducciones inglés
- Crear `App/Kamples/I18n/` con:
  - `T.php` — Helper PHP para traducción server-side
  - `es.php` / `en.php` — Arrays de traducciones
- Agregar selector de idioma en ConfiguracionSecciones.tsx
- **Entregable:** Infraestructura funcional, 0 strings migrados

### Fase 1 — Migración: Componentes de alta visibilidad
Prioridad por impacto visual al usuario:
1. **Layout** — TopBar, NavPublico, LayoutPrincipal, MenuContextual (~30 strings)
2. **Auth** — Login, Registro (~20 strings)
3. **Landing** — LandingPublica (~40 strings)
4. **Feed** — InicioIsland, FeedSamplesIsland (~25 strings)
5. **Toasts de error** — Centralizar todos los toast.error en keys (~137 calls → ~60 strings únicos)
- **Entregable:** Navegación y flujo principal bilingüe

### Fase 2 — Migración: Interacción social y samples
1. **Sample cards** — TarjetaSample, SampleDetalle (~40 strings)
2. **Colecciones** — ColeccionDetalle, ModalColeccion, ModalSeleccionColeccion (~30 strings)
3. **Social** — Publicaciones, Comentarios, Chat (~50 strings)
4. **Modales** — Reportar, Corregir IA, Géneros, Combinar (~40 strings)
5. **Configuración** — ConfiguracionSecciones, EditarPerfil (~50 strings)
- **Entregable:** Toda interacción social bilingüe

### Fase 3 — Migración: Áreas secundarias
1. **Planes/suscripción** — PlanesIsland (~15 strings)
2. **Admin** — AdminPanel, DashboardCreador (~40 strings)
3. **Librería** — Descargas, Favoritos, Explorador (~25 strings)
4. **Legal** — Privacidad, Términos (~contenido largo, separar en archivos dedicados)
5. **Blog** — Artículos, editor (~20 strings)
6. **Mensajes** — Chat flotante (~10 strings)
- **Entregable:** Toda la web bilingüe

### Fase 4 — Backend PHP
1. Mapear las ~200-300 strings user-facing de los 83 controladores
2. Reemplazar strings hardcoded por `T::get('key')`
3. Detectar idioma del request via header `Accept-Language` o param `?lang=`
4. Los helpers centralizados (Validador, RateLimiter, UsuarioHelper) primero
- **Entregable:** Errores de API bilingües

### Fase 5 — Desktop y Mezclador
1. Desktop (Tauri sync): ~40-60 strings en configuración/diagnóstico
2. Mezclador (DAW): ~50-80 strings (muchos técnicos como "BPM", "Snap", etc.)
- **Entregable:** Todas las plataformas bilingües

### Fase 6 — QA y pulido
1. Revisar todos los textos en inglés con native speaker o IA
2. Verificar que ningún string quedó sin migrar (Code Sentinel rule)
3. Verificar truncamiento de UI (inglés suele ser más largo que español)
4. Testing en las 3 plataformas (web, desktop, mobile)
- **Entregable:** i18n completo y pulido

---

## 5. Consideraciones Técnicas

### Interpolación
```typescript
// t('sample.limite_diario', { limite: 50 })
// en.json: "You've reached the daily limit of {limite} downloads"
// es.json: "Has alcanzado el límite diario de {limite} descargas"
```

### Pluralización (si se necesita)
```typescript
// t('sample.descargados', { count: 3 })
// en.json: { "one": "{count} download", "other": "{count} downloads" }
```

### Textos largos (legal)
- Separar en `es-legal.json` / `en-legal.json` 
- Cargar lazy solo cuando se visita la página

### Code Sentinel
- Crear regla para detectar strings en español hardcoded en JSX/TSX
- Prevenir regresiones post-migración

### SEO
- Las metadescripciones y Open Graph se generan en PHP (RuntimeSeoData)
- Agregar `lang` attribute en `<html>` basado en idioma detectado
- Hreflang alternates si se quiere SEO bilingüe (futuro)

---

## 6. Costo Estimado

| Recurso | Detalle |
|---------|---------|
| Dependencias nuevas | 0 (solución custom) |
| Tamaño del bundle | +2-5KB (JSONs + hook) |
| Archivos a tocar | ~120-150 (React) + ~50 (PHP) |
| Strings a traducir | ~1,500-1,800 |

---

## 7. Orden de Ejecución Recomendado

1. **Fase 0** primero (infraestructura) — es prerequisito de todo
2. **Fase 1** inmediato después — valida el enfoque con los componentes más visibles
3. **Fase 4** puede parallelizarse con Fase 2-3 (PHP es independiente)
4. **Fase 5** al final (desktop/DAW son plataformas secundarias)
5. **Fase 6** como cierre
