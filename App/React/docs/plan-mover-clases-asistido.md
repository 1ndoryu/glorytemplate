# Plan: Mejorar Asistencia Visual del Drag & Drop

> **Fecha:** 2026-01-18  
> **Estado:** ✅ Completado  
> **Prioridad:** Alta

---

## 1. Objetivo

Mejorar la experiencia de arrastrar clases entre días añadiendo **asistencia visual clara** que indique:
- Que se está arrastrando una clase
- Dónde se puede soltar (días válidos)
- Sobre qué día está el cursor actualmente
- Preview de dónde quedará la clase

---

## 2. Mejoras Visuales Propuestas

### 2.1 Al iniciar arrastre

- [x] Todos los días se resaltan como zonas de drop válidas
- [x] Añadir borde punteado o fondo sutil a cada columna de día
- [x] La clase original se vuelve semi-transparente (ya implementado con `opacity: 0.5`)

### 2.2 Durante el arrastre (hover sobre día)

- [x] El día sobre el que está el cursor se resalta más intensamente
- [x] Mostrar texto indicador: "Soltar aquí" o indicador visual (+)
- [x] Cambiar color de fondo del día destino (ej: azul claro)
- [ ] Opcional: mostrar preview de la tarjeta en la posición final

### 2.3 Overlay de la clase arrastrada

- [x] Mantener el overlay actual con rotación sutil
- [x] Añadir sombra más pronunciada
- [x] Cursor: `grabbing`

---

## 3. Estados Visuales

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ESTADO NORMAL                                                               │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│ │   LUN   │  │   MAR   │  │   MIÉ   │  │   JUE   │  │   VIE   │            │
│ │ [Clase] │  │ [Clase] │  │         │  │ [Clase] │  │         │            │
│ │ [Clase] │  │         │  │         │  │         │  │         │            │
│ └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ARRASTRANDO (todos los días resaltados)                                     │
│ ┌─ ─ ─ ─ ─┐  ┌─ ─ ─ ─ ─┐  ┌─ ─ ─ ─ ─┐  ┌─ ─ ─ ─ ─┐  ┌─ ─ ─ ─ ─┐            │
│ │   LUN   │  │   MAR   │  │   MIÉ   │  │   JUE   │  │   VIE   │            │
│ │ [Clase] │  │░░░░░░░░░│  │         │  │ [Clase] │  │         │            │
│ │░[orig]░░│  │         │  │         │  │         │  │         │   🃏       │
│ └─ ─ ─ ─ ─┘  └─ ─ ─ ─ ─┘  └─ ─ ─ ─ ─┘  └─ ─ ─ ─ ─┘  └─ ─ ─ ─ ─┘  (overlay) │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ HOVER SOBRE DÍA DESTINO (MIÉ resaltado intenso)                             │
│ ┌─ ─ ─ ─ ─┐  ┌─ ─ ─ ─ ─┐  ╔═════════╗  ┌─ ─ ─ ─ ─┐  ┌─ ─ ─ ─ ─┐            │
│ │   LUN   │  │   MAR   │  ║   MIÉ   ║  │   JUE   │  │   VIE   │            │
│ │ [Clase] │  │ [Clase] │  ║ ↓ Aquí  ║  │ [Clase] │  │         │            │
│ │░[orig]░░│  │         │  ║         ║  │         │  │         │   🃏       │
│ └─ ─ ─ ─ ─┘  └─ ─ ─ ─ ─┘  ╚═════════╝  └─ ─ ─ ─ ─┘  └─ ─ ─ ─ ─┘  (overlay) │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Cambios en CSS

### 4.1 Estilos implementados

```css
/* Zona drop activa (mientras se arrastra) - con animación de pulso */
.capZonaDropDia--activo {
    outline: 2px dashed var(--cap-borde-medio);
    outline-offset: -2px;
    animation: capDropZonePulse 1.5s ease-in-out infinite;
}

/* Zona drop cuando el cursor está encima */
.capZonaDropDia--sobre {
    background: hsla(var(--cap-primario-hsl), 0.12);
    outline: 2px solid var(--cap-primario-400);
    outline-offset: -2px;
    animation: none;
}

/* Indicador de "Soltar aquí" */
.capZonaDropDia--sobre::before {
    content: '↓ Soltar aquí';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--cap-primario-500);
    color: var(--cap-texto-invertido);
    padding: var(--cap-espacio-sm) var(--cap-espacio-md);
    border-radius: var(--cap-radio-md);
    font-size: var(--cap-texto-sm);
    font-weight: var(--cap-peso-semibold);
    z-index: 10;
    pointer-events: none;
}

/* Animación de pulso en zonas activas */
@keyframes capDropZonePulse {
    0%, 100% { 
        opacity: 1; 
        background: var(--cap-fondo-sutil);
    }
    50% { 
        opacity: 0.7;
        background: hsla(var(--cap-primario-hsl), 0.08);
    }
}
```

