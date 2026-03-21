# Falso positivo: Sentinel flagea botones nativos en layouts

## Contexto
Code Sentinel reporta "Usar componente `<Boton>` en vez de `<button>` nativo" y "Usar `<Modal>` en vez de div overlay con onClick" en `CapLayout.tsx`.

## Por qué es falso positivo
- **Botones del sidebar** (`.capSidebar__item`, `.capSidebar__toggle`, `.capSidebar__cerrarSesion`, `.capDashboard__menuBtn`) son elementos estructurales de layout con CSS propio completo. El componente `<Boton>` inyecta clases base (`capBoton`, `capBoton--variante`) y un wrapper `<span className="capBoton__texto">` que rompen la estructura DOM/CSS del sidebar.
- **Overlay** (`.capDashboard__overlay`) es un backdrop para sidebar responsive, no un diálogo modal. `<Modal>` agrega estructura y comportamiento (focus trap, portal, scroll lock) que no aplican.

## Corrección sugerida en Sentinel
La regla debería excluir archivos de layout (`*Layout.tsx`, `*Sidebar.tsx`) o componentes que contengan `sidebar`, `nav`, `header` en su nombre/ruta. Alternativamente, un comentario `/* sentinel-disable-next-line boton-nativo */` para líneas individuales.
