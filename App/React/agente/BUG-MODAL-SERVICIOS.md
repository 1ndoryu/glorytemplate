# Bug: Modal de Edición de Servicios No Visible

> **Estado:** 🟢 Resuelto  
> **Prioridad:** Alta  
> **Fecha de análisis:** 2026-01-24  
> **Fecha de resolución:** 2026-01-24  
> **Componentes afectados:** Sistema de Modales del Panel

---

## Causa Raíz

**Conflicto de clases CSS** entre dos sistemas de modales:

1. **Landing/Portafolio** (`portafolio.css`): Usaba `.modalOverlay` con `opacity: 0` y `visibility: hidden` por defecto, activándose solo con `.modalOverlayVisible`.

2. **Panel** (`modal.css`): Usaba `.modalOverlay` asumiendo visibilidad inmediata cuando se renderiza.

Al cargar ambos archivos CSS, la definición del portafolio **sobrescribía** la del panel, ocultando todos los modales del panel.

---

## Solución Aplicada

### 1. Namespace de clases CSS

Se renombraron las clases del sistema de modales del Landing/Portafolio para evitar colisiones:

| Clase Original         | Clase Nueva                   |
| ---------------------- | ----------------------------- |
| `.modalOverlay`        | `.modalOverlayLanding`        |
| `.modalOverlayVisible` | `.modalOverlayLandingVisible` |
| `.modalContenido`      | `.modalContenidoLanding`      |

### 2. createPortal hacia #modal-root

Se implementó un contenedor dedicado para modales del panel fuera del `panelLayout`:

```tsx
/* En PanelCliente.tsx */
return (
    <>
        <div className="panelLayout">
            {/* ... contenido del panel */}
        </div>
        <div id="modal-root"></div>
    </>
);
```

Los modales del panel ahora usan `createPortal` hacia `#modal-root` para evitar el `overflow: hidden` del layout.

---

## Archivos Modificados

### CSS
- `styles/layouts/portafolio.css` - Renombradas clases de modal

### Componentes Landing
- `components/landing/ModalProyecto.tsx` - Actualizado a clases Landing
- `components/auth/ModalAuth.tsx` - Actualizado a clases Landing

### Componentes Panel
- `components/panel/PanelCliente.tsx` - Agregado `<div id="modal-root">`
- `components/panel/views/servicios/ModalEditarServicio.tsx` - Usa createPortal a #modal-root
- `components/panel/views/facturas/ModalPagarFactura.tsx` - Usa createPortal a #modal-root
- `components/panel/views/hosting/ModalCambiarPlan.tsx` - Usa createPortal a #modal-root

---

## Arquitectura de Modales - Resumen

### Sistema Landing (Portafolio, Auth)
- **Visibilidad**: Controlada por CSS (`opacity`/`visibility`)
- **Clases**: `.modalOverlayLanding`, `.modalOverlayLandingVisible`
- **Ubicación**: Inline en el componente

### Sistema Panel (Servicios, Facturas, Hosting)
- **Visibilidad**: Renderizado condicional (`if (!visible) return null`)
- **Clases**: `.modalOverlay`, `.modalVentana`
- **Ubicación**: Portal hacia `#modal-root`
- **Estilos**: `styles/layouts/panel/modal.css`

---

## TO-DO Futuro: Sistema Centralizado

Para evitar estos conflictos a largo plazo, considerar:

1. **Componente Modal base** (`components/ui/Modal/Modal.tsx`)
2. **Context para gestión global** (`context/ModalContext.tsx`)
3. **Hook unificado** (`useModal()`)

Ver plan detallado en la sección "Plan de Refactorización" más abajo.

---

## Plan de Refactorización (Opcional)

### Arquitectura Propuesta

```
App/React/
├── components/
│   └── ui/
│       └── Modal/
│           ├── index.ts
│           ├── Modal.tsx       # Componente base reutilizable
│           ├── ModalOverlay.tsx
│           ├── ModalHeader.tsx
│           └── ModalFooter.tsx
├── context/
│   └── ModalContext.tsx        # Gestión global de modales abiertos
├── hooks/
│   └── useModal.ts             # Hook para abrir/cerrar modales
```

### Orden de Migración Sugerido

1. `ModalPagarFactura` - Simple, solo muestra info
2. `ModalCambiarPlan` - Simple, selector
3. `ModalEditarServicio` - Complejo, formulario
4. `ModalProyecto` - Landing
5. `ModalAuth` - Autenticación

---

*Última actualización: 2026-01-24*
