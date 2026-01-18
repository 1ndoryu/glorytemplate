# Plan de Refactorización Fase 1 - Nakomi Landing

## 1. Diagnóstico Actual

Tras una revisión del código existente en `App/React`, se han detectado los siguientes puntos críticos que dificultan la escalabilidad y mantenibilidad del proyecto:

*   **Ausencia de Componentes Atómicos**: Elementos básicos de UI como Botones, Inputs, Badges o Textos no están componentizados. Se repiten estructuras HTML y clases CSS (ej: `ecosistemaBotonVer`, `serviciosBotonVer`, `manifiestoBoton`).
*   **CSS Monolítico**: El archivo `App/React/styles/landing.css` tiene casi 1800 líneas. Mezcla estilos globales, layouts específicos de secciones y estilos de componentes, lo que hace difícil localizar y mantener el estilo.
*   **Acoplamiento Fuerte**: Componentes como `SeccionEcosistema` o `Navegacion` tienen estilos y lógica fuertemente acoplados a la implementación actual, dificultando su reutilización.
*   **Falta de Estandarización**: Aunque existen variables CSS, no siempre se usan consistentemente en todos los nuevos componentes, y hay valores hardcodeados en línea o clases ad-hoc.

## 2. Objetivos de la Refactorización

1.  **Atomic Design**: Implementar una librería de componentes UI base (`components/ui`) que sean puramente presentacionales y reutilizables.
2.  **Modularización CSS**: Dividir el CSS monolítico en archivos específicos por responsabilidad (Base, Layout, Componentes, Utilidades) o módulos CSS si se aprueba, priorizando la separación actual por archivos `.css`.
3.  **Limpieza y Organización**: Reestructurar los directorios para reflejar mejor la arquitectura del proyecto (UI vs Features vs Layouts).
4.  **Reducción de Deuda Técnica**: Eliminar código duplicado y preparar el terreno para nuevas features sin arrastrar peso muerto.

## 3. Nueva Arquitectura de Directorios Propuesta

```text
App/React/
├── agente/                 # Documentación y planes del agente
├── components/
│   ├── ui/                 # Átomos reutilizables (Button, Input, Badge, Typography)
│   │   ├── Boton.tsx
│   │   ├── Etiqueta.tsx
│   │   ├── Contenedor.tsx
│   │   ├── Tarjeta.tsx
│   │   └── index.ts
│   ├── landing/            # Componentes específicos del Landing
│   │   ├── TarjetaBlog.tsx
│   │   ├── TarjetaResena.tsx
│   │   ├── TarjetaServicio.tsx
│   │   ├── SeccionBlog.tsx
│   │   └── ...
│   └── icons/              # Iconos SVG centralizados
├── hooks/                  # Hooks personalizados
│   ├── useIntersectionReveal.ts
│   └── index.ts
├── islands/                # Puntos de entrada / Orquestadores (LandingIsland)
├── styles/                 # Estilos globales y módulos
│   ├── base/               # Resets, tipografía base
│   ├── tokens/             # Variables (Colores, Espaciado, Semánticos)
│   ├── components/         # Estilos de componentes UI (btn.css, input.css)
│   └── layouts/            # Estilos de secciones (12 archivos modulares)
└── utils/                  # Utilidades
```

## 4. Plan de Acción (Fases)

### Fase 1: Cimientos y Estilos (Prioridad Alta) ✅ COMPLETADA
*   [x] **Reorganizar Estilos**: Creada nueva estructura de directorios con:
    - `styles/tokens/variables.css` - Variables/tokens mejorados con nuevas adiciones
    - `styles/base/reset.css` - Reset y estilos base globales
    - `styles/base/tipografia.css` - Sistema de tipografía con clases utilitarias
    - `styles/components/boton.css` - Sistema unificado de botones
    - `styles/components/tarjeta.css` - Sistema base de tarjetas
    - `styles/layouts/contenedor.css` - Layouts de contenedor y grids
    - `styles/index.css` - Punto de entrada principal
*   [x] **Crear sistema de tipografía en CSS**: Clases para H1-H4, body, caption, etiquetas y modificadores

