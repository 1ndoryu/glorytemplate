---
applyTo: '**'
---

# Protocolo de Desarrollo y Conducta (v3.5)

## -1. REGLA DE CONCURRENCIA Y PROPIEDAD DE TAREAS (ABSOLUTAMENTE OBLIGATORIO)

> **ESTA REGLA TIENE PRIORIDAD SOBRE TODAS LAS DEMÁS. VIOLARLA INVALIDA TODO EL TRABAJO.**

### Identificación del Agente
- Al iniciar una sesión, el agente **DEBE** elegir un identificador único de 2-4 caracteres en formato `AG-XXXX` (ej: `AG-DAW`, `AG-FIX`, `AG-UI`, `AG-SEC`). Este identificador se basa en el dominio principal de las tareas asignadas.
- El identificador se usa para marcar propiedad de tareas en el roadmap y commits.

### Antes de Tocar Cualquier Tarea
1. **LEER el roadmap COMPLETO** antes de empezar cualquier trabajo.
2. **VERIFICAR** que la tarea NO esté marcada con `[EN CURSO — AG-XXXX]` por otro agente. Si lo está, **NO TOCARLA** bajo ninguna circunstancia.
3. **MARCAR** la tarea con `[EN CURSO — AG-TUIDENTIFICADOR]` en el roadmap **ANTES** de escribir una sola línea de código.
4. **COMMITEAR** la marca del roadmap inmediatamente si es posible, para que otros agentes la vean.

### Formato de Marcado en el Roadmap
```
TAREA LIBRE (disponible):
213. Descripción de la tarea...

TAREA TOMADA (prohibido tocar por otros):
213. [EN CURSO — AG-DAW] Descripción de la tarea... **Estado:** breve progreso.

TAREA COMPLETADA:
213. ✅ [AG-DAW] Descripción del resultado...
```

### Control de Commits
- **PROHIBIDO** hacer `git add .` o `git add --all`. Siempre agregar archivos explícitamente: `git add archivo1 archivo2`.
- **ANTES de commitear**, ejecutar `git diff --stat HEAD` y `git status` para verificar que solo se incluyen archivos modificados por TI en esta sesión.
- **Si detectas archivos modificados que NO son tuyos** (modificados por otro agente en paralelo), **NO los incluyas** en tu commit. Usa `git add` selectivo.
- **Mensaje de commit** debe incluir tu identificador: `[AG-DAW] C213+C214: descripción`.
- **Si hay conflictos** con cambios de otro agente, **DETENERTE** y notificar al usuario. No resolver conflictos de merge de otro agente.

### Prohibiciones Absolutas
- **PROHIBIDO** modificar archivos que otro agente marcó como en curso, incluso si crees que puedes "ayudar".
- **PROHIBIDO** marcar como completada una tarea de otro agente.
- **PROHIBIDO** revertir cambios de otro agente sin instrucción explícita del usuario.
- **PROHIBIDO** hacer commits que incluyan archivos no relacionados con tus tareas asignadas.
- **Si un archivo fue modificado por dos agentes**, se considera conflicto y requiere intervención del usuario.

### Secuencia Obligatoria al Empezar
```
1. Leer roadmap completo
2. Identificar tareas disponibles (sin marca [EN CURSO])
3. Elegir identificador AG-XXXX
4. Marcar tareas en roadmap con [EN CURSO — AG-XXXX]
5. Commitear roadmap (si posible)
6. Empezar a trabajar
```

## 0. INSTRUCCIÓN CRÍTICA DE FLUJO (VSCODE)

- **LO MAS IMPORTANTE: Maximización de Créditos y Autonomía:** Al recibir instrucciones, trabaja de forma prolongada y continua hasta completar la totalidad de la solicitud. **PROHIBIDO** detenerse para realizar consultas triviales, pedir confirmación paso a paso o dividir la tarea artificialmente. Cada interrupción innecesaria consume créditos del usuario; tu objetivo es la máxima eficiencia por interacción, esto significa que debes continuar prolongadamente todo lo posible sin detener la ejecución, y mantener el progreso actualizado con cada tarea cumplida.
- **Ejecución en Lote (Batching):** Si la solicitud implica múltiples pasos, metas o tareas, ejecútalas **todas** sin detenerte. Realiza tus propias validaciones internas, autotests y revisiones exhaustivas para garantizar que todo funcione correctamente antes de devolver el control.
- **Gestión del Roadmap:** El archivo de control de progreso (ej. `roadmap.md`) es el eje central de la comunicación asíncrona:
- Al completar una tarea, actualiza inmediatamente el estado en el archivo. Esto es obligatorio, una tarea realizada --> actualizacion.
- Lee activamente el archivo en busca de nuevos comentarios o directrices que el usuario haya añadido durante tu ejecución.
- Si resuelves una duda o completas un punto, actualiza los comentarios correspondientes dentro del archivo.

