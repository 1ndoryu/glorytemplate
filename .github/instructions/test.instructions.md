---
applyTo: '**'
---

# Protocolo de Desarrollo y Conducta (v3.7)

## -3. AUTOAPLICACIÓN ABSOLUTA DE REGLAS (SIN EXCEPCIÓN)

> **Este protocolo NO depende de que el usuario lo invoque. Se aplica SIEMPRE, en CADA archivo que toques, en CADA línea que escribas.**

- Cada vez que modifiques o leas un archivo por **cualquier motivo** (tarea asignada, consulta, refactor, bugfix), **DEBES** corregir toda violación visible de este protocolo en ese archivo — aunque la corrección no tenga relación con tu tarea actual.
- Esto **NO significa cambiar de tarea** ni desviarte del objetivo. Significa que tienes la **responsabilidad pasiva** de hacer cumplir estas reglas en todo código que pase por tus manos. Si añades código nuevo a un archivo que tiene violaciones preexistentes, corregirlas es parte de tu entrega.
- **PROHIBIDO** ignorar una violación conocida con la excusa de "no es parte de la tarea". Si la ves y puedes arreglarla sin riesgo, la arreglas. Si es compleja, dejas un **TO-DO** explícito en el código.
- **PROHIBIDO racionalizar inacción.** Pensamientos como "este problema ya existía antes de mi solicitud", "no fui yo quien lo introdujo" o "no me pidieron arreglar esto" son **exactamente la mentalidad que esta regla prohíbe**. El origen del problema es irrelevante — lo que importa es que lo viste, puedes corregirlo y estás tocando ese archivo. No hacerlo es negligencia, no prudencia.
- **Única excepción:** Si el archivo o la sección está marcada `[EN CURSO — AG-XXXX]` por otro agente, no modificar esa sección para evitar conflictos. Pero si el resto del archivo tiene violaciones fuera de la zona en curso, corregirlas igualmente.
- Ejemplos concretos: CSS hardcodeado → reemplazar con variable. SQL interpolado → parametrizar. Archivo >300 líneas → marcar TO-DO split. Import muerto → eliminar. Try-catch faltante → agregar. Error masking → corregir.

## -2. EMPIEZA SIEMPRE CON LA TAREA MAS DIFICIL.

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
6. Empezar a trabajar. (Al terminar revisar roadmap por nuevas instrucciones antes de cerrar)
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

## 7. Prohibiciones Técnicas Absolutas

- **NO HARDCODEAR OPERACIONES SQL:** Toda interacción con base de datos **DEBE** usar prepared statements, query builders o el ORM/abstracción del proyecto. **PROHIBIDO** concatenar variables directamente en strings SQL. Esto aplica a cualquier lenguaje (PHP, JS, etc.).
    - **Gotcha PostgreSQL INTERVAL:** La cláusula `INTERVAL '$variable'` se interpola como string, NO como parámetro PDO. **SIEMPRE** validar con whitelist dentro del repositorio/método que recibe el valor, nunca confiar en que el caller valida. Ej: `$validos = ['7 days', '30 days']; if (!in_array($intervalo, $validos, true)) $intervalo = '30 days';`
    - **Valores hardcodeados en queries:** Strings como `'descarga'`, `'completed'` dentro de SQL deben usar constantes/enums del Schema System (`TransaccionesEnums::TIPO_DESCARGA`), no strings sueltos.
    - **FQN inline en SQL builders:** Usar `use` statements al inicio del archivo, no `\App\Config\Schema\_generated\Clase::CAMPO` inline en cada query.
        - **Schema System obligatorio para TODA referencia a BD:** Si el proyecto tiene un Schema System (`*Cols`, `*Enums`, `*Schema`), **TODAS** las referencias a tablas, columnas, whitelists de columnas y claves JSONB **DEBEN** usar las constantes del schema, no strings literales. Esto incluye: nombres de tabla en queries, columnas en `SELECT`/`WHERE`/`ORDER BY`, whitelists de campos permitidos, y accesos JSONB (`metadata->>'genero'` debe derivar de constante). Si la constante no existe, **crearla primero**.
    - **Enums para valores de CHECK constraints:** Si una columna tiene CHECK constraint con valores válidos (`'pendiente'`, `'aprobado'`, `'texto'`), esos valores **DEBEN** tener Enums/constantes. **PROHIBIDO** hardcodear estos strings en controladores o services. Si el Enum no existe, generarlo antes de usar el valor.
    - **Discrepancias código vs schema = bug silencioso:** Si el código usa `'one shot'` pero el CHECK define `'oneshot'`, hay inconsistencia silenciosa que no genera error pero produce datos incorrectos. Al usar valores de BD, **SIEMPRE** verificar contra el schema/enum.
    - **WordPress `$wpdb->prepare()` obligatorio:** Toda query con `$wpdb->query()`, `$wpdb->get_var()`, `$wpdb->get_results()` **DEBE** usar `$wpdb->prepare()`, incluso si los valores son constantes. Defensa en profundidad.

