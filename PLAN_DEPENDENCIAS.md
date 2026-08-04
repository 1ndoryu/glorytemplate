# Plan: Dependencias Condicionales para Tareas, Hábitos y Subhábitos

## Resumen
Implementar dependencias condicionales entre tareas, hábitos y subhábitos. Un elemento no se puede marcar como completado hasta que sus dependencias estén cumplidas. Los elementos dependientes se mostrarán con opacidad reducida y un badge de candado. Al intentar completar un elemento bloqueado, la dependencia faltante parpadeará y se mostrará una alerta.

Se añadirán dos modos de condición:
- **Estricto:** la dependencia se reinicia cada día/periodo según la frecuencia del elemento requerido.
- **Suave:** una vez cumplida, la dependencia queda desbloqueada indefinidamente aunque el dependiente no se haya completado.

## Decisiones del usuario
- La configuración de dependencias se integra en el modal de configuración existente de cada tarea, hábito o subhábito.
- Se permite configurar la relación desde ambos lados: "Depende de" y "Es requisito para".
- Para hábitos, una dependencia se considera cumplida según su frecuencia (ej: diario = hoy, semanal = esta semana).
- Las dependencias circulares se bloquearán al crearlas por ser lo más lógico.
- La funcionalidad es gratuita, pero la lógica se encapsulará para facilitar un switch a premium en el futuro.

## Modelo de datos
Añadir un campo `dependencias` a `Tarea`, `Habito` y `SubHabito`:

```typescript
interface ReferenciaDependencia {
    tipo: 'tarea' | 'habito' | 'subhabito';
    id: number;
    padreId?: number;            // obligatorio para subhábitos
    nombreSnapshot?: string;     // nombre capturado al guardar
    modo?: 'estricto' | 'suave'; // por defecto 'estricto'
}
```

- `Tarea.dependencias?: ReferenciaDependencia[]`
- `Habito.dependencias?: ReferenciaDependencia[]`
- `SubHabito.dependencias?: ReferenciaDependencia[]`

### Persistencia
- Añadir columna `dependencias` (LONGTEXT JSON) en `wp_glory_tareas`.
- Añadir columna `dependencias` (LONGTEXT JSON) en `wp_glory_habitos`.
- Para subhábitos, el campo se guarda dentro del JSON del hábito padre (como parte del array `subhabitos`).
- Los repositorios deben serializar/deserializar el JSON al leer y escribir.

## Backend
### Base de datos
- `App/Database/Schema.php`: añadir columna `dependencias LONGTEXT` a `wp_glory_tareas` y `wp_glory_habitos`.

### Repositorios
- `App/Repository/TareasRepository.php`:
  - Al leer: `json_decode($fila->dependencias, true) ?: []`.
  - Al guardar: `json_encode($tarea->dependencias)`.
- `App/Repository/HabitosRepository.php`:
  - Igual para hábitos, incluyendo subhábitos.

### API (si aplica)
- Asegurar que los endpoints de tareas/hábitos incluyan el campo `dependencias`.
- Validar dependencias circulares en el servidor antes de guardar (opcional pero recomendado).

## Lógica de validación
Archivo: `App/React/utils/dependencias.ts`

Funciones principales:
- `esDependenciaCumplida(ref, tareas, habitos)`: evalúa si una dependencia individual está cumplida según su tipo y frecuencia.
- `verificarDependencias(elemento, tareas, habitos)`: retorna `{bloqueado, bloqueantes}`.
- `obtenerNombreDependencia(ref, tareas, habitos)`: resuelve el nombre del elemento para tooltips y alertas.
- `detectarCicloDependencias(...)`: DFS para evitar dependencias circulares al guardar.

### Reglas de cumplimiento
- **Tarea**: cumplida si `tarea.completado === true`.
- **Hábito**: cumplido si `fueCompletadoHoy(...) === true`. Si no está completado hoy, se evalúa la frecuencia: si no toca hoy, se asume cumplido.
- **Subhábito**: igual que hábito, pero usa `padreId` para ubicar el hábito padre. Si no toca hoy según su frecuencia (propia o heredada del padre), se asume cumplido.
- **Elemento eliminado**: se asume cumplido (no bloquea).
- **Modo estricto (`estricto`)**: se evalúa el cumplimiento en el periodo actual según la frecuencia. Si no se cumple en el periodo actual, bloquea.
- **Modo suave (`suave`)**: se evalúa si la dependencia fue **alguna vez** cumplida (persistiendo una fecha de cumplimiento o un flag). Una vez cumplida, no vuelve a bloquear aunque el dependiente no se haya completado.

## Modos estricto y suave
### Persistencia del modo suave
Para soportar el modo suave se debe persistir un registro de que la dependencia fue cumplida en algún momento:
- Opción A: en el elemento dependiente, guardar `cumplidoEn algun momento: true` dentro de cada `ReferenciaDependencia`.
- Opción B: crear una tabla de relaciones `wp_glory_dependencias_cumplidas` con columnas: `tipo_requerido`, `id_requerido`, `padre_id_requerido`, `tipo_dependiente`, `id_dependiente`, `padre_id_dependiente`, `cumplido_en`.
- Opción recomendada B para no perder el historial y poder revertir.

### Evaluación
- **Estricto**: `cumplidoEnPeriodoActual(ref) === true`.
- **Suave**: `haSidoCumplidaAlgunaVez(ref) === true`.

## UI Store
Archivo: `App/React/stores/dependenciasUIStore.ts`

Zustand store para controlar el efecto de destello:
- `destello: DependenciaDestello | null`
- `destelloTick: number`
- `activarDestello(destello)`: establece el elemento que debe parpadear.
- `limpiarDestello()`: limpia el estado.

