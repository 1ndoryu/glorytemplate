# Logic

Documentación rápida del sistema Logic implementado en el tema Glory.

## Contexto general

-   Página registrada por `PageManager` con slug `logic` y renderizada en `App/Templates/pages/logic.php`.
-   Usa el postType `tarea` existente, etiquetando cada paso con el meta `sesion = logic`.
-   El header se oculta vía `App/Config/control.php` cuando se visita esta página.
-   Assets propios:
    -   `App/Assets/css/logic.css`
    -   `App/Assets/js/logic.js`

## Flujo principal

1. El usuario fija pasos desde el input central o desde los botones de hábitos (Ejercicio, Leer, Meditar).
2. Cada paso crea una tarea tipo `tarea` con estado `pendiente`, importancia “importante” y datos adicionales (`logicCreado*`, `logicInicio*`, `logicTimeline`).
3. Se limita a **5 pasos simultáneos** (constante `GLORY_LOGIC_MAX_STEPS`, valor por defecto definido al cargar `taskLogicService`).
4. Los pasos activos se muestran en una lista drag & drop; cada fila:
    - Handle para reordenar.
    - Cronómetro individual en vivo.
    - Botón “Liberar” que completa el paso (estado `completada`) y cierra la sesión de tiempo.
5. El orden personalizado por usuario se guarda en el meta `logic_order`.

## UI extendida

-   El layout ahora usa un componente de pestañas (`Pasos` / `Historial`) basado en la clase `gloryTabs`.
-   La pestaña `Historial` lista los **30** pasos completados más recientes (`GLORY_LOGIC_HISTORY_LIMIT`) incluyendo duración, inicio/fin y permite eliminar cada registro.
-   Los pasos activos incluyen un botón **Pausar/Reanudar** además del botón **Liberar**. Se muestra una insignia “En pausa” mientras esté detenido.
-   La sección de hábitos rápidos muestra los atajos guardados y un botón “Añadir otro” que abre el modal del componente Glory, manteniendo el límite de 12 hábitos.
-   Cada hábito admite clic derecho para abrir un submenú con acciones de “Cambiar nombre” o “Eliminar”, reutilizando el mismo modal para la edición.
-   El mensaje de ayuda se administra en la nueva pestaña `Configuración`, separada del `Historial`, y sigue apareciendo como recordatorio global si está activo.

## Organización del código

-   Backend de Logic dividido en `App/Task/Logic/`:
    -   `constants.php`: define límites y valores por defecto.
    -   `request.php`: sanitiza/valida solicitudes AJAX.
    -   `order.php`: helpers para el orden personalizado por usuario.
    -   `preferences.php`: hábitos rápidos y mensajes de ayuda (userMeta).
    -   `history.php`: consultas y operaciones sobre el historial.
    -   `tasks.php`: constructores de payloads, contadores y utilidades de tareas activas.
    -   `ajax.php`: endpoints `wp_ajax_*` y registros de hooks.
-   `App/Task/taskLogicService.php` únicamente carga los módulos anteriores si la feature `task` está activa.
-   Frontend JS vive ahora en `App/Assets/js/logic/`:
    -   `core.js`: estado global, helpers y cliente AJAX.
    -   `render.js`: todo el pintado de UI, timers y drag & drop.
    -   `actions.js`: llamadas AJAX + sincronización de estado local.
    -   `events.js`: listeners para inputs, botones, pestañas y drag.
    -   `main.js`: arranca la interfaz.
-   La plantilla `logic.php` registra/encola los scripts en cadena (`tema-logic-core` → `render` → `actions` → `events` → `main`) y localiza `logicInitialState` en el handle final.

## Servicio backend (`App/Task/taskLogicService.php`)

### Metas y datos guardados por tarea

| Meta                       | Descripción                                                   |
| -------------------------- | ------------------------------------------------------------- |
| `sesion`                   | Siempre `logic` para identificar los pasos.                   |
| `logicCreadoUtc/Timestamp` | Momento en el que se insertó la tarea.                        |
| `logicInicioUtc/Timestamp` | Marca de tiempo desde la cual corre el cronómetro.            |
| `logicFinUtc/Timestamp`    | Se completa al liberar el paso.                               |
| `logicTimeline`            | Array JSON con eventos `creado`, `inicio`, `finalizado`, etc. |
| `logicPausado`             | Flag 1/0 para indicar si el paso está detenido.               |
| `logicPausadoElapsed`      | Total de segundos acumulados al momento de pausar.            |

### Almacenamiento adicional

-   `logic_order` (userMeta): lista de IDs que define el orden visible.
-   `logic_quick_habits` (userMeta): colección de hábitos rápidos (máx. 12).
-   `logic_help_message` (userMeta): mensaje corto + vigencia (timestamp).

### Endpoints AJAX

Todos requieren `nonce logic_actions` y capabilities de edición (`edit_posts`).