- **NO CREAR CÓDIGO QUE PUEDA FALLAR SILENCIOSAMENTE:** Toda operación que pueda lanzar excepciones (I/O, red, base de datos, parsing, APIs externas) **DEBE** estar envuelta en un bloque `try-catch` (o su equivalente según el lenguaje). El `catch` **DEBE** registrar o propagar el error de forma útil. **PROHIBIDO** dejar catches vacíos o que solo hagan `console.log` genérico sin contexto.
    - **Checklist PHP — Operaciones que SIEMPRE requieren protección** (errores recurrentes detectados en auditoría):
        - `exec()`, `shell_exec()`, `proc_open()` — envolver en try-catch, validar código de retorno y que el binario existe antes de ejecutar.
        - `curl_init()`, `curl_exec()` — try-catch + verificar `curl_error()`. Un fallo de red no lanza excepción por sí solo.
        - `json_decode()` — **SIEMPRE** verificar `json_last_error() !== JSON_ERROR_NONE` después. Sin esto, datos corruptos se propagan como `null` silencioso.
        - `json_encode()` — verificar que no retorna `false` en datos no serializables.
        - `file_get_contents()`, `file_put_contents()`, `copy()`, `rename()`, `readfile()` — try-catch. Permisos, disco lleno o archivo eliminado entre check y lectura causan fallos silenciosos.
        - `unlink()` — try-catch o verificar retorno. **PROHIBIDO** usar `@unlink()`.
        - `mkdir()`, `wp_mkdir_p()` — verificar retorno `=== false`. Fallo de permisos no lanza excepción.
        - `glob()` — puede retornar `false` en error, no solo array vacío. Validar antes de iterar.
        - `ZipArchive::open()`, `addFile()`, `close()` — try-catch completo. Fallo de creación ZIP no se captura automáticamente.
        - `$wpdb->query()`, `$wpdb->get_var()`, `$wpdb->insert()` — verificar retorno `false`/`null` y envolver en try-catch para excepciones de conexión.
        - `require()` / `include()` de archivos dinámicos — try-catch. Archivo corrupto o faltante = fatal error.
    - **PROHIBIDO usar `@` como supresor de errores** (`@file_get_contents()`, `@unlink()`, etc.). El `@` oculta el síntoma sin resolver la causa. Usar try-catch con logging explícito en su lugar.
    - **Controllers PHP DEBEN tener try-catch global:** Todo método público de un controller REST **DEBE** envolver su cuerpo completo en `try { ... } catch (\Throwable $e)` con logging + respuesta 500 genérica. Sin esto, excepciones inesperadas exponen detalles internos al cliente.
    - **Métodos que ejecutan operaciones críticas NO deben retornar void:** Si un método hace INSERT/UPDATE/DELETE o llama a APIs externas, **DEBE** retornar `bool` o un tipo que permita al caller verificar éxito/fallo. Un `void` en `registrarRevenueShare()` o `marcarLeida()` impide que el caller sepa si la operación financiera/de estado se guardó.
    - **Archivos temporales: cleanup con try/finally:** Si se crean archivos temporales (`tempnam()`), el `unlink` **DEBE** ir en un bloque `finally` para garantizar limpieza incluso si hay excepción intermedia. Sin esto, archivos se acumulan en `/tmp` y llenan disco en procesos cron.
    - **Race conditions en create-or-get:** El patrón `buscar() → si no existe → crear()` es vulnerable a concurrencia. Dos requests simultáneos pueden crear duplicados. Usar advisory locks, upsert atómico (`INSERT ... ON CONFLICT`) o constraints UNIQUE para prevenir.
    - **Checklist React/TypeScript — Patrones peligrosos** (errores recurrentes detectados en auditoría):
        - **NO enmascarar errores como éxito:** Si un service catch retorna `{ ok: true, data: [] }`, el caller no puede distinguir error de resultado vacío real. En catch **SIEMPRE** retornar `ok: false`. Un error es un error, no un resultado vacío exitoso.
        - **NO wrappear en try-catch funciones que ya nunca lanzan:** Si el cliente API centralizado (`apiCliente`) ya garantiza resolución sin throw (retorna `{ ok, data, error }`), un try-catch externo es redundante y confuso. Verificar `resp.ok` en su lugar.
        - **NO dejar fallos sin feedback al usuario:** Si una operación falla (upload de imagen, descarga, API call), el usuario **DEBE** recibir feedback visible (toast, mensaje de error). Un `console.error` solo no es suficiente — el usuario no ve la consola.
        - **Updates optimistas DEBEN tener rollback:** Si se actualiza el UI antes de confirmar con la API (likes, favoritos, etc.), verificar `resp.ok` después del await y **revertir el estado** si falla. Un like optimista sin rollback deja el UI inconsistente con el backend.
        - **useEffect con async DEBE tener cleanup:** Todo `useEffect` que lance requests o loops async **DEBE** retornar cleanup con `AbortController`. Sin esto, un unmount durante el fetch causa updates de estado en componentes desmontados y race conditions.
        - **Stores Zustand: usar selectores, no suscribirse al store completo:** `useStore()` sin selector re-renderiza en CUALQUIER cambio del store. Usar `useStore(s => s.campo)` para suscribirse solo a lo necesario. Especialmente critico en stores con actualizaciones frecuentes (progreso, timers).
        - **NO usar non-null assertions (`!`) dentro de guards que ya validaron:** Si ya hay un `if (data)`, TypeScript infiere non-null. Las `!` dentro de ese bloque son ruido.
        - **Contrato de tipos consistente:** Si una interfaz define `data: T | null`, nunca retornar `data: undefined`. Respetar el contrato exacto del tipo.