### Fase 2: Componentes UI Base (Átomos) ✅ COMPLETADA
*   [x] **Componente `Boton`**: Creado en `components/ui/Boton.tsx` con variantes (`solid`, `outline`, `ghost`, `link`, `acento`) y tamaños (`sm`, `md`, `lg`). Soporta iconos, estados cargando/disabled, renderizado como `<a>` o `<button>`.
*   [x] **Componente `Contenedor`**: Creado en `components/ui/Contenedor.tsx` con variantes (`normal`, `texto`, `flush`, `full`) para anchos máximos estandarizados.
*   [x] **Componente `Seccion`**: Creado en `components/ui/Seccion.tsx` para secciones de página con `alturaMinima`, `centrada` y `padding` opcionales.
*   [x] **Componente `Etiqueta`**: Creado en `components/ui/Etiqueta.tsx` con variantes (`default`, `categoria`, `precio`, `estado`, `destacado`) y tamaños (`xs`, `sm`, `md`). Estilos en `styles/components/etiqueta.css`.
*   [x] **Componente `Tarjeta`**: Creado en `components/ui/Tarjeta.tsx` como abstracción base con sub-componentes:
    - `TarjetaImagen` - Para imágenes con contenedor
    - `TarjetaOverlay` - Para overlays con gradiente
    - `TarjetaCuerpo` - Para contenido con padding
    - `TarjetaHeader` - Para cabeceras con flex
    - `TarjetaFooter` - Para pies con flex
*   [x] **Índice de exportaciones**: Creado `components/ui/index.ts` para facilitar importaciones centralizadas.

### Fase 3: Refactorización de Componentes Landing (Moleculas/Organismos) ✅ COMPLETADA
*   [x] **Refactorizar `TarjetaServicio`**: Ahora usa `Tarjeta`, `TarjetaImagen`, `TarjetaCuerpo` y `Etiqueta` del sistema UI.
*   [x] **Refactorizar `TarjetaProyecto`**: Ahora usa `Tarjeta`, `TarjetaImagen`, `TarjetaOverlay` y `Etiqueta` del sistema UI.
*   [x] **Refactorizar `GridServicios`**: Usa `Boton` del sistema UI para el enlace "Ver servicios".
*   [x] **Refactorizar `GridResenas`**: Usa `Tarjeta`, `TarjetaCuerpo`, `TarjetaFooter` y `Boton` del sistema UI.
*   [x] **Refactorizar `SeccionBlog`**: Usa `Tarjeta`, `TarjetaImagen`, `TarjetaCuerpo`, `TarjetaFooter`, `Etiqueta` y `Boton` del sistema UI.
*   [x] **Refactorizar `SeccionEcosistema`**: Usa `Boton` para el CTA.
*   [x] **Refactorizar `Navegacion`**: Usa `Boton` para el login.

### Fase 4: Limpieza ✅ COMPLETADA
*   [x] **Refactorizar `IntroManifiesto`**: Ahora usa `Boton` del sistema UI para el CTA "Conócenos".
*   [x] **Eliminar clases CSS obsoletas de `landing.css`**:
    - `.manifiestoBoton` - Eliminada (reemplazada por componente Boton)
    - `.serviciosBotonVer` - Eliminada (reemplazada por componente Boton)
    - `.resenasBotonVer` - Eliminada (reemplazada por componente Boton)
    - `.resenaBotonProyecto` - Eliminada (reemplazada por componente Boton)
    - `.ecosistemaBotonVer` - Eliminada (reemplazada por componente Boton)
    - `.blogBotonVer` - Eliminada (reemplazada por componente Boton)
    - `.blogLeerMas` - Eliminada (reemplazada por componente Boton)
*   [x] **Reducción de `landing.css`**: El archivo pasó de ~1800 líneas a ~1650 líneas (~150 líneas eliminadas de CSS duplicado).

