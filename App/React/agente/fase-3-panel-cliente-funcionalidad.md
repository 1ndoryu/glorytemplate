# Fase 3: Detalle Funcional y Refactorización del Panel Cliente

Este documento consolida la visión funcional para la Fase 3 y los planes técnicos de refactorización para componentes y estilos (CSS), asegurando una arquitectura escalable y limpia.

## 1. Diseño de Navegación y Estructura

### Tabs de Navegación & Header
- [x] **Tabs:** Transformar en historial/menú de navegación secundario si aplica.
- [x] **Estilo Tabs:** Limpieza visual, eliminar bordes innecesarios.
- [x] **Header Limpio:** Eliminar textos genéricos. Integrar búsqueda y perfil de forma compacta.
    - *Corrección:* Eliminar barra de búsqueda del header global (redundante con Marketplace).
- [x] **Menú Usuario:** Implementar dropdown real en el Avatar.
    - *Mejora:* Hacer el menú más compacto y contextual.

### Layout General
- [x] **Sidebar:** Compacto (48px) con iconos y tooltips.
- [x] **Ancho Contenido:** Aplicar `max-width: 800px` al contenido de las vistas (excepto Marketplace).
- [x] **Limpieza:** Eliminar bloques dummy obsoletos.

## 2. Plan de Refactorización de Arquitectura (Código)

### Modularización de Componentes
El archivo `PanelCliente.tsx` era monolítico. Se ha dividido la lógica de presentación en subvistas dedicadas bajo `App/React/components/panel/views/`:
- **`VistaResumen.tsx`**: Dashboard principal (Stats, Proyectos).
- **`VistaHosting.tsx`**: Gestión de servidor (Terminal, Métricas).
- **`VistaMarketplace.tsx`**: Catálogo de servicios (Ancho fluido, Filtros).
- **`VistaFacturas.tsx`**: Historial de pagos.
- **`VistaPerfil.tsx`**: Gestión de usuario.
- **`VistaConfiguracion.tsx`**: (Pendiente) Ajustes generales.

### Uso de Componentes UI
Reemplazo de elementos HTML nativos y estilos inline por componentes del sistema de diseño:
- Uso de `<Tarjeta />`, `<Boton />`, `<Etiqueta />`.
- Eliminación estricta de `style={{...}}` en favor de clases CSS.

## 3. Plan de Refactorización de Estilos (CSS)

El archivo `panel.css` ha crecido desproporcionadamente. Se ha dividido en módulos específicos bajo `App/React/styles/layouts/panel/`:

1.  **`layout.css`**: Estructura base.
2.  **`resumen.css`**: Dashboard.
3.  **`hosting.css`**: Terminal/Server.
4.  **`marketplace.css`**: Grid fluido y filtros.
5.  **`facturas.css`**: Tablas de pago.
6.  **`perfil.css`**: Formularios usuario.

## 4. Estado de Implementación (Funcionalidad Real)

### Vistas Implementadas
- [x] **Vista General:** Conectar con datos de estado real (Context/API Simulado).
- [x] **Mis Proyectos:** Estructura de datos real para proyectos del cliente.
- [x] **Facturación:** Implementar lista de facturas.
- [x] **Perfil:** Formulario de edición de usuario.
- [x] **Marketplace Unificado:**
    - [x] Servicios idénticos a landing pública.
    - [x] Filtros y Búsqueda funcionales.
    - [x] Layout 100% ancho fluido (4 columnas).

## 5. Tareas Pendientes (Polishing & Fixes)

Estas tareas están planificadas para finalizar la Fase 3:

### UI/UX Refinements
- [ ] **Facturación:** Mejorar estilos visuales de la tabla (actualmente se ve básica).
- [ ] **Perfil:** Mejorar estética del formulario y layout.
- [ ] **Header:** Eliminar el input de búsqueda global (innecesario).
- [ ] **Menú Usuario:** Reducir tamaño y padding para hacerlo más compacto/contextual.

### Funcionalidad Faltante
- [ ] **Configuración:** Crear componente `VistaConfiguracion.tsx` (actualmente vacío).

### Calidad de Código
- [ ] **Auditoría de Componentes:** Revisar `VistaFacturas` y `VistaPerfil` para asegurar uso correcto de `Tarjeta` y `Boton` sin estilos inline residuales.