- **NO CREAR CÓDIGO INSEGURO:** Validar y sanitizar toda entrada de usuario antes de procesarla. No exponer datos sensibles en el cliente. No usar `eval()`, `innerHTML` con datos dinámicos sin sanitizar, ni patrones conocidos de vulnerabilidad (XSS, CSRF, inyección). Aplicar principio de mínimo privilegio en permisos y accesos.
    - **exec()/shell_exec(): SIEMPRE usar `escapeshellarg()`** para cada argumento que venga de BD o input. Sin esto, un nombre de archivo con `$(rm -rf /)` o `; malicious` se ejecuta como comando del sistema.
    - **PROHIBIDO hardcodear secrets/passwords en código fuente:** Contraseñas, API keys, tokens **DEBEN** venir de variables de entorno o archivos de configuración excluidos de git. Un `const TEST_PASS = '...'` en el código es visible para cualquiera con acceso al repositorio.
    - **permission_callback de WordPress REST debe ser el más restrictivo posible:** Si una ruta es de admin, usar `requerirAdmin` en el callback, no `requerirAuth`. La verificación de permisos dentro del callback es un fallback, no la primera línea de defensa.
    - **IDs y parámetros concatenados en URLs de APIs externas deben validarse:** Si se construye una URL como `/accounts/{$id}`, validar el formato esperado del ID (ej: `preg_match('/^acct_[a-zA-Z0-9]+$/', $id)`) antes de concatenar. Previene path traversal y endpoints inesperados.
    - **SSL explícito en requests a APIs de pago:** Siempre setear `CURLOPT_SSL_VERIFYPEER = true` y `CURLOPT_SSL_VERIFYHOST = 2` explícitamente. Los defaults de PHP pueden variar según distribución/Docker image.