---

## 5. Archivos Modificados

| Archivo                 | Cambios                                                           |
| ----------------------- | ----------------------------------------------------------------- |
| `calendario.css`        | ✅ Mejorados estilos de `.capZonaDropDia` con indicadores visuales |
| `variables.css`         | ✅ Añadida variable `--cap-primario-hsl` para transparencias       |
| `ZonaDropDia.tsx`       | ✅ Ya pasa correctamente las clases CSS                            |
| `CalendarioSemanal.tsx` | ✅ `dndActivo` se pasa correctamente                               |

---

## 6. Checklist de Implementación

- [x] **6.1** Mejorar estilos de zona activa (mientras arrastra)
  - [x] 6.1.1 Borde punteado más visible
  - [x] 6.1.2 Fondo sutil animado (pulso)
  - [x] 6.1.3 Transiciones suaves

- [x] **6.2** Mejorar estilos de hover (cursor sobre día)
  - [x] 6.2.1 Fondo azul más intenso
  - [x] 6.2.2 Indicador "Soltar aquí" con pseudo-elemento
  - [x] 6.2.3 Borde sólido en lugar de punteado

- [x] **6.3** Mejorar overlay arrastrado
  - [x] 6.3.1 Sombra más pronunciada
  - [x] 6.3.2 Escala ligeramente mayor (1.05)
  - [x] 6.3.3 Rotación sutil (ya existe: 3deg)

- [ ] **6.4** Verificar funcionamiento
  - [ ] 6.4.1 Probar en navegador
  - [ ] 6.4.2 Verificar que las clases bloqueadas no se arrastran
  - [ ] 6.4.3 Verificar persistencia tras mover

---

## 7. 🐛 BUG: Desfase de Fecha al Mover Clases

> **Estado:** ✅ Resuelto  
> **Síntoma:** Al arrastrar una clase a un día, se mueve al día **anterior**

### 7.1 Causa Raíz Identificada

El problema estaba en cómo se parseaban las fechas en `CalendarioSemanal.tsx`:

```ts
// PROBLEMA: new Date("YYYY-MM-DD") se interpreta como medianoche UTC
const fechaClase = new Date(clase.fecha);
```

En zonas horarias negativas (ej: GMT-4), una fecha como `"2026-01-19"` se interpreta como:
- `2026-01-19 00:00 UTC` = `2026-01-18 20:00 local`
- Entonces `getDay()` devuelve el día **anterior**

### 7.2 Solución Implementada

Se añadió una función `parsearFechaLocal()` que parsea los componentes de la fecha manualmente:

```ts
function parsearFechaLocal(fechaStr: string): Date {
    const [anio, mes, dia] = fechaStr.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
}
```

Esta función crea la fecha usando el constructor `new Date(year, month, day)` que interpreta los valores como **tiempo local**, no UTC.

### 7.3 Archivos Modificados

| Archivo                 | Cambio                                                          |
| ----------------------- | --------------------------------------------------------------- |
| `CalendarioSemanal.tsx` | Añadida función `parsearFechaLocal()` y usada en `clasesPorDia` |

---

## 8. Otros Problemas Detectados

### 8.1 Área de Drop Pequeña

> **Estado:** ✅ Resuelto

**Síntoma:** Hay que mover al centro de la columna para que funcione el drop.

**Solución implementada:**
- Aumentado `min-height` de `.capZonaDropDia` de 200px a 400px
- Añadido padding a la zona de drop para ampliar el área clickeable
- Eliminado el padding duplicado de `.capColumnaDia__slots`

---

## 9. Notas sobre el Diseño

Según el ROADMAP:
- **Mover entre días** → Drag & Drop ✅
- **Cambiar hora** → Via modal de edición (Fase 7.3)

El drag & drop solo mueve entre días, no entre horas. Para cambiar la hora, el usuario hace click en la clase y usa el modal de edición.
