# Fase 1: MVP - Landing y Panel de Cliente

## Objetivos
Lanzar la plataforma base que permita mostrar el portafolio y permitir a los clientes contratar y gestionar sus servicios con una experiencia de usuario premium y minimalista.

## Lista de Tareas Detallada

### 1. Preparación del Entorno
- [ ] **Limpieza de Configuración**: Editar `App/Config/pages.php`.
    - Comentar/Desactivar páginas de ejemplo (`home-static`, `home`, `editor`, etc.).
    - Mantener comentarios explicativos.
- [ ] **Configuración de Estilos Globales**:
    - Definir variables CSS (Design Tokens) en el archivo CSS principal.
    - Implementar paleta de colores Dark Mode.
    - Configurar tipografía moderna (Inter u Outfit).

### 2. Diseño y UI (Tokens)
Usar las siguientes variables para el Dashboard y Dark Mode general:
```css
:root {
    --dashboard-fondoPrincipal: #090909;
    --dashboard-fondoSecundario: #0c0c0c;
    --dashboard-fondoTerciario: #151515;
    --dashboard-fondoHover: #1e1e1e;
    --dashboard-acento: #60a5fa;
    --dashboard-acentoHover: #3b82f6;
    --dashboard-bordePrincipal: #1a1a1a;
    --dashboard-bordeSutil: #222;
    --dashboard-textoActivo: #f5f5f5;
    --dashboard-textoNormal: #e0e0e0;
    --dashboard-textoSecundario: #a0a0a0;
    --dashboard-textoApagado: #808080;
    --dashboard-barraFondo: #2a2a2a;
    /* ... añadir resto de variables de Idea inicial.md */
}
```

### 3. Landing Page (React Fullpage)
- **Ruta**: `/` (Home)
- **Componente**: `HomeLanding`
- **Secciones**:
    1. **Hero**: Texto "NAKOMI" responsivo cubriendo ancho.
    2. **Grid Proyectos**: 6 items placeholder (colores Glory).
       - *Interacción*: Click expande detalles (modal/overlay) sin recarga.
    3. **Navegación**:
       - Links: Inicio, Servicios, Proyectos, Apps, Nosotros.
       - Botón: "Panel" (si logueado) o "Login".

### 4. Panel de Cliente (Dashboard)
- **Ruta**: `/panel` (Protegida)
- **Layout**: `DashboardLayout`
    - Sidebar colapsable (Inicio, Servicios, Facturación, Ajustes).
- **Vistas**:
    - **Resumen**: Servicios activos, estado rápido.
    - **Contratar**: Grid de servicios disponibles -> Formulario de requisitos -> Pago.
    - **Suscripciones**: Gestión de planes recurrentes (Hosting, Mantenimiento).

### 5. Backend (WordPress)
- [ ] Crear CPT `Service`: Para definir los servicios vendibles.
- [ ] Crear CPT `Order`: Para registrar contrataciones.
- [ ] Integrar campos personalizados (ACF o nativo) para detalles de orden.

## Dudas para el Usuario
1. **Archivo `pages.md`**: Asumimos que te referías a `App/Config/pages.php`. ¿Correcto?
2. **Método de Pago Fase 1**: ¿Implementamos pasarela real (Stripe/PayPal) o solo flujo de pedido "manual/pendiente"?
3. **Contenido**: ¿Tienes los textos/copy para los servicios o usamos Lorem Ipsum?
