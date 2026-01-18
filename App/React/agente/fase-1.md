# Fase 1: Landing MVP

**Objetivo:** Landing page ultra minimalista con portafolio de proyectos.

## Visión del Diseño

- Extremadamente minimalista
- Tipografía pequeña, todo compacto
- Fondo oscuro (#090909)
- Logo "nakomi" en texto que ocupa el ancho del contenedor dinámicamente
- Sin animaciones excesivas, elegancia en la simplicidad

---

## Tareas

### 1. Configuración Base

- [x] Renombrar variables CSS de `--dashboard-*` a `--nakomi-*`
- [x] Crear `variables.css` en `App/React/styles/`
- [x] Limpiar estilos del editor anterior si aplica

### 2. Estructura de Componentes

```
App/React/
├── islands/
│   └── LandingIsland.tsx       # Island principal del landing
├── components/
│   ├── landing/
│   │   ├── LogoHero.tsx        # Logo "nakomi" dinámico
│   │   ├── Navegacion.tsx      # Nav minimalista
│   │   ├── GridPortafolio.tsx  # Grid de proyectos
│   │   └── ModalProyecto.tsx   # Modal detalle proyecto
│   └── ui/
│       └── (componentes reutilizables)
└── styles/
    ├── variables.css           # Variables Nakomi
    └── landing.css             # Estilos del landing
```

### 3. Componentes a Desarrollar

- [x] **LogoHero**: Texto "nakomi" que escala al ancho del contenedor (page width)
- [x] **Navegacion**: Links compactos (Inicio, Servicios, Proyectos, Apps, Nosotros, Login)
- [x] **GridPortafolio**: Grid responsive de proyectos (6 items de ejemplo)
- [x] **ModalProyecto**: Modal sin recarga para ver detalles del proyecto
- [x] **LandingIsland**: Composición de todos los componentes
- [x] **PaginaServicios**: Vista dedicada con filtros avanzados (categoría, precio, búsqueda)

### 4. Registro

- [x] Registrar `LandingIsland` en `appIslands.tsx`
- [x] Configurar ruta en `pages.php` (registrado como `home` - página frontal)

### 5. Datos de Ejemplo

Proyectos a mostrar en el portafolio (temporalmente con imágenes placeholder de la carpeta colors de Glory):
1. Mabuhay Viajes
2. Entretenedores
3. Cosmo Revenue
4. Guille Chatbots
5. Material de Padel
6. Autoescuela CAD

---

## Notas Técnicas

- El modal de proyecto usa estado local, no routing
- Navegación con scroll suave a secciones o links externos
- El botón "Panel" solo aparece cuando hay sesión activa
- Responsive desde el inicio (mobile-first)

---

## Criterios de Completado

- [x] Landing renderiza correctamente en `/` o `/home`
- [x] Grid muestra 6 proyectos de ejemplo
- [x] Modal abre/cierra sin recargar página
- [x] Navegación funcional (puede ser placeholder por ahora)
- [x] Variables CSS con prefijo `--nakomi-`
- [x] Diseño extremadamente minimalista