### Fase 5: Modularización CSS ✅ COMPLETADA
*   [x] **Dividir `landing.css`**: El archivo se redujo de ~1660 líneas a **~45 líneas** mediante extracción a 12 archivos modulares:
    - `layouts/navegacion.css` (~90 líneas) - Barra de navegación principal
    - `layouts/hero.css` (~70 líneas) - Sección hero y grid portafolio base
    - `layouts/portafolio.css` (~145 líneas) - Tarjetas proyecto y modal
    - `layouts/manifiesto.css` (~50 líneas) - Sección manifiesto animado
    - `layouts/seccion-servicios.css` (~160 líneas) - Carrusel y grid servicios
    - `layouts/resenas.css` (~115 líneas) - Grid de reseñas
    - `layouts/ecosistema.css` (~80 líneas) - Sección ecosistema
    - `layouts/blog.css` (~135 líneas) - Grid de artículos blog
    - `layouts/proceso.css` (~125 líneas) - Sección proceso y tarjeta grande
    - `layouts/ejemplos-visuales.css` (~220 líneas) - Ventanas de ejemplo UI
    - `layouts/pedidos.css` (~165 líneas) - Tabla de pedidos demo
    - `layouts/ejemplos-adicionales.css` (~140 líneas) - Stats y notificaciones
*   [x] **Actualizar `layouts/index.css`**: Punto de entrada que importa todos los módulos CSS.

### Fase 6: Extracción de Componentes y Auditoría ✅ COMPLETADA
*   [x] **Crear componente `TarjetaBlog`**: Extraído de `SeccionBlog.tsx` a archivo independiente `components/landing/TarjetaBlog.tsx`
*   [x] **Crear componente `TarjetaResena`**: Extraído de `GridResenas.tsx` a archivo independiente `components/landing/TarjetaResena.tsx`
*   [x] **Crear hook `useIntersectionReveal`**: Extraída lógica duplicada de `SeccionProceso` a `hooks/useIntersectionReveal.ts`
*   [x] **Refactorizar `SeccionProceso`**: Ahora usa el hook y centraliza datos en arrays (de 157 líneas a ~120 líneas, código más DRY)
*   [x] **Auditoría de variables CSS**: 
    - Agregadas variables de colores semánticos (`--nakomi-exito`, `--nakomi-warning`, `--nakomi-error`, `--nakomi-info`)
    - Eliminados ~20 colores hardcodeados en archivos CSS de layouts
    - Agregada variable `--nakomi-gradienteAvatar` para gradientes
*   [x] **Actualizar barrel exports**: `components/landing/index.ts` ahora exporta todos los componentes extraídos

## 5. Resumen de Archivos CSS por Tipo

### Base (~200 líneas total)
- `base/reset.css` - Reset y scrollbar
- `base/tipografia.css` - Sistema tipográfico

### Tokens (~105 líneas)
- `tokens/variables.css` - Todas las variables CSS incluyendo colores semánticos

### Componentes UI (~400 líneas total)
- `components/boton.css` - Sistema de botones
- `components/tarjeta.css` - Sistema de tarjetas
- `components/etiqueta.css` - Sistema de etiquetas/badges

### Layouts (~1400 líneas total, distribuidas)
- Cada archivo de layout <= 220 líneas (cumple con el límite de 300)

### Landing Base (~45 líneas)
- Solo contiene `.contenedorLanding` y footer minimalista

## 6. Resumen de Hooks

### `hooks/useIntersectionReveal.ts`
Hook para animaciones de entrada al viewport con revelación escalonada:
- `cantidadElementos`: Número de elementos a animar
- `delayEntreCada`: Delay en ms entre cada animación
- `threshold`: Umbral de intersección (0-1)
- `disparaUnaVez`: Si solo se anima una vez o cada vez que entra en viewport

## 7. Instrucciones para el Agente (Self-Correction)
*   **No romper el build**: Cada refactorización debe comprobarse (mentalmente o via revisión estática) para asegurar que no se pierden imports.
*   **Mantener la estética**: La refactorización es estructural, el diseño visual ("wow effect") debe mantenerse intacto o mejorar.
*   **Atomicidad**: No hacer cambios masivos en un solo paso. Ir componente por componente.
*   **Límites de archivo**: Ningún archivo CSS debe superar 300 líneas (cumplido).
*   **Usar variables CSS**: Siempre usar tokens de `variables.css` para colores, espaciados, radios, etc.

## 8. Fase 7: Refactorizar LandingIsland.tsx ✅ COMPLETADA

