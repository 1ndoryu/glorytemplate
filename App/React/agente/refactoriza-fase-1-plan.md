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

### Fase 2: Componentes UI Base (Átomos)
*   [ ] **Componente `Button`**: Crear un componente flexible que acepte variantes (`primary`, `outline`, `ghost`, `link`) y tamaños. Reemplazar todos los `<a>` y `<button>` hardcodeados.
*   [ ] **Componente `Container` / `Section`**: Estandarizar los anchos máximos y paddings que ahora se repiten en cada sección (`section`, `div.contenedor`).
*   [ ] **Componente `Badge` / `Tag`**: Para categorías y etiquetas de precios.
*   [ ] **Componente `Card`**: Abstracción base para tarjetas de proyectos, servicios y blog.

### Fase 3: Refactorización de Componentes Landing (Moleculas/Organismos)
*   [ ] **Refactorizar `SeccionServicios`**: Usar `Grid` y `ServiceCard` (nueva).
*   [ ] **Refactorizar `SeccionProyectos`**: Usar `ProjectCard` (nueva).
*   [ ] **Refactorizar `Navegacion`**: Usar `Button` para el login y enlaces estandarizados.
*   [ ] **Refactorizar `Footer`**: Componentizar enlaces y estructura.

### Fase 4: Limpieza
*   [ ] Eliminar clases CSS obsoletas de `landing.css`.
*   [ ] Verificar que `App/React/styles/landing.css` quede reducido a orquestación de layout básica o desaparezca si es posible.

## 5. Instrucciones para el Agente (Self-Correction)
*   **No romper el build**: Cada refactorización debe comprobarse (mentalmente o via revisión estática) para asegurar que no se pierden imports.
*   **Mantener la estética**: La refactorización es estructural, el diseño visual ("wow effect") debe mantenerse intacto o mejorar.
*   **Atomicidad**: No hacer cambios masivos en un solo paso. Ir componente por componente.