| Acción                    | Parámetros principales                              | Resultado                                                                                                                |
| ------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `logic_start_step`        | `titulo`                                            | Crea una tarea, actualiza orden y devuelve `tasks`, `limit`, `limitReached`, `mensaje`. Rechaza si se alcanza el límite. |
| `logic_finish_step`       | `taskId` (opcional, toma la primera si no se envía) | Marca el paso como completado, registra fin en timeline y regresa el estado actualizado.                                 |
| `logic_get_state`         | —                                                   | Solo devuelve el estado actual (`tasks`, `limit`, `limitReached`).                                                       |
| `logic_reorder_steps`     | `order[]` con IDs en el nuevo orden                 | Persiste el nuevo orden del usuario, valida que coincida con los pasos activos.                                          |
| `logic_pause_step`        | `taskId`                                            | Registra la pausa del paso (`logicPausado*`) y actualiza `tasks`.                                                        |
| `logic_resume_step`       | `taskId`                                            | Calcula un nuevo `logicInicioTimestamp` en base al acumulado y reanuda el cronómetro.                                    |
| `logic_get_history`       | `limit` opcional (<=100)                            | Devuelve los últimos pasos completados (`history`).                                                                      |
| `logic_delete_history`    | `historyId`, `limit`                                | Envía el registro seleccionado a la papelera y regresa el historial actualizado.                                         |
| `logic_add_habit`         | `titulo`                                            | Inserta un nuevo hábito rápido (máx. 12) y retorna la lista saneada (`habits`).                                          |
| `logic_get_habits`        | —                                                   | Obtiene los hábitos rápidos guardados para el usuario.                                                                   |
| `logic_save_help_message` | `mensaje`, `duracion` (segundos, 60–86400)          | Guarda o elimina el mensaje de ayuda y regresa `helpMessage`.                                                            |
| `logic_get_help_message`  | —                                                   | Devuelve el mensaje de ayuda vigente (si existe).                                                                        |
| `logic_add_context`       | `texto`                                             | Crea un bloque de contexto y retorna la lista actualizada (`contexts`).                                                  |
| `logic_update_context`    | `contextId`, `texto`                                | Actualiza el texto de un contexto existente y devuelve `contexts`.                                                       |
| `logic_delete_context`    | `contextId`                                         | Elimina un bloque de contexto y retorna la lista actualizada.                                                            |
| `logic_reorder_contexts`  | `order[]` con IDs en el nuevo orden                 | Persiste el nuevo orden de contextos y devuelve `contexts`.                                                              |
| `logic_get_contexts`      | —                                                   | Obtiene todos los bloques de contexto del usuario.                                                                       |

## Frontend

### Plantilla (`App/Templates/pages/logic.php`)

-   Renderiza:
    -   Pregunta principal + input.
    -   Pestañas `Pasos` y `Historial`.
    -   Lista de pasos (`ul#logicList`).
    -   Mensajes vacíos (`#logicEmpty`, `#logicHistoryEmpty`).
    -   Sección de hábitos rápidos + formulario para crear nuevos.
    -   Historial con botones para eliminar cada registro y controles para mensajes de ayuda.
    -   Contenedor para mensajes de estado `#logicStatus`.
-   Localiza `logicInitialState` con tareas, límite, hábitos, historial, mensaje de ayuda y textos traducibles.

### JS (`App/Assets/js/logic.js`)

-   Maneja:
    -   Creación de pasos (input + hábitos).
    -   Bloqueo cuando se alcanza el límite.
    -   Timers en vivo usando `setInterval` (se detienen si el paso está pausado).
    -   Drag & drop nativo para ordenar (solo desde el handle, envía `logic_reorder_steps`).
    -   Botones “Pausar/Reanudar” y “Liberar” por fila.
    -   Gestión de historial (listar, refrescar y eliminar registros) mediante los nuevos endpoints AJAX.
    -   Mantenimiento del formulario de hábitos rápidos y del mensaje de ayuda.
    -   Mensajes en `logicStatus` y sincronización del mensaje global mostrado al pie.

### CSS (`App/Assets/css/logic.css`)

-   Estilos inspirados en `task.css`: layout centrado, tarjeta oscura, lista con handles, botones redondeados y diseño responsive.
-   Incluye estilos propios para el sistema de pestañas, historial, formulario de hábitos y mensaje de ayuda.

## Extender o depurar

-   Ajustar el límite global editando `GLORY_LOGIC_MAX_STEPS` al cargar `taskLogicService`.
-   Revisar historial de un paso leyendo el meta `logicTimeline` (array con eventos y timestamps).
-   Para deshabilitar Logic basta con quitar la definición de la página en `App/Config/pages.php` o desactivar la feature `task`.

## API pública
-   Define la clave en **Opciones del tema → Logic → API → API Key pública de Logic** (`glory_logic_api_key`) o mediante la variable de entorno `LOGIC_API_KEY`. La constante `GLORY_LOGIC_PUBLIC_API_KEY` se puede sobreescribir manualmente si necesitas un valor fijo.
-   El espacio `wp-json/glory-logic/v1` permite consultar estado, historial, hábitos y mensaje de ayuda, además de crear/pausar/liberar pasos y administrar hábitos/mensajes.
-   La especificación completa con ejemplos está documentada en `App/Config/logic-api.md`.
