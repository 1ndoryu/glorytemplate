# Plan: División de paneles dentro de una columna

## Resumen
Permitir dividir un panel en dos dentro de la misma columna del layout. Esto aplica principalmente al panel de ejecución y al panel de notas. No se añaden más columnas al layout; solo se permite que un panel ocupe la mitad de su columna y se muestren dos vistas independientes una al lado de la otra.

## Decisiones del usuario
- Solo aplica para paneles que tengan sentido dividir: panel de ejecución y panel de notas.
- Cada mitad del panel dividido es independiente (por ejemplo, dos grupos distintos en ejecución o dos notas distintas en notas).
- El botón de "Dividir" estará en las opciones del panel.
- No se permite anidar divisiones (solo un nivel de división por panel).

## Terminología
- **Panel:** componente visual dentro de una columna del layout.
- **Panel dividido:** panel que contiene dos sub-paneles renderizados lado a lado dentro de la misma columna.
- **Sub-panel:** cada mitad del panel dividido. Se comporta como un panel independiente con su propio estado y configuración.

## Modelo de datos

### Configuración del layout
Actualmente el layout probablemente tiene una estructura similar a:

```typescript
interface PanelConfig {
  id: string;
  tipo: 'ejecucion' | 'notas' | 'habitos' | ...;
  // otras opciones
}

interface ColumnaLayout {
  paneles: PanelConfig[];
}

interface LayoutConfig {
  columnas: ColumnaLayout[];
}
```

Extender `PanelConfig` para soportar división:

```typescript
interface PanelConfig {
  id: string;
  tipo: string;
  dividido?: boolean;
  subPanelIzquierda?: SubPanelConfig;
  subPanelDerecha?: SubPanelConfig;
}

interface SubPanelConfig {
  id: string;
  // estado específico del sub-panel
  // Ejemplo para notas:
  notaId?: number;
  // Ejemplo para ejecución:
  grupo?: string | null;
}
```

### Persistencia
- Guardar la configuración de `dividido`, `subPanelIzquierda` y `subPanelDerecha` junto con el resto del layout (localStorage, base de datos de usuario o configuración de panel).

## Frontend

### Componente Panel base
Archivo: `App/React/components/paneles/Panel.tsx` o similar.

Añadir lógica condicional:
- Si `panel.dividido === true`, renderizar dos contenedores lado a lado (50 % / 50 %).
- Cada contenedor renderiza el mismo componente de panel pero con una configuración diferente.
- Si no está dividido, renderizar el panel normalmente.

### Botón de dividir en opciones del panel
Archivo: `App/React/components/paneles/PanelOpciones.tsx` o similar.

Añadir acción "Dividir panel":
- Solo visible para tipos de panel soportados (`ejecucion`, `notas`).
- Al hacer clic, marcar `panel.dividido = true` y copiar la configuración actual a ambos sub-paneles.
- Si ya está dividido, mostrar "Unir panel" para revertir.

### Paneles soportados

#### Panel de notas
- Ya soporta múltiples instancias/notas abiertas.
- Al dividir, cada sub-panel puede mostrar una nota distinta.
- El estado de cada sub-panel incluye `notaId`.

#### Panel de ejecución
- Al dividir, cada sub-panel puede mostrar un grupo distinto.
- El estado de cada sub-panel incluye `grupo` (ver `PLAN_GRUPOS_EJECUCION.md`).
- Esto permite tener, por ejemplo, el grupo "Trabajo" a la izquierda y "Personal" a la derecha.

### Layout y CSS
- Cada columna del layout sigue siendo una columna flex/grid.
- Dentro de un panel dividido, los dos sub-paneles se muestran con `display: flex; flex-direction: row`.
- Cada sub-panel ocupa el 50 % del ancho disponible.
- Resizer opcional para ajustar el ancho (futuro).
- En móvil, los sub-paneles deben apilarse verticalmente o deshabilitarse la división.

## Backend
- No requiere cambios en backend. Es pura configuración de frontend.
- Si el layout se persiste en servidor, asegurar que el nuevo formato de `PanelConfig` sea aceptado y devuelto.

## Orden de implementación
1. Extender tipos de `PanelConfig` y `LayoutConfig` para soportar `dividido` y sub-paneles.
2. Modificar el componente base de panel para renderizar sub-paneles cuando corresponda.
3. Añadir botón "Dividir panel" en las opciones del panel (solo para tipos soportados).
4. Implementar lógica de "Unir panel".
5. Adaptar panel de notas para soportar estado por sub-panel.
6. Adaptar panel de ejecución para soportar grupo por sub-panel (depende de `PLAN_GRUPOS_EJECUCION.md`).
7. Persistir el nuevo formato de layout.
8. Ajustar CSS para escritorio y móvil.
9. Typecheck, tests y revisión.

## Dependencias con otros planes
- `PLAN_GRUPOS_EJECUCION.md`: el panel de ejecución dividido se beneficia enormemente de los grupos, ya que permite ver dos grupos simultáneamente.
- `PLAN_DEPENDENCIAS.md`: sin dependencia directa, pero comparte componentes del panel de ejecución.

## Edge cases
- **Panel no soportado:** ocultar el botón de dividir.
- **Panel ya dividido:** mostrar "Unir panel" y no permitir dividir otra vez.
- **Cierre de un sub-panel:** al cerrar un sub-panel, el otro puede ocupar el 100 % o el panel puede volver a estado no dividido.
- **Cambio de tipo de panel:** si un panel dividido cambia a un tipo no soportado, se debe unir automáticamente.
- **Móvil:** la división horizontal puede no ser usable; considerar desactivarla o apilar verticalmente.
- **Persistencia antigua:** si se carga un layout viejo sin los nuevos campos, tratarlos como panel no dividido.

## Estado actual del implementación
- ⏳ Tipos de layout extendidos.
- ⏳ Componente base de panel adaptado.
-  Botón de dividir en opciones del panel.
- ⏳ Lógica de unir panel.
- ⏳ Soporte de notas divididas.
- ⏳ Soporte de ejecución dividida.
- ⏳ Persistencia del layout.
- ⏳ Tests y revisión.