## Custom hook
Archivo: `App/React/hooks/useDependenciasElemento.ts`

Hook reutilizable que encapsula `verificarDependencias` y `obtenerNombreDependencia`:
- Entrada: tipo, id, padreId, objeto con `dependencias`, arrays de tareas y hábitos.
- Salida: `{bloqueado, bloqueantes, nombresBloqueantes, mensajeBloqueo}`.

Usado en `TareaItem.tsx`, `TablaHabitos.tsx` y cualquier otro componente que necesite evaluar dependencias.

## Modal de configuración
Archivo: `App/React/components/dashboard/ModalDependencias.tsx`

Componente reutilizable para seleccionar dependencias:
- Buscador unificado de tareas, hábitos y subhábitos.
- Toggle modo: "Depende de" o "Es requisito para".
- Selector de modo: "Estricto" o "Suave" para cada dependencia.
- Lista de dependencias actuales con opción de eliminar.
- Snapshot del nombre de cada dependencia al agregarla.

### Corrección de buscador
Actualmente al seleccionar la tarea condicional no aparecen tareas en el buscador. Se debe:
- Verificar que el buscador reciba la lista completa de `tareas`.
- Asegurar que el filtro no excluya el propio elemento en edición de forma que oculte todos los resultados.
- Revisar que el modal reciba correctamente las props `tareasParaDependencias` y `habitosParaDependencias`.
- Revisar que los elementos ya seleccionados como dependencia no se filtren del buscador.

### Integración
- `PanelConfiguracionTarea.tsx` + `FormularioTareaModerno.tsx`: sección "Dependencias".
- `FormularioHabitoModerno.tsx`: sección "Dependencias" para hábitos.
- `ModalHabito.tsx` + `useModalHabito.ts`: gestión de estado `dependencias` para hábitos y subhábitos.
- Propagación de `tareas` e `habitos` desde `ListaTareas.tsx`, `TablaHabitos.tsx` y `PanelFocoPrioritario.tsx` hasta los formularios.

## Visualización
### Tareas
- `TareaItem.tsx`: si tiene dependencias no cumplidas, aplica opacidad reducida y muestra badge de candado.
- El candado muestra el nombre de la dependencia bloqueante en `title`.
- Al intentar completar, si está bloqueado: cancela la acción, activa el destello en el elemento bloqueante y muestra alerta.

### Hábitos y subhábitos
- `TablaHabitos.tsx`: filas de hábito y subhábito con opacidad reducida y badge candado cuando están bloqueados.
- El checkbox llama a la lógica de dependencias antes de `onToggle`.

### Efectos visuales
Clases CSS a implementar en `style.css`:
- `.dependenciaBloqueada`: opacidad ~50%.
- `.dependenciaDestello`: animación de parpadeo/brillo.
- `.dependenciaBadge`: estilo del candado con tooltip.

## Comportamiento al intentar completar
- `TareaItem.tsx`: en el handler de toggle/completar, verificar dependencias. Si bloqueado:
  - `e.stopPropagation()` y `e.preventDefault()`.
  - Llamar `activarDestello(...)` sobre el primer bloqueante.
  - Mostrar alerta con el mensaje de bloqueo.
- `TablaHabitos.tsx`: idem para filas de hábito/subhábito.

## Edge cases
- **Elemento dependencia eliminado**: se asume cumplido.
- **Dependencia circular**: bloqueada al guardar (frontend; idealmente también backend).
- **Subhábito como dependencia**: requiere `padreId`.
- **Hábitos con frecuencia personalizada**: usar `tocaHoy` y `fueCompletadoHoy` existentes.
- **Time tracking**: decidir si se permite iniciar tracking en una tarea bloqueada (recomendado: no bloquear, solo el completado).
- **Modo "Es requisito para"**: UI actual solo persiste relaciones "depende de". Si se implementa bidireccionalmente, se debe actualizar `dependencias` en ambos elementos y detectar ciclos.
- **Modo suave y recarga**: persistir el cumplimiento histórico en base de datos para que no se pierda tras recargar.

## Orden de implementación
1. Backend: Schema + repositorios (tareas y hábitos) con campo `dependencias`.
2. Tabla/historial para modo suave (`wp_glory_dependencias_cumplidas`).
3. Actualizar tipos e interfaces en `App/React/types/dashboard.ts` con `modo`.
4. Utilidad `App/React/utils/dependencias.ts` con soporte de modo suave.
5. Store `App/React/stores/dependenciasUIStore.ts`.
6. Hook `App/React/hooks/useDependenciasElemento.ts`.
7. Modal `App/React/components/dashboard/ModalDependencias.tsx` con selector de modo.
8. Corregir bug del buscador de tareas en el modal.
9. Integración en formularios existentes.
10. Visualización candado/opacidad en `TareaItem.tsx` y `TablaHabitos.tsx`.
11. Parpadeo y alerta al intentar completar.
12. Typecheck, tests y revisión.

## Estado actual del implementación
- ✅ Tipos e interfaces (sin modo suave).
- ✅ Utilidad `dependencias.ts`.
- ✅ Store de destellos.
- ✅ Hook `useDependenciasElemento`.
- ✅ Modal `ModalDependencias`.
- ✅ Integración en formularios de tareas y hábitos.
- ✅ Visualización en `TareaItem` y `TablaHabitos`.
- ✅ Efecto de destello y alerta.
- ✅ Typecheck pasa sin errores.
- ⏳ Persistencia en backend (Schema + repositorios).
- ⏳ Modo estricto/suave.
- ⏳ Tabla de dependencias cumplidas para modo suave.
- ⏳ Corrección del buscador de tareas en el modal.
- ⏳ Tests unitarios.
