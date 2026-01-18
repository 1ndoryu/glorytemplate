# Tarea: Estandarización del Sistema Tipográfico

## Problema Actual

El proyecto tiene un grave problema de inconsistencia tipográfica:

- **+160 instancias** de `font-size` hardcodeadas en archivos CSS
- Valores arbitrarios como: `0.55rem`, `0.6rem`, `0.65rem`, `0.7rem`, `0.75rem`, `0.8rem`, `0.85rem`, `0.9rem`, `1rem`, `1.1rem`, `1.5rem`, `2rem`, `2.5rem`
- `variables.css` define familias tipográficas pero **no tamaños**
- `tipografia.css` define clases pero con valores hardcodeados internamente

**Consecuencias:**
- Dificultad para mantener consistencia visual
- Imposible ajustar el sistema tipográfico globalmente
- Cada desarrollador inventa tamaños nuevos

---

## Propuesta: Sistema de 5 Variables

### 1. Variables a Crear en `variables.css`

```css
/* === Tamaños Tipográficos === */
--nakomi-fuenteXs: 0.65rem;    /* ~10.4px - Etiquetas, badges, captions extra pequeños */
--nakomi-fuenteSm: 0.75rem;    /* ~12px - Captions, metadatos, texto auxiliar */
--nakomi-fuenteMd: 0.875rem;   /* ~14px - Texto base, cuerpo de texto normal */
--nakomi-fuenteLg: 1rem;       /* ~16px - Texto destacado, subtítulos */
--nakomi-fuenteXl: 1.25rem;    /* ~20px - Títulos de sección, headings */
```

> **Nota:** Para títulos display muy grandes (hero, etc.) se usará `clamp()` o valores específicos.

### 2. Mapeo de Valores Existentes

| Valor Actual                    | Variable Nueva         | Uso Típico             |
| ------------------------------- | ---------------------- | ---------------------- |
| `0.55rem`, `0.6rem`, `0.65rem`  | `--nakomi-fuenteXs`    | Etiquetas, badges      |
| `0.7rem`, `0.75rem`, `0.8rem`   | `--nakomi-fuenteSm`    | Captions, metadatos    |
| `0.85rem`, `0.875rem`, `0.9rem` | `--nakomi-fuenteMd`    | Texto base             |
| `1rem`, `1.1rem`                | `--nakomi-fuenteLg`    | Subtítulos, destacados |
| `1.2rem`, `1.25rem`, `1.5rem`   | `--nakomi-fuenteXl`    | Títulos                |
| `2rem+`                         | `clamp()` o específico | Títulos display/hero   |

---

## Plan de Implementación

### Fase 1: Definir Variables (5 min)
- [ ] Agregar las 5 variables en `tokens/variables.css`

### Fase 2: Actualizar `tipografia.css` (15 min)
- [ ] Reemplazar todos los valores hardcodeados por las nuevas variables
- [ ] Mantener `clamp()` para títulos display

### Fase 3: Migración por Archivos (Por Prioridad)

**Prioridad Alta (Componentes base):**
- [ ] `components/boton.css`
- [ ] `components/tarjeta.css`
- [ ] `components/etiqueta.css`
- [ ] `components/texto.css`

**Prioridad Media (Layouts del panel):**
- [ ] `layouts/panel/layout.css`
- [ ] `layouts/panel/resumen.css`
- [ ] `layouts/panel/facturas.css`
- [ ] `layouts/panel/hosting.css`
- [ ] `layouts/panel/marketplace.css`
- [ ] `layouts/panel/perfil.css`

**Prioridad Normal (Landing y otros layouts):**
- [ ] `landing.css`
- [ ] `servicios.css`
- [ ] `ui.css`
- [ ] `layouts/navegacion.css`
- [ ] `layouts/hero.css`
- [ ] `layouts/manifiesto.css`
- [ ] `layouts/portafolio.css`
- [ ] `layouts/proceso.css`
- [ ] `layouts/pedidos.css`
- [ ] `layouts/resenas.css`
- [ ] `layouts/blog.css`
- [ ] `layouts/ecosistema.css`
- [ ] `layouts/seccion-servicios.css`
- [ ] `layouts/proyecto-detalle.css`
- [ ] `layouts/ejemplos-visuales.css`
- [ ] `layouts/ejemplos-adicionales.css`

---

## Archivos Afectados (Conteo de Instancias)

| Archivo                 | Instancias Aprox. |
| ----------------------- | ----------------- |
| `servicios.css`         | 12                |
| `seccion-servicios.css` | 8                 |
| `pedidos.css`           | 7                 |
| `portafolio.css`        | 7                 |
| `resenas.css`           | 4                 |
| `proyecto-detalle.css`  | 7                 |
| `proceso.css`           | 2                 |
| `ui.css`                | 3                 |
| `panel/*.css`           | 10+               |
| Otros                   | 30+               |

---

## Criterios de Éxito

1. **Cero `font-size` hardcodeados** (excepto `clamp()` para displays)
2. Todas las instancias usan una de las 5 variables
3. Consistencia visual preservada tras la migración
4. Sistema fácil de ajustar globalmente

---

## Notas Técnicas

- Usar buscar/reemplazar con regex cuando sea posible
- Verificar visualmente cada sección tras cambios
- Si un tamaño específico es realmente necesario, documentar por qué

---

## Estado

- **Creado:** 2026-01-18
- **Estado:** Pendiente
- **Prioridad:** Alta (Deuda técnica crítica)
