# Especificación de Alineación del Calendario CAP

## Estado Actual
El calendario presenta problemas de alineación vertical y horizontal debido a:
1. **Desfase en el Eje Y**: La columna de horas ("Time Column") usa un padding arbitrario (`35px`) que no coincide con la altura de los cabeceros de las columnas de días (`48px`).
2. **Padding Interno**: `ZonaDropDia` aplica un `padding: var(--cap-espacio-sm)` que empuja el contenedor de las tarjetas hacia abajo y hacia la derecha, rompiendo la coordenada `(0,0)` relativa al grid.
3. **Alturas Hardcodeadas**: Existen discrepancias entre las alturas definidas en CSS (`60px`) y las calculadas dinámicamente en JS (`90px`), lo que dificulta el mantenimiento.

## Objetivo
Lograr una alineación "pixel-perfect" donde:
- El borde superior de la tarjeta de las 08:00 coincida exactamente con la línea de las 08:00.
- La altura de las tarjetas sea matemáticamente precisa respecto a su duración.

## Plan de Solución Técnica

### 1. Estandarización de Constantes
Definir constantes globales en un solo lugar para ser usadas tanto en JS como en CSS (vía variables o estilos inline).

| Constante         | Valor Propuesto    |
| :---------------- | :----------------- |
| `HEADER_HEIGHT`   | `48px`             |
| `SLOT_HEIGHT`     | `90px` (1.5px/min) |
| `GRID_START_TIME` | 08:00              |

### 2. Corrección de Estructura DOM

**A. CalendarioSemanal.tsx (Grid Container)**
- Eliminar `paddingTop: '35px'` de la columna de horas.
- Insertar un elemento "Spacer" en la columna de horas que replique la altura del `capColumnaDia__header` (`48px`).

```tsx
<div className="capCalendarioGrid__horas">
    <div className="capCalendarioGrid__horaHeaderSpacer" style={{height: '48px', borderBottom: '1px solid ...'}} />
    {/* Slots de horas... */}
</div>
```

**B. ColumnaDia.tsx & Styles**
- Modificar `ZonaDropDia` para que **NO** tenga padding, o que el padding sea manejado internamente sin afectar el posicionamiento absoluto.
- Asegurar que `capColumnaDia__slots` tenga `top: 0` relativo al final del header.

**C. CSS (calendario.css)**
- Eliminar `height: 60px` de `.capCalendarioGrid__horaSlot` para que dependa puramente del estilo en línea (para facilitar el zoom/scaling en el futuro).
- Eliminar `gap` en `.capColumnaDia__slots` si interfiere.
- Eliminar `padding` de `.capZonaDropDia` o moverlo a un contenedor interno que no envuelva a los slots absolutos (o usar `box-sizing` y márgenes negativos si es estrictamente necesario mantener el area de drop).

### 3. Ajuste de Coordenadas de Tarjetas

Si la tarjeta comienza a las 08:00:
- **Top**: `0px`.
- **Height**: `(Duración en Minutos) * 1.5`.

Si el contenedor de slots empieza *inmediatamente* después del header:
- La línea visual de las 08:00 en la Columna de Horas debe coincidir con el `border-bottom` del Spacer (header).
- O si la línea de 08:00 es la primera línea del grid, entonces el Spacer debe terminar justo donde empieza el slot de las 08:00.

### 4. Diagrama de Alineación
```
+----------------+ +------------------------+
| HEADER (Spacer)| | HEADER (Lunes 26)    |  <-- Height: 48px
+----------------+ +------------------------+
| 08:00 Label    | | Tarea (08:00)          |  <-- Top: 0px
| (Border Top)---| |------------------------|
|                | |                        |
| 09:00 Label    | |                        |
+----------------+ +------------------------+
```

## Pasos de Ejecución
1. **CSS**: Quitar paddings conflictivos en `capZonaDropDia` y `capCalendarioGrid__horas`. Corregir el spacer.
2. **TSX**: Implementar el spacer en la columna de horas.
3. **Verificación**: Comprobar alineación visual.