- **Refactorización Oportunista:** Aprovecha la extensión de la iteración para aplicar mejoras arquitectónicas, limpiezas de código o refactorizaciones de bajo riesgo (sin romper funcionalidad) sin necesidad de pedir permiso explícito. El objetivo es entregar el máximo valor técnico y limpieza posible en cada respuesta.
- **Re-lectura del Roadmap (OBLIGATORIO):** Cada vez que completes una tarea o grupo de tareas, **DEBES** releer el archivo de roadmap/md de trabajo **ANTES** de continuar con la siguiente tarea o cerrar la interacción. El usuario puede haber añadido comentarios, correcciones o nuevas directrices mientras trabajabas. Ignorar esto es una violación del protocolo. Secuencia: terminar tarea -> actualizar md -> releer md completo -> continuar o cerrar.

## 1. Principios Generales y Comunicación

- **Idioma:** Español obligatorio en toda comunicación y nombres de clases CSS.
- **Ambigüedad:** Ante la duda, **PREGUNTA** antes de escribir código. (No es relevante en VSCODE si rompe el flujo del punto 0, priorizar sentido común).
- **Prohibiciones:** Cero emojis en código/comentarios.
- **Integridad:** Prohibido omitir código (`// ...resto`). Ediciones atómicas y completas.
- **Mentalidad:** Entender antes de modificar. Si ves una mejora arquitectónica posible, **hazla** (si es rápida) o deja un **TO-DO** comentado.

## 2. Estándares de Código y Comentarios

- **Nomenclatura JS/TS:** `camelCase` (vars/funcs), `PascalCase` (componentes/clases).
- **Nomenclatura CSS:** **Español** y `camelCase` (ej: `.contenedorPrincipal`, `.botonActivo`).
- **Limpieza:** Priorizar legibilidad. Evitar namespaces completos en imports.
- **Verificación de Referencias (CRÍTICO - ERRORES RECURRENTES):**
  - **Variables CSS:** Antes de usar cualquier variable CSS (`var(--nombre)`), **VERIFICAR** que existe en los archivos de variables (`variables.css`, `init.css`, etc.). Si no existe, **crearla primero** en el archivo de variables correspondiente. **PROHIBIDO** referenciar variables que no están declaradas.
  - **Imports y Componentes:** Al crear un componente nuevo, **VERIFICAR** que se importa y se usa donde corresponde. Un componente creado pero no importado/usado es código muerto y una violación directa de este protocolo. Secuencia obligatoria: crear componente -> importarlo donde se necesita -> usarlo en el JSX/render -> verificar que compila sin errores.
  - **Regla general:** Nunca referenciar algo que no existe (variables, componentes, funciones, tipos). Si lo creas, conéctalo. Si lo refieres, confírmalo.
- **Formato de Comentarios:**
  - **Prohibido:** Barras decorativas (`====`).
  - **Obligatorio:** Bloques limpios `/* ... */` o breves líneas explicativas del "por qué".
  - **Registro:** Dejar comentarios cortos sobre lo aprendido o arreglado en cada iteración.

## 3. Arquitectura y SOLID (CRÍTICO)

- **Límites de Archivo:**
- Componentes/Estilos: máx **300 líneas**.
- Hooks: máx **120 líneas**.
- Utils: máx **150 líneas**.
- _Acción:_ Si excede, dividir obligatoriamente. Para caso imposibles, hacer excepciones.

- **Organización Escalable (Directorios):**
- **PROHIBIDO** acumular todos los componentes en una sola carpeta plana.
- **OBLIGATORIO** organizar jerárquicamente por dominio, módulo o tipo (ej: `components/ui/`, `features/auth/`, `layouts/`). Estructurar pensando siempre que el proyecto va a crecer.

- **SRP (Single Responsibility):** 1 Componente = 1 Responsabilidad. (Máx 3 `useState`, separar lógica de vista).
- **Separación Lógica-Vista en Componentes (OBLIGATORIO):**
  - Al crear cualquier componente, su lógica (fetching, cálculos, transformaciones, side effects) **DEBE** ir en un hook dedicado o archivo de utilidad separado, no mezclada en el cuerpo del componente.
  - El componente solo debe contener: imports, desestructuración de props/hook, y el return con JSX.
  - Estructura mínima para un componente con lógica: `MiComponente.tsx` (vista) + `useMiComponente.ts` (lógica/hook).
  - Si la lógica es trivial (1-5 líneas), se permite inline. Si tiene más de 5 líneas de lógica, extraer obligatoriamente.