### Problema identificado
El archivo `LandingIsland.tsx` tenía **281 líneas** y violaba SRP al contener:
- **~180 líneas de datos mock** (proyectos, servicios, reseñas, artículos)
- **Lógica de navegación** (~30 líneas) que podría ser un hook
- **Lógica de modal** que se repite en otros componentes
- **Estado de enrutamiento interno** (vistaActual) que podría manejarse diferente

### Tareas de extracción ✅

#### 7.1 Extraer datos mock a archivos separados ✅
- [x] **Crear `data/mocks/proyectos.ts`**: Movido `proyectosEjemplo` (55 líneas)
- [x] **Crear `data/mocks/servicios.ts`**: Movido `serviciosEjemplo` (65 líneas)  
- [x] **Crear `data/mocks/resenas.ts`**: Movido `resenasEjemplo` (52 líneas)
- [x] **Crear `data/mocks/articulos.ts`**: Movido `articulosEjemplo` (37 líneas)
- [x] **Crear `data/mocks/index.ts`**: Barrel export para todos los mocks

*Resultado: ~172 líneas eliminadas del Island*

#### 7.2 Extraer hooks de lógica ✅
- [x] **Crear `hooks/useNavegacionLanding.ts`**: Hook para navegación con scroll suave (55 líneas)
  - Encapsula `handleNavegar`
  - Maneja cambio de vista y scroll a secciones
  - Retorna `{handleNavegar, vistaActual, setVistaActual}`

- [x] **Crear `hooks/useModal.ts`**: Hook genérico para manejo de modales (44 líneas)
  - Estado de visibilidad
  - Item seleccionado con tipo genérico
  - Funciones `abrir` y `cerrar` con delay para animaciones
  - Reutilizable en cualquier modal del proyecto

#### 7.3 Refactorizar LandingIsland.tsx ✅
- [x] Importar datos desde `data/mocks`
- [x] Usar `useNavegacionLanding` para navegación
- [x] Usar `useModal<Proyecto>` para el modal de proyecto
- [x] **Resultado final: Componente reducido de 281 a ~52 líneas** (solo composición de UI)

### Arquitectura después de Fase 7

```text
App/React/
├── data/
│   └── mocks/              # Datos de ejemplo/placeholder
│       ├── proyectos.ts    # 55 líneas
│       ├── servicios.ts    # 65 líneas
│       ├── resenas.ts      # 52 líneas
│       ├── articulos.ts    # 37 líneas
│       └── index.ts        # Barrel export
├── hooks/
│   ├── useIntersectionReveal.ts  # Existente
│   ├── useNavegacionLanding.ts   # Nuevo - 55 líneas
│   ├── useModal.ts               # Nuevo - 44 líneas
│   └── index.ts                  # Barrel export actualizado
├── islands/
│   └── LandingIsland.tsx   # Reducido a ~52 líneas ✅
└── ...
```

## 9. Próximos Pasos (TO-DO Fase 8)

### 8.1 Sistema de Imágenes Optimizadas (Prioridad Alta)

**Problema**: Las rutas de imágenes están hardcodeadas en los mocks usando `/wp-content/themes/glory/Glory/assets/images/colors/`. Esto dificulta:
- Optimización de carga (diferentes resoluciones según contexto)
- Prevención de imágenes repetidas
- Filtrado de imágenes de baja resolución
- Mantenibilidad si la estructura de carpetas cambia

#### Sistema Glory Existente (Backend PHP)

Glory ya cuenta con utilidades robustas en **`Glory\Utility\AssetsUtility`** y **`Glory\Utility\ImageUtility`**:

**Aliases registrados**:
- `glory` → `Glory/assets/images`
- `colors` → `Glory/assets/images/colors`
- `elements` → `Glory/assets/images/elements`
- `logos` → `Glory/assets/images/logos`
- `tema` → `App/Assets/images`

**Funciones útiles de `AssetsUtility`**:
- `listImagesForAlias($alias, $extensiones)` - Lista todas las imágenes de un alias
- `listImagesForAliasWithMinSize($alias, $minBytes)` - Filtra por tamaño mínimo (bytes)
- `pickRandomImages($alias, $cantidad, $minBytes)` - Selección aleatoria sin repetir
- `imagenUrl($ref)` - Obtiene URL optimizada usando sintaxis `alias::archivo`
- `getRandomUniqueImagesFromAlias($alias, $cantidad)` - Aleatorias únicas

**CDN y optimización en `ImageUtility`**:
- `jetpack_photon_url($url, $args)` - Transforma a CDN de Jetpack (i0.wp.com)
- Soporta parámetros: `quality`, `strip`, `resize`
- En local (`LOCAL=true`) devuelve URL sin CDN

#### Enfoque de Integración React

**Opción A: API REST + React Hook (Recomendado)**
1. Crear endpoint REST en Glory que exponga las imágenes del alias con metadata
2. Hook `useGloryImages(alias, opciones)` que consume el endpoint
3. Componente `<ImagenGlory src="colors::imagen.jpg" />` que usa CDN automáticamente

**Opción B: Pre-generación estática**
1. Script PHP que genera `catalogo.json` con todas las imágenes y metadata
2. Importar catálogo en React como constante
3. Utilidad TypeScript para filtrar/seleccionar

**Tareas planificadas**:
- [ ] **Crear endpoint REST `/glory/v1/images`**: 
  - Acepta alias, cantidad, tamaño mínimo
  - Retorna array con URLs optimizadas (CDN en producción)
  - Evita repetir imágenes en la sesión
- [ ] **Crear hook `useGloryImages.ts`**: 
  - Wrapper del endpoint con cache
  - Tracking de imágenes ya usadas (Context o Zustand)
  - Prefetch opcional
- [ ] **Crear componente `ImagenGlory.tsx`**: 
  - Acepta referencia `alias::archivo` 
  - Lazy loading nativo con `loading="lazy"`
  - Placeholder blur (CSS o base64)
  - Fallback si imagen no carga
  - Props para ancho/alto/clases
- [ ] **Migrar mocks a sistema integrado**:
  - Reemplazar rutas hardcodeadas por referencias `colors::filename.jpg`
  - O usar hook para obtener imágenes dinámicamente

### 8.2 Otras tareas pendientes
- [x] **Crear componente `Avatar`**: Extraído a `components/ui/Avatar.tsx` con soporte para:
  - Imágenes de avatar o placeholder con iniciales
  - Tamaños: xs, sm, md, lg, xl
  - Variantes: gradiente, solido, personalizado
  - Estilos en `styles/components/avatar.css`
  - Refactorizados `TarjetaResena` y `EjemploRecibeClientes` para usarlo
- [x] **Documentar sistema de tokens**: Creada guía completa en `agente/tokens.md`
- [ ] **Revisar responsividad**: Auditar media queries para consistencia
- [x] **Componente `Icon`**: Creado `components/ui/Icono.tsx` con catálogo de iconos SVG:
  - Iconos: flecha-derecha, flecha-izquierda, cerrar, menu, buscar, check, estrella, usuario, mas, menos, externo
  - Tamaños: xs, sm, md, lg, xl
  - Soporte para accesibilidad (aria-label)
- [ ] **Componente `Input`**: Crear input con variantes para formularios
- [x] **Componente `Texto`**: Creado `components/ui/Texto.tsx` para tipografía semántica:
  - Variantes: display, h1-h4, body, bodyGrande, caption, etiqueta, mono
  - Colores: activo, normal, secundario, apagado, muyApagado, acento, inherit
  - Pesos y alineación personalizables
  - Estilos en `styles/components/texto.css`

## 10. Métricas de Refactorización

| Métrica                     | Antes | Después | Mejora         |
| --------------------------- | ----- | ------- | -------------- |
| Líneas en LandingIsland.tsx | 281   | ~52     | **-81%**       |
| Archivos de datos separados | 0     | 5       | +5 archivos    |
| Hooks reutilizables         | 1     | 3       | +2 hooks       |
| Líneas CSS landing.css      | ~1800 | ~45     | **-97%**       |
| Archivos CSS modulares      | 1     | 18+     | +17 archivos   |
| Componentes UI atómicos     | 5     | 11      | +6 componentes |

### Componentes UI creados en Fase 8
- `Avatar.tsx` - Avatares con imagen/iniciales
- `Icono.tsx` - Catálogo de iconos SVG
- `Texto.tsx` - Tipografía semántica

