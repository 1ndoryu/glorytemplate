# Plan: Grupos de Ejecución (multi-panel de tareas y hábitos)

## Resumen
Añadir un concepto de **grupo** a las tareas y hábitos para poder abrir varios paneles de ejecución simultáneamente, cada uno mostrando un grupo distinto. Esto permite, por ejemplo, tener un panel con el grupo "Trabajo" y otro con el grupo "Personal" a la vista sin mezclar elementos.

## Decisiones del usuario
- Las tareas y hábitos sin grupo permanecen en el estado base "Sin grupo".
- Los subhábitos siempre heredan el grupo de su hábito padre.
- Las subtareas siempre heredan el grupo de su tarea padre.
- Eliminar un grupo no borra sus tareas/hábitos; simplemente pasan a "Sin grupo".
- El cambio de grupo debe ser rápido: menú contextual en la sección de acciones del panel, no modal.
- Se puede crear un grupo nuevo desde el mismo menú contextual.
- Al crear una tarea/hábito se puede elegir el grupo (creación rápida).
- Arrastrar una tarea fuera de un panel a otro grupo debe funcionar.
- Cada panel debe recordar el grupo que tenía abierto tras recargar.

## Terminología
- **Grupo:** etiqueta de agrupación asignada a tareas y hábitos. No es un proyecto ni una carpeta; es un filtro visual del panel de ejecución.
- **Sin grupo:** estado por defecto. Muestra todas las tareas y hábitos que no tienen grupo asignado.

## Modelo de datos

### Entidades afectadas
- `Tarea`: añadir campo opcional `grupoId?: number` o `grupoNombre?: string`.
- `Habito`: añadir campo opcional `grupoId?: number` o `grupoNombre?: string`.

### Opción recomendada: grupo por nombre normalizado
Dado que los grupos son simples etiquetas, se puede usar un `string` con el nombre del grupo. Esto evita tener que gestionar una tabla extra y permite cambios simples.

```typescript
interface Tarea {
  ...
  grupo?: string | null;
}

interface Habito {
  ...
  grupo?: string | null;
}
```

### Persistencia
- Añadir columna `grupo` (VARCHAR nullable) en `wp_glory_tareas`.
- Añadir columna `grupo` (VARCHAR nullable) en `wp_glory_habitos`.
- Reutilizar `null` o cadena vacía para "Sin grupo".

## Backend

### Base de datos
- `App/Database/Schema.php`: añadir columnas `grupo VARCHAR(255) NULL` a `wp_glory_tareas` y `wp_glory_habitos`.

### Repositorios
- `App/Repository/TareasRepository.php`: leer/escribir `grupo`.
- `App/Repository/HabitosRepository.php`: leer/escribir `grupo`.

### API
- Endpoints de tareas/hábitos deben aceptar y devolver el campo `grupo`.
- Opcional: endpoint para listar grupos existentes (`/grupos`).

## Frontend

### Estado global (opcional)
Archivo: `App/React/stores/gruposStore.ts`

Zustand store para gestionar:
- `grupos: string[]` — lista de grupos existentes.
- `crearGrupo(nombre)` — añade un grupo localmente y opcionalmente en servidor.
- `eliminarGrupo(nombre)` — opcional, solo marca tareas/hábitos como sin grupo.

### Hook del panel de ejecución
Archivo: `App/React/hooks/usePanelEjecucion.ts` (nuevo o extendido)

- Recibir `grupoActivo`.
- Filtrar tareas y hábitos por `grupoActivo`.
- Gestionar creación rápida con `grupo` pre-asignado.

### Sección de acciones del panel
Archivo: `App/React/components/paneles/PanelEjecucion.tsx` o similar.

Añadir en la sección de acciones:
- Botón "Grupo" con menú contextual desplegable.
- Menú contextual:
  - Opción "Sin grupo".
  - Separador.
  - Lista de grupos existentes.
  - Separador.
  - Opción "Crear nuevo grupo" (abre pequeño input inline o modal minimalista).
  - Opción "Gestionar grupos" (opcional, para renombrar/eliminar).

### Creación rápida con grupo
Archivo: `App/React/components/dashboard/InputNuevaTarea.tsx` o similar.

- Si el panel tiene un grupo activo, las tareas/hábitos creados desde "creación rápida" se asignan a ese grupo por defecto.
- Añadir opción en `creacionRapidaOpciones` para elegir otro grupo al crear.

### Drag & drop entre grupos
- Extender la lógica de drag & drop existente para permitir soltar una tarea sobre un grupo del menú contextual.
- Al soltar, actualizar `grupo` de la tarea/hábito.
- Los hábitos arrastrados mantienen sus subhábitos (el grupo se propaga visualmente).

### Persistencia del grupo abierto por panel
- El layout actual ya permite guardar configuración de paneles.
- Extender el objeto de configuración del panel de ejecución para incluir `grupoAbierto?: string | null`.
- Al cargar el dashboard, restaurar el grupo en cada panel.

## Visualización

### Lista de tareas filtrada
- `ListaTareas.tsx`: aceptar prop `grupo` y filtrar `tareas` antes de mostrar.
- Opcional: mostrar badge del grupo en cada tarea si el panel está en modo "Sin grupo".

### Tabla de hábitos filtrada
- `TablaHabitos.tsx`: aceptar prop `grupo` y filtrar `habitos` antes de mostrar.

### Panel de ejecución
- Mostrar el grupo activo en el encabezado del panel.
- Permitir cambiar de grupo rápidamente desde las acciones del panel.

## Edge cases
- **Subhábitos y subtareas:** siempre heredan el grupo del padre. No se puede asignar grupo directamente.
- **Eliminar grupo:** al eliminar un grupo, todas las tareas/hábitos con ese grupo pasan a `null`. El panel que lo tenía abierto debe volver a "Sin grupo".
- **Renombrar grupo:** si se usa nombre como clave, renombrar implica actualizar todas las filas afectadas.
- **Grupo vacío:** si un panel muestra un grupo sin tareas/hábitos, mostrar estado vacío con opción de crear o cambiar de grupo.
- **Múltiples paneles:** dos paneles pueden mostrar el mismo grupo o grupos distintos. El estado de cada panel es independiente.

## Orden de implementación
1. Backend: Schema + repositorios (columna `grupo`).
2. Tipos: añadir `grupo?: string | null` a `Tarea` y `Habito`.
3. Hook `usePanelEjecucion` para filtrar por grupo.
4. Menú contextual de grupos en la sección de acciones del panel.
5. Creación rápida con grupo por defecto.
6. Drag & drop para mover tareas/hábitos entre grupos.
7. Persistir `grupoAbierto` en la configuración del layout.
8. Actualizar componentes `ListaTareas` y `TablaHabitos` para aceptar y filtrar por grupo.
9. Typecheck, tests y revisión.

## Estado actual del implementación
- ⏳ Backend (Schema + repositorios).
- ⏳ Tipos.
- ⏳ Hook de filtrado.
- ⏳ Menú contextual de grupos.
- ⏳ Creación rápida con grupo.
- ⏳ Drag & drop entre grupos.
- ⏳ Persistencia del grupo abierto por panel.
- ⏳ Tests y revisión.