- **NO CREAR QUERIES N+1 NI ROUNDTRIPS INNECESARIOS A BD:** Si múltiples queries secuenciales consultan las mismas tablas con los mismos filtros (ej: 3 queries de ingresos por periodo, 8 queries de stats de dashboard), **combinarlas** en una sola query con `CASE/FILTER`, CTEs o subqueries. Cada roundtrip a BD tiene overhead de red y conexión. También evitar el patrón N+1: si un loop ejecuta una query por iteración, usar cache estático, batch query o JOIN.
- **NO CREAR ARCHIVOS MONOLITO:** Ningún archivo debe acumular múltiples responsabilidades no relacionadas. Si un archivo crece más allá de los límites definidos en la sección 3 o mezcla dominios distintos, **dividirlo obligatoriamente**. Aplica a componentes, estilos, hooks, controladores, repositorios, y cualquier tipo de archivo.
- **NO OMITIR REFACTORIZACIONES OPORTUNAS PEQUEÑAS:** Si durante el desarrollo de una tarea detectas código duplicado, nombres confusos, imports sin usar, variables muertas, o pequeñas mejoras de legibilidad/estructura que son de bajo riesgo, **aplícalas inmediatamente** sin necesidad de pedir permiso. La deuda técnica no se acumula si se limpia mientras se trabaja.
- **NO OMITIR OPORTUNIDADES DE OPTIMIZACIÓN O CORRECCIÓN FUERA DE LA TAREA PRINCIPAL:** Si mientras trabajas en una tarea detectas código que viola estas reglas (en el mismo archivo o en archivos que estés consultando), **corregirlo** si es de bajo riesgo, o dejarlo documentado como **TO-DO** con descripción clara si la corrección es compleja. **PROHIBIDO** ignorar violaciones conocidas solo porque "no son parte de la tarea actual".
- **NO PERMITIR QUE LA ENTROPÍA CREZCA (RESPONSABILIDAD ABSOLUTA):** Todo cambio, toda tarea, toda nueva feature introduce entropía si no se toman las decisiones correctas de estructura, ubicación, nomenclatura y limpieza. El usuario generalmente **no es consciente** de cómo el código se desordena progresivamente. Por lo tanto, es **responsabilidad absoluta del agente** — aunque no se le indique ni se le pida — actuar como guardián del orden del proyecto. Esto significa: elegir la ubicación correcta para cada archivo nuevo, mantener coherencia en patrones existentes, no dejar imports huérfanos, no crear abstracciones innecesarias, no romper convenciones establecidas, y asegurar que cada cambio deja el código **igual o más ordenado** que antes. Si detectas desorden preexistente mientras trabajas, limpiarlo proactivamente si es de bajo riesgo. La entropía se combate con cada decisión, no con refactorizaciones masivas futuras que nunca llegan.

---

### Ejemplo de Estilo de Comentario Aceptado

```javascript
/*
 * Función para calcular totales.
 * Se extrajo la lógica de impuestos para cumplir SRP.
 */
const calcularTotal = () => { ... }

```
