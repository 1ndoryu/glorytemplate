# Plan Fase 2: Autenticación y Experiencia de Proyectos

Este documento detalla el plan de acción ejecutado para la Fase 2, enfocada en mejorar la experiencia de usuario mediante autenticación integrada y una presentación de proyectos altamente inmersiva tipo "Case Study".

## 1. Autenticación (Frontend)

El objetivo se logró: mantener al usuario en la experiencia del sitio con un modal minimalista y funcional.

### Componentes Implementados
*   **`ModalAuth`**: Componente unificado que gestiona Login y Registro con pestañas.
*   **Inputs Inteligentes**: `type="email"` o `type="text"` dinámico según el modo (Login/Registro).
*   **Google Auth**: SVG Inline optimizado para carga instantánea y nítida.
*   **Estados de Carga**: Feedback visual ("Procesando...") con simulación de éxito.

### Diseño y UX
*   **Estética Compacta**: Se redujo el tamaño del modal (`360px`) y los espaciados internos para una apariencia más elegante y menos intrusiva.
*   **Minimalismo**: Uso estricto de bordes sutiles y fondo secundario oscuro.

---

## 2. Páginas de Proyectos (Case Studies)

Se transformó la visualización de proyectos en una experiencia editorial completa.

### Implementación Realizada (`PaginaProyecto.tsx`)
*   **Navegación SPA**: Integración en `LandingIsland` mediante `useNavegacionLanding`. Al volver, preserva el scroll en la sección de proyectos.
*   **Estilo Visual (Referencia DashDigital)**:
    *   **Header Mínimo**: Marca del proyecto + Botón "MENU +" (Volver).
    *   **Manifiesto Gigante**: Descripción principal en mayúsculas, fuente grande (`clamp`), ocupando el ancho visual.
    *   **Grid Asimétrico**: Layout de 2 columnas (Aside 300px + Contenido flexible).
    *   **Tipografía Refinada**: Fuentes reducidas globalmente para sofisticación (`0.95rem` en cuerpo, títulos controlados).
    *   **Botón "Pill"**: Botón de volver redondeado sólido, integrado con el componente `Boton` del sistema UI.

### Estructura de Datos
*   Se reutilizaron los mocks existentes, adaptando la UI para mostrar la descripción corta como "Manifiesto" y el contenido extendido maquetado directamente en el componente (listo para conectar a backend).

---

## 3. Hoja de Ruta (Estado Actual)

### Paso 1: Infraestructura de Navegación
- [x] Definir lógica para soportar vista dedicada `proyecto`.
- [x] Adaptar `LandingIsland` para renderizar `PaginaProyecto` condicionalmente.
- [x] Ajustar hook `useNavegacionLanding` para pasar datos del proyecto seleccionado.

### Paso 2: Sistema de Autenticación
- [x] Crear componente `ModalAuth` completo.
- [x] Implementar lógica de alternancia Login/Registro.
- [x] Añadir botón "Google" con icono SVG inline.
- [x] Integrar apertura desde el Header (`Navegacion.tsx`).
- [x] Simular lógica de submit con estados de carga.

### Paso 3: Experiencia de Proyectos
- [x] Diseñar `PaginaProyecto` (ex `PaginaDetalleProyecto`) inspirado en Fitsole.
- [x] Implementar layout asimétrico y manifiesto tipográfico.
- [x] Conectar click en `GridPortafolio` para navegar a la nueva página.
- [x] Implementar botón "Volver" con scroll automático a la sección de portafolio.

### Paso 4: Limpieza y Refinamiento
- [x] Ajustar tamaños de fuente y espaciados (feedback usuario).
- [x] Compactar botones y modales.
- [ ] (Pendiente) Eliminar archivo obsoleto `ModalProyecto.tsx`.
