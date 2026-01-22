# Nakomi - Roadmap Unificado

> Documento consolidado de planificación. Para visión completa del proyecto ver: [Idea inicial.md](./Idea%20inicial.md)

---

## Estado General del Proyecto

| Fase | Nombre                    | Estado        |
| ---- | ------------------------- | ------------- |
| 1    | Landing MVP               | ✅ Completada  |
| 2    | Autenticación             | ✅ Completada  |
| 3    | Panel Cliente Base        | 🔄 En progreso |
| 3.5  | **Facturación (Urgente)** | 🚨 Prioridad   |
| 4    | Catálogo de Servicios     | ⏳ Pendiente   |
| 5    | Contratación de Servicios | ⏳ Pendiente   |
| 6    | Sistema de Pagos          | ⏳ Pendiente   |
| 7    | Suscripciones             | ⏳ Pendiente   |
| 8    | Comunicación              | ⏳ Pendiente   |
| 9    | Panel Empleado            | ⏳ Pendiente   |
| 10   | Panel Admin               | ⏳ Pendiente   |
| 11   | Sistema de Reseñas        | ⏳ Pendiente   |
| 12   | Servicios Avanzados       | ⏳ Pendiente   |

> 📋 **Plan detallado de facturación:** [PLAN-FACTURACION.md](./PLAN-FACTURACION.md)

---

## Fase 1: Landing MVP ✅

**Resumen:** Landing page ultra minimalista completada con portafolio, navegación y modal de proyectos.

### Logros
- Variables CSS con prefijo `--nakomi-*`
- Componentes: `LogoHero`, `Navegacion`, `GridPortafolio`, `ModalProyecto`, `LandingIsland`
- Página de servicios con filtros y diseño consistente
- **Refactorización completa** (~97% reducción de `landing.css`, de 1800 a 45 líneas)
- Sistema de componentes UI atómicos: `Boton`, `Contenedor`, `Seccion`, `Etiqueta`, `Tarjeta`, `Avatar`, `Icono`, `Texto`
- Hooks reutilizables: `useIntersectionReveal`, `useNavegacionLanding`, `useModal`
- Datos mock extraídos a `data/mocks/`
- Sistema de imágenes integrado con Glory backend (`ImagenGlory`, `useGloryImages`)

---

## Fase 2: Autenticación ✅

**Resumen:** Sistema de auth frontend completado con modal unificado y experiencia inmersiva de proyectos.

### Logros
- `ModalAuth` con Login/Registro en pestañas
- Integración de Google Auth (SVG inline)
- Estados de carga con simulación
- `PaginaProyecto` estilo Case Study (layout asimétrico, manifiesto tipográfico)
- Navegación SPA con preservación de scroll
- Diseño compacto y minimalista (modal 360px)

### Pendiente menor
- [ ] Eliminar archivo obsoleto `ModalProyecto.tsx`

---

## Fase 3: Panel Cliente Base 🔄

**Estado:** Refactorización de diseño y lógica de navegación en progreso.

### Completado
- [x] Tabs transformados en navegación secundaria limpia
- [x] Header limpio con menú usuario (dropdown en Avatar)
- [x] Sidebar compacto (48px) con iconos/tooltips
- [x] Contenido con `max-width: 800px`
- [x] Modularización: `VistaResumen`, `VistaHosting`, `VistaMarketplace`, `VistaFacturas`, `VistaPerfil`
- [x] CSS dividido en módulos: `layout.css`, `resumen.css`, `hosting.css`, `marketplace.css`, `facturas.css`, `perfil.css`
- [x] Marketplace unificado (servicios idénticos a landing, filtros funcionales, 4 columnas)

### Pendiente (UI/UX)
- [ ] Mejorar estilos tabla de facturación
- [ ] Mejorar estética formulario de perfil
- [ ] Eliminar input búsqueda global del header
- [ ] Reducir tamaño/padding del menú usuario

### Pendiente (Funcionalidad)
- [ ] Crear `VistaConfiguracion.tsx`

### Pendiente (Código)
- [ ] Auditar `VistaFacturas` y `VistaPerfil` (uso de `Tarjeta`/`Boton` sin estilos inline)

---

## Fases Futuras (4-12)

### Fase 4: Catálogo de Servicios
Listado público de servicios con descripción, planes, precios y tiempo estimado.

### Fase 5: Contratación
Flujo: elegir servicio → plan → tiempo → requerimientos → pago.

### Fase 6: Sistema de Pagos
Integración pasarela, retención, liberación, devolución, facturación automática.

### Fase 7: Suscripciones
Planes recurrentes (mensual/anual), renovación y cancelación.

### Fase 8: Comunicación
Mensajería cliente ↔ empleado, historial, notificaciones.

### Fase 9: Panel Empleado
Vista de servicios asignados, requerimientos, entregas, comunicación.

### Fase 10: Panel Admin
Dashboard métricas, gestión clientes, asignaciones, facturación (backend WordPress).

### Fase 11: Sistema de Reseñas
Reseñas post-servicio, migración desde Fiverr antiguo.

### Fase 12: Servicios Avanzados (Hosting)
**EXTREMADAMENTE COMPLEJO - ÚLTIMA PRIORIDAD**
Gestión con Coolify: SSH, archivos, almacenamiento, cancelación.

---

## Arquitectura Actual

```
App/React/
├── agente/                 # Documentación y planes
├── components/
│   ├── ui/                 # Átomos (Boton, Tarjeta, Avatar, Icono, Texto, etc.)
│   ├── landing/            # Componentes landing (TarjetaServicio, TarjetaProyecto, etc.)
│   ├── panel/views/        # Vistas del panel cliente
│   └── icons/              # Iconos SVG
├── data/mocks/             # Datos de ejemplo (proyectos, servicios, reseñas, artículos)
├── hooks/                  # Hooks personalizados
├── islands/                # Puntos de entrada (LandingIsland, PanelClienteIsland)
└── styles/
    ├── base/               # Reset, tipografía
    ├── tokens/             # Variables CSS
    ├── components/         # Estilos UI (boton, tarjeta, avatar, etc.)
    └── layouts/            # Estilos por sección/módulo
```

---

## Roles del Sistema

| Rol          | Responsabilidades                                                |
| ------------ | ---------------------------------------------------------------- |
| **Admin**    | Gestión ingresos, pagos, facturas, clientes. Puede ser empleado. |
| **Empleado** | Atiende servicios asignados, entrega trabajos.                   |
| **Cliente**  | Contrata, paga (retenido), suscripciones, comunicación.          |

### Flujo de Servicio
```
Cliente paga → Pago retenido → Envía requerimientos → Empleado asignado
→ Trabaja → Entrega → Cliente acepta → Pago liberado → Reseña
```

---

## Tecnología

- **Backend:** WordPress (usuarios, REST API)
- **Frontend:** React Islands (Glory framework)
- **Hosting propio:** Coolify (sin cPanel)
- **Variables CSS:** Prefijo `--nakomi-*` (ver `styles/tokens/variables.css`)


---

*Última actualización: 2026-01-22*
