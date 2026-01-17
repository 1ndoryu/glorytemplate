# Fase 1: Landing MVP

**Objetivo:** Landing page ultra minimalista con portafolio de proyectos.

## Visión del Diseño

- Extremadamente minimalista
- Tipografía pequeña, todo compacto
- Fondo oscuro (#090909)
- Logo "nakomi" en texto que ocupa el ancho completo dinámicamente
- Sin animaciones excesivas, elegancia en la simplicidad

---

## Tareas

### 1. Configuración Base

- [ ] Renombrar variables CSS de `--dashboard-*` a `--nakomi-*`
- [ ] Crear `variables.css` en `App/React/styles/`
- [ ] Limpiar estilos del editor anterior si aplica

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

- [ ] **LogoHero**: Texto "nakomi" que escala al ancho del viewport
- [ ] **Navegacion**: Links compactos (Inicio, Servicios, Proyectos, Apps, Nosotros, Login)
- [ ] **GridPortafolio**: Grid responsive de proyectos (6 items de ejemplo)
- [ ] **ModalProyecto**: Modal sin recarga para ver detalles del proyecto
- [ ] **LandingIsland**: Composición de todos los componentes

### 4. Registro

- [ ] Registrar `LandingIsland` en `appIslands.tsx`
- [ ] Configurar ruta en `pages.php` (probablemente como `home`)

### 5. Datos de Ejemplo

Proyectos a mostrar en el portafolio (temporalmente con imágenes placeholder):
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

- [ ] Landing renderiza correctamente en `/` o `/home`
- [ ] Grid muestra 6 proyectos de ejemplo
- [ ] Modal abre/cierra sin recargar página
- [ ] Navegación funcional (puede ser placeholder por ahora)
- [ ] Variables CSS con prefijo `--nakomi-`
- [ ] Diseño extremadamente minimalista