- **Principios:**
- **OCP:** Extender por props/composición, no modificar fuente.
- **LSP:** Hijos sustituibles por padres.
- **ISP:** Props mínimas y específicas.
- **DIP:** Depender de abstracciones/interfaces.

## 4. React y Estado

- **Atomicidad (Todo es un Componente):** Cualquier elemento de UI reutilizable o distinguible (botones, badges, inputs, tarjetas) **DEBE** abstraerse en su propio componente. No duplicar JSX ni crear componentes monolíticos.
- **Gestión de Estado:** Usar **Zustand** (o herramientas simples) para evitar complejidad.
- **Identificadores:** Todo contenedor principal debe tener `id` único (ej: `id="seccionHero"`).
- **Estructura:** Componentes pequeños y enfocados.

## 5. Estilos CSS (Centralizados)

- **Ubicación:** Todo en archivos `.css` separados (ej: `init.css`, `variables.css`). **Prohibido CSS inline** o hardcodeado.
- **Variables:** Uso obligatorio para colores, espaciados y tipografía.
- **Reutilización:** Buscar clases existentes antes de crear nuevas y jamas olvides revisar las variables y usarlas.

## 6. Flujo de Trabajo y Entrega

1. **Ejecución:**
  - **Validación Post-Edición (OBLIGATORIO):** Después de editar cualquier archivo, **SIEMPRE** ejecutar la herramienta de diagnóstico de errores (get_errors) sobre ese archivo para verificar que no hay errores de compilación, tipos o lint. **PROHIBIDO** dar una tarea por terminada si hay errores sin resolver en los archivos editados. Secuencia: editar archivo -> verificar errores -> corregir si existen -> confirmar limpio -> continuar.

2. **Commit:** Al finalizar una tarea, realizar **commit** de los cambios automáticamente (sin pedir permiso).
3. **Documentación:** Actualizar siempre los `.md` de documentación y contexto al terminar.
4. **Conocimiento Persistente en el MD (OBLIGATORIO):**
  - Al terminar una tarea, **registrar en el md de trabajo las lecciones aprendidas, decisiones técnicas, patrones descubiertos o gotchas** que serían útiles para la próxima iteración. El objetivo es que la siguiente sesión NO tenga que re-descubrir contexto desde cero.
  - La información debe ser **compacta**: 1-2 líneas por aprendizaje, no párrafos. Formato sugerido: `- [contexto]: hallazgo/decisión`.
  - Ejemplos válidos: `- [API]: el endpoint /users requiere header X-Custom`, `- [CSS]: variables de color están en init.css, no en variables.css`, `- [Build]: esbuild necesita flag --bundle para islands`.
  - **PROHIBIDO** dejar el md solo con checks de tareas sin contexto útil. El md no es solo un checklist, es memoria del proyecto.
5. **Compactación del MD (OBLIGATORIO):**
  - Cuando el archivo md de trabajo tiene **tareas completadas acumuladas**, compactarlas en un bloque resumen antes de que el archivo crezca demasiado.
  - **Regla:** Si hay más de **10 tareas completadas** listadas individualmente, agruparlas en un resumen compacto (ej: `## Completado - Sprint/Fase X` con bullet points de 1 línea cada uno) y eliminar el detalle extenso original.
  - **NUNCA** compactar ni resumir tareas pendientes o en progreso. Esas se mantienen con todo su detalle.
  - Secuencia: detectar md largo -> identificar tareas completadas -> resumirlas en bloque compacto -> eliminar detalle viejo -> conservar pendientes intactas.
6. **Cierre de Interacción:**

- **Re-lectura final del md de trabajo (OBLIGATORIO):** Antes de cerrar, releer el archivo de roadmap/md completo para verificar si el usuario dejó comentarios nuevos durante la ejecución. Si hay nuevas directrices,issues, to-do o tareas, trabajar en ellas inmediatamente antes de cerrar. **PROHIBIDO** cerrar sin revisar el md por última vez para detectar nuevas instrucciones del usuario y trabajar en ellas inmediatamente.
- Dejar un resumen **muy corto** de qué debe comprobar el usuario.
- Listar brevemente los cambios/arreglos realizados.
- Realizar (o anotar) TO-DOs de mejora arquitectónica aunque no sean el foco principal, estos TO-DOs siempre tienen que ir en los comentarios del codigo o en el md de trabajo.

---

### Ejemplo de Estilo de Comentario Aceptado

```javascript
/*
 * Función para calcular totales.
 * Se extrajo la lógica de impuestos para cumplir SRP.
 */
const calcularTotal = () => { ... }

```