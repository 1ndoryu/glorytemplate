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
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Container.tsx
│   │   └── Typography.tsx
│   ├── layout/             # Componentes estructurales (Grid, Section, Header, Footer)
│   │   ├── Grid.tsx
│   │   └── Section.tsx
│   ├── features/           # Componentes de negocio complejos
│   │   ├── landing/        # Bloques específicos del Landing
│   │   │   ├── Hero.tsx
│   │   │   ├── ServicesGrid.tsx
│   │   │   └── Manifesto.tsx
│   │   └── portfolio/      # Bloques de portafolio
│   │       ├── ProjectCard.tsx
│   │       └── ProjectModal.tsx
│   └── icons/              # Iconos SVG centralizados
├── islands/                # Puntos de entrada / Orquestadores (LandingIsland)
├── styles/                 # Estilos globales y módulos
│   ├── base/               # Resets, tipografía base
│   ├── tokens/             # Variables (Colores, Espaciado)
│   ├── components/         # Estilos de componentes UI (btn.css, input.css)
│   └── layouts/            # Estilos de secciones (landing.css refactorizado)
└── utils/                  # Utilidades y hooks
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

## 5. Resumen de Archivos CSS por Tipo

### Base (~200 líneas total)
- `base/reset.css` - Reset y scrollbar
- `base/tipografia.css` - Sistema tipográfico

### Componentes UI (~400 líneas total)
- `components/boton.css` - Sistema de botones
- `components/tarjeta.css` - Sistema de tarjetas
- `components/etiqueta.css` - Sistema de etiquetas/badges

### Layouts (~1400 líneas total, distribuidas)
- Cada archivo de layout <= 220 líneas (cumple con el límite de 300)

### Landing Base (~45 líneas)
- Solo contiene `.contenedorLanding` y footer minimalista

## 6. Instrucciones para el Agente (Self-Correction)
*   **No romper el build**: Cada refactorización debe comprobarse (mentalmente o via revisión estática) para asegurar que no se pierden imports.
*   **Mantener la estética**: La refactorización es estructural, el diseño visual ("wow effect") debe mantenerse intacto o mejorar.
*   **Atomicidad**: No hacer cambios masivos en un solo paso. Ir componente por componente.
*   **Límites de archivo**: Ningún archivo CSS debe superar 300 líneas (cumplido).

## 7. Próximos Pasos (TO-DO Fase 6)

- [ ] **Reorganizar componentes landing**: Mover componentes específicos de landing a `components/features/landing/`
- [ ] **Crear componente `TarjetaBlog`**: Extraer la tarjeta de blog como componente reutilizable
- [ ] **Crear componente `TarjetaResena`**: Extraer la tarjeta de reseña como componente
- [ ] **Revisar uso de variables**: Auditar todos los archivos CSS para asegurar uso consistente de tokens
