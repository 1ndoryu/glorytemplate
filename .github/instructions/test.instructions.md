---
applyTo: '**'
---

# Protocolo de Desarrollo v4.0 (17 marzo 2026)
Nota: si un proyecto no cumple o no encaja con v4.0, adaptar progresivamente el proyecto con lo que se pueda de su estructura o empezarla de cero, significa se trata el proyecto con una versión vieja del protocolo.

## I. REGLAS ABSOLUTAS (por prioridad)

**-1. LO MAS DIFICIL PRIMERO.** 
Siempre abordar primero lo mas complejo, la tarea mas dificil primero. 

**0. El flujo es obligatorio e innegociable.**
Antes de ejecutar cualquier tarea, la primera respuesta al usuario SIEMPRE debe ser un anuncio breve con este formato exacto:

> **Flujo que voy a seguir:**
> 1. Leer roadmap completo
> 2. Por bloque de tareas abordables: ejecutar todas las tareas posibles → validar/testear una sola vez al cierre del bloque → archivar en completados/ → actualizar roadmap → commit y push. Seguir cada paso estrictamente, paso 1 a 10 y repetir.
> 3. Repetir hasta vaciar pendientes.
>
> **Tareas identificadas:** [lista de IDs y títulos]

Sin este anuncio, no se inicia ninguna tarea. Esta regla existe para que el agente no optimice el flujo a conveniencia propia, salte pasos o agrupe lo que no debe agruparse.

**Prohibido explícitamente:**
- Cerrar un bloque de tareas sin archivar inmediatamente las tareas completadas en `completados/`.
- Hacer commit del bloque sin haber actualizado el roadmap (quitar las tareas completadas de pendientes).
- Cerrar la sesion o cambiar de frente si el bloque completado no tiene: validacion final + commit + entrada en `completados/` + roadmap actualizado.
- Enfocarse en varias tareas no relacionadas si eso aumenta el riesgo de mezclar dominios; se permite agrupar tareas relacionadas o endpoints faltantes del mismo barrido.
- Detenerte a mitad de ejecución o pedir confirmacion para tareas triviales o pasos del flujo. El flujo es un ciclo continuo, no un checklist individual.

**1. Autonomia total.** Trabaja continua y prolongadamente sin detenerte. Prohibido pedir confirmacion trivial, dividir tareas artificialmente o interrumpir el flujo. Maxima eficiencia por interaccion.

**1.1 Trabajo en equipo con otros agentes.** Otros agentes pueden estar trabajando en el mismo repositorio simultaneamente. Si encuentras cambios, archivos nuevos, commits o ramas que no son tuyos, no los borres ni los reviertas — son trabajo de otro agente o del usuario. Si un conflicto con el trabajo de otro agente te impide completar una tarea, salta esa tarea temporalmente y continua con la siguiente. Vuelve a intentarla cuando el conflicto se haya resuelto. Tu responsabilidad es tu ciclo de tareas; el trabajo ajeno no es tu problema salvo que interfiera directamente, en cuyo caso lo rodeas, no lo destruyes.

**2. Cero parches.** Toda solucion debe escalar 10x sin reescritura. Antes de implementar: "Es la mejor opcion arquitectonica o el camino facil?" Si es lo segundo, redisenar. Prohibido justificar con "es temporal" o "lo refactorizamos despues".

**2.1 Pensamiento expansivo obligatorio.** Incluso si la tarea parece pequena, primero evaluar si revela un problema de arquitectura, sincronizacion, contratos, cache, observabilidad o UX mas profundo. No limitarse al sintoma pedido si existe una solucion raiz claramente superior. Cada tarea es una oportunidad para mejorar el sistema, no solo para apagar un fuego local.

**3. Ediciones controladas.** Prohibido editar muchos archivos simultaneamente en un solo parche. Los cambios grandes fallan — dividir en ediciones pequenas, archivo por archivo o por modulo. No ejecutar validaciones pesadas despues de cada microedicion; la validacion completa va al cierre del bloque de tareas. Solo hacer chequeos puntuales durante la edicion si el editor muestra errores, si el cambio toca una zona critica, o si una duda tecnica bloquea avanzar.

**4. Guardian del orden.** Eres responsable absoluto de que el proyecto no se desordene. Al tocar un archivo, corregir toda violacion visible de bajo riesgo (imports muertos, hardcodeo, codigo muerto, nombres confusos). Si la correccion es compleja, dejar TO-DO en el codigo. No existe "no es mi tarea".

**5. Seguridad primero.**
  - SQL: siempre prepared statements/query builders. Usar Schema System (`*Cols`, `*Enums`) para toda referencia a BD, nunca strings literales. `$wpdb->prepare()` obligatorio.
  - PHP: `escapeshellarg()` en todo argumento de `exec()`/`shell_exec()`. Prohibido `@` como supresor. Controllers REST con try-catch global. SSL explicito en APIs de pago.
  - Secrets: siempre variables de entorno, nunca en codigo fuente. Permisos WordPress REST lo mas restrictivo posible.
  - Input: validar/sanitizar toda entrada. Prohibido `eval()`, `innerHTML` con datos dinamicos sin sanitizar.

**6. Sin fallos silenciosos.**
  - Toda operacion I/O, red, BD, parsing: try-catch con logging util. Catches vacios = prohibido.
  - PHP: verificar retorno de `json_decode()`, `glob()`, `mkdir()`, `$wpdb->query()`. Cleanup de archivos temporales en `finally`.
  - React: errores retornan `ok: false`, nunca enmascarar como exito. Toda falla = feedback visible al usuario (toast). Updates optimistas con rollback si falla. `useEffect` async con `AbortController`.
  - Metodos criticos (INSERT/UPDATE/DELETE/APIs) retornan resultado, nunca void.
  - Race conditions: usar upsert atomico o constraints UNIQUE, no buscar-crear secuencial.

**7. Rendimiento.**
  - Prohibido queries N+1 o roundtrips innecesarios. Combinar con CTEs/CASE/JOINs.
  - Zustand: selectores especificos (`useStore(s => s.campo)`), nunca store completo.
  - PostgreSQL INTERVAL: validar con whitelist, nunca interpolar.

**8. Arquitectura SOLID.**
  - SRP: 1 componente = 1 responsabilidad. Max 3 `useState`. Logica >5 lineas va en hook separado (`useMiComponente.ts`).
  - Limites: componentes/estilos max 300 lineas, hooks max 120, utils max 150. Si excede, dividir.
  - Directorios jerarquicos por dominio (`components/ui/`, `features/auth/`). Prohibido carpeta plana.
  - OCP (extender por props/composicion), ISP (props minimas), DIP (depender de abstracciones).

**9. Estandares de codigo.**
  - JS/TS: `camelCase` vars/funcs, `PascalCase` componentes/clases.
  - CSS: nombres en espanol y `camelCase` (`.contenedorPrincipal`). Todo en archivos `.css` separados. Prohibido CSS inline. Variables obligatorias para colores/espaciados/tipografia.
  - Verificar que toda referencia existe antes de usarla (variables CSS, imports, tipos). Si lo creas, conectalo.
  - UI atomica: todo elemento reutilizable es su propio componente. Zustand para estado global.

**10. Comentarios = memoria del proyecto.**
  - Formato: bloques `/* ... */` explicando el "por que". Prohibido barras decorativas (`====`).
  - Al completar una tarea, dejar comentario compacto en el codigo con: que se hizo, por que, gotchas encontrados, que queda pendiente.
  - No borrar comentarios de tareas anteriores — son registro de evolucion. Actualizar si quedan obsoletos.
  - Las lecciones aprendidas viven en los comentarios del codigo, no en MDs.

**11. Validacion obligatoria al cierre del bloque — errores ajenos incluidos.**
  - No validar despues de cada archivo ni despues de cada microcambio; completar primero todas las tareas abordables del bloque actual.
  - Durante la edicion, usar `get_errors` o checks puntuales solo si hay diagnosticos visibles, una zona critica o una duda tecnica que bloquee avanzar.
  - Al cierre de un bloque `.ts`/`.tsx`: ejecutar `npm run type-check`.
  - Al cierre de un bloque `.css`: ejecutar VarSense (`cssVarsValidator.scanAllDiagnostics`) si disponible o el build/lint que compile CSS.
  - Generacion masiva (>3 archivos): ejecutar Code Sentinel (`codeSentinel.analyzeWorkspace`) al cierre del bloque.
  - Antes del commit final del bloque: `npm run type-check` como minimo.
  - **Si los comandos reportan errores — aunque no esten relacionados con tu tarea — corregirlos es tu responsabilidad.** No se avanza ni se commitea con errores pendientes. Los errores pre-existentes encontrados se corrigen en el mismo commit o en uno separado si son muchos.

**12. Commits.**
  - Prohibido `git add .` o `git add --all`. Siempre `git add archivo1 archivo2` explicito.
  - Verificar `git diff --stat HEAD` y `git status` antes de commitear.
  - Cada tarea = un commit separado. Mensaje claro: `{id}: descripcion breve`.
  - Commit automatico al completar tarea, sin pedir permiso.

**13. PowerShell + SSH.**
  - SQL complejo via SSH: usar base64 (`[Convert]::ToBase64String` + `base64 -d` en remoto). PS5 no tiene heredoc.
  - Alternativa: crear `.sh` local, copiar con `scp`, ejecutar remotamente.

**14. Glory Sentinel.** 
  - Aplicar sentinel-disable-file limite-lineas solo a archivos con justificacion valida (clases de utilidad central, controllers REST con muchas rutas, archivos legacy temporales). Prohibido usarlo para evitar refactorings necesarios o para justificar codigo desordenado. Si se usa, explicar claramente la razón.

---

## II. FLUJO DE TRABAJO (ciclo continuo)

El roadmap (`App/roadmap.md`) es el canal de comunicacion. El usuario escribe tareas ahi, tu las ejecutas. El flujo es un ciclo **por bloque de tareas abordables**: completar todas las tareas relacionadas o posibles del bloque, validar una sola vez al cierre, archivar, actualizar roadmap, commit y push. No validar ni commitear una por una salvo que una tarea sea aislada, riesgosa o bloquee al resto.

### ID de tarea
Cada tarea recibe un ID unico basado en la fecha: `{DD}{M}{A}-{N}`
- `DD` = dia (01-31)
- `M` = mes (1-9, A=oct, B=nov, C=dic)
- `A` = ano del proyecto (A=2026, B=2027, C=2028...)
- `N` = numero secuencial de tarea ese dia (1, 2, 3...)
- Ejemplo: 17 marzo 2026, tarea 1 = `173A-1`. Tarea 2 ese dia = `173A-2`.

### Paso 1 — Leer roadmap y planes
Leer `App/roadmap.md` completo. Identificar tareas pendientes. Revisar `App/Agente/planes/` por planes activos que requieran continuacion.

Si una tarea del roadmap no es suficientemente clara para ejecutarse con seguridad tecnica, dejar una nota breve pidiendo aclaracion en el lugar adecuado del flujo del agente, saltar a la siguiente tarea y volver luego. Prohibido bloquear el ciclo completo por una ambiguedad aislada.

### Paso 2 — Ejecutar tarea
Tomar una tarea pendiente y completarla. Reglas:
- **2.1** Cada bloque coherente = un commit separado con mensaje claro.
- **2.2** Completar todas las tareas abordables del bloque antes de validar. Se permite agrupar endpoints faltantes, fixes relacionados o tareas del mismo dominio.
- **2.3** Dejar comentarios en el codigo referenciando la tarea: que se hizo, instrucciones clave, problemas enfrentados, pendientes sobre esa funcionalidad. No borrar comentarios anteriores.
- **2.4** Prohibido cerrar el bloque sin marcar las tareas completadas, hacer commit y organizar los MDs.
- **2.5** Editar archivo por archivo o por modulo, pero no ejecutar validaciones pesadas entre cada archivo. Acumular cambios coherentes y validar al cierre del bloque.
- **2.6** Si la tarea es compleja (>1 sesion o multiples fases) o es un problema repetitivo que ya reaparecio, crear un plan en `App/Agente/planes/` con nombre `plan-tema-YYYY-MM-DD.md` describiendo fases, estado actual y proximos pasos. Continuar desde donde se quedo.

### Paso 3 — Validar y corregir errores reportados
Despues de completar todas las tareas abordables del bloque, ejecutar los comandos de validacion correspondientes (ver seccion V) una sola vez. **Si los comandos reportan errores — aunque no tengan relacion con el bloque actual — corregirlos antes de cerrar/commitear.** Los errores reportados por herramientas son tu responsabilidad. No se cierra el bloque con errores pendientes.

Si la tarea toca React, hooks, stores, islands o servicios frontend, no alcanza con type-check abstracto: revisar especificamente que el flujo renderizado afectado siga funcionando y que no haya regresiones evidentes en hydration, estados vacios, modales, menus, contadores o navegacion.

Si Glory Sentinel reporta un **falso positivo** (la regla no aplica al caso concreto), crear un MD en `App/Agente/prevencion/` describiendo el falso positivo y la correccion necesaria en la regla de Sentinel para evitarlo en el futuro.

### Paso 4 — Testear la tarea
Antes de marcar el bloque como completado, verificar que la funcionalidad implementada o corregida funciona:
- Ejecutar la feature o el fix en local y confirmar el resultado esperado.
- Si el problema es visible en UI/HTML/CSS o texto renderizado, la verificacion local debe incluir abrir el flujo afectado y comprobar exactamente el elemento cambiado. No alcanza con type-check, lectura de codigo o asumir que "deberia funcionar".
- Si hay tests existentes, ejecutarlos. Si la tarea lo amerita y es viable, agregar un test.
- Solo si no es posible testear en local (dependencia de terceros, hardware, etc.), omitir con justificacion en el comentario del commit.
- **Un bloque no se marca como completado hasta que este testeado y confirmado.**

### Regla adicional de cierre
- Prohibido mover una tarea a completados si el sintoma original sigue visible localmente o si no se verifico el selector/texto/flujo exacto reportado por el usuario cuando el entorno local permite hacerlo.

### Paso 5 — Archivar tarea completada
Mover la tarea completada del roadmap a un archivo en `App/Agente/completados/` con nombre `tareas-YYYY-MM-DD.md`. Si ya existe uno con la fecha de hoy, agregar ahi. El roadmap nunca acumula tareas completadas. Si la tarea tenia un plan en `App/Agente/planes/`, mover el plan a `App/Agente/planes/completados/`.

### Paso 6 — Documentar (obligatorio cuando se toca funcionalidad)
Despues de completar una tarea, revisar si la funcionalidad o flujo tocado ya tiene documentacion vigente en `App/Agente/documentacion/`. Si no existe, crearla; si existe, actualizarla. Esto es obligatorio para toda tarea que cambie arquitectura, flujos de usuario, contratos backend/frontend, sincronizacion, algoritmos, integraciones, tooling o comportamiento reutilizable. Nunca duplicar documentacion existente sobre el mismo tema — actualizar el archivo existente y cambiar la fecha en el nombre, actualizar la fecha del archivo en caso de que se actualice.

### Paso 7 — Prevencion (si aplica, problemas que se puedan detectar o prevenir con Code Sentinel)
Preguntarse: "Se puede detectar o prevenir automaticamente la proxima vez con Code Sentinel?" Si si, crear un MD en `App/Agente/prevencion/` con nombre `prevencion-tema-YYYY-MM-DD.md` describiendo la regla a implementar, y dejar referencia en el roadmap como tarea pendiente.

### Paso 8 — Revisar pendientes de prevencion
Leer `App/Agente/prevencion/`. Si hay MDs pendientes de implementar:
1. Implementar la regla en `.agent/code-sentinel` (o `.agent/varsense` si es CSS).
2. Ejecutar la extension contra el caso original para verificar que detecta el problema.
3. Reinstalar la extension (`vsce package` + instalar `.vsix`).
4. Confirmar deteccion exitosa mediante test, eliminar el MD de prevencion y marcar como completada.
- Si no hay pendientes, saltar este paso.

### Paso 9 — Commit, push y deploy
Hacer commit final. Luego sincronizar la rama local con remoto (`git pull --rebase` o equivalente no interactivo si aplica al flujo del repo) antes del push/deploy. Si el roadmap del proyecto indica que aplica deploy, usar `.agent/coolify-manager-rs` para subir al servidor. **Despues de cada deploy, verificar que el servidor sigue funcionando** (health check a la URL de produccion, revisar logs si hay errores). Si el deploy rompe algo, revertir antes de continuar.

`coolify-manager-rs` debe tratarse como herramienta viva: si durante una tarea aparece un escenario de deploy, health, logs, restart, backup, restore o exec que no cubre bien, dejar constancia de que puede y debe mejorarse para soportar ese caso de uso de forma robusta.

### Paso 10 — Volver al Paso 1
Releer el roadmap completo (el usuario puede haber agregado tareas mientras trabajabas). Repetir el ciclo hasta que no queden tareas pendientes. Solo entonces, cerrar con un resumen breve de lo realizado.

---

## III. FORMATOS

### ID de tareas
Formato: `{DD}{M}{A}-{N}` donde DD=dia, M=mes (1-9, A-C para oct-dic), A=ano proyecto (A=2026, B=2027...), N=secuencial del dia.
Ejemplo: 17 marzo 2026, tarea 3 = `173A-3`. 5 noviembre 2027, tarea 1 = `05BB-1`.

### Tareas en el roadmap (formato del agente al completar)
```
Pendiente (escrita por el usuario, cualquier formato):
- Arreglar el bug del login

Completada (movida a App/Agente/completados/tareas-YYYY-MM-DD.md):
## 173A-1 — Titulo breve
- **Que:** descripcion de lo que se hizo
- **Archivos:** lista de archivos modificados
- **Gotchas:** problemas encontrados (si los hubo)
- **Sentinel:** si requiere nueva regla, si hubo falso positivo, o si no aplica
```

### Comentarios en codigo
```javascript
/* [173A-1] Descripcion breve de lo que se hizo y por que.
 * Gotcha: detalle relevante para futuras ediciones.
 * Pendiente: lo que queda por hacer en esta area. */
```

### Commits
```
173A-1: descripcion breve de la tarea
173A-1+173A-2: descripcion si son tareas relacionadas
```

### Nomenclatura
- JS/TS: `camelCase` vars/funcs, `PascalCase` componentes
- CSS: espanol + `camelCase` (`.contenedorPrincipal`)
- Archivos MD: `nombre-descriptivo-YYYY-MM-DD.md`

---

## IV. ESTRUCTURA DE LOS MDs

### Plantilla del roadmap (`App/roadmap.md`)
```markdown
# {Nombre del Proyecto} — Roadmap

> **Descripcion:** breve descripcion del proyecto
> **Stack:** descripcion breve del stack tecnologico
> **URL produccion:** URL del sitio en produccion
> **Servidor:** IP del servidor, acceso SSH (usuario)
> **Deploy:** si aplica, como se despliega (ej: Coolify, manual, N/A)
> **Coolify IDs:** UUIDs de servicios relevantes en Coolify
> **Repositorio:** rama principal y convenciones

## Herramientas del agente
- Code Sentinel: `.agent/code-sentinel`
- VarSense: `.agent/varsense`
- Coolify Manager: `.agent/coolify-manager-rs` (si aplica deploy)

## Documentacion legacy
(enlaces a docs existentes que no siguen v4.0, con nota de que son legacy)

## Tareas pendientes
(el usuario escribe aqui en cualquier formato, el agente asigna IDs y ejecuta)
```

### Arbol de archivos
```
App/
  roadmap.md                              <-- EJE CENTRAL: solo tareas pendientes del usuario
  Agente/
    completados/
      tareas-YYYY-MM-DD.md                <-- Tareas completadas agrupadas por fecha
    documentacion/
      {categoria}/
        tema-YYYY-MM-DD.md                <-- Documentacion generica reutilizable
    planes/
      plan-tema-YYYY-MM-DD.md             <-- Planes para tareas complejas (activos)
      completados/
        plan-tema-YYYY-MM-DD.md           <-- Planes de tareas ya finalizadas
    prevencion/
      prevencion-tema-YYYY-MM-DD.md       <-- Reglas para Code Sentinel (pendientes de implementar)
```

### Reglas de los MDs
1. **roadmap.md** solo contiene tareas pendientes. Nunca acumula completadas.
2. Todo MD tiene fecha en su nombre (`YYYY-MM-DD`) para saber que tan actualizado esta.
3. Documentacion se organiza en carpetas por categoria dentro de `documentacion/`.
4. Nunca duplicar documentacion — si ya existe un MD sobre el tema, actualizarlo (y actualizar la fecha).
5. Todo MD de tareas completadas debe incluir explicitamente si requiere una regla nueva de Glory Sentinel, si hubo falso positivo o si no aplica.
6. Lecciones aprendidas van en los comentarios del codigo, no en MDs separados.
7. Si la estructura de MDs esta desorganizada al iniciar sesion, reorganizarla como primera accion.
8. Archivos en `App/docs (ignorar)/` son legacy — no modificar ni mover sin instruccion del usuario.

---

## V. COMANDOS DE REVISION

### Validacion de codigo
| Cuando | Comando |
|--------|---------|
| Durante edicion de `.ts`/`.tsx` | Sin `type-check` por archivo; usar `get_errors` solo si hay diagnosticos visibles o bloqueo tecnico |
| Cierre de bloque frontend | `npm run type-check` minimo |
| Cierre de bloque CSS | VarSense (`cssVarsValidator.scanAllDiagnostics`) si disponible o build/lint que compile CSS |
| Generacion masiva | Code Sentinel (`codeSentinel.analyzeWorkspace`) al cierre del bloque |
| Antes de commit del bloque | `npm run type-check` minimo |
| Lint + types integrado | `codeSentinel.runExternalTools` |

### Deploy (solo si el roadmap indica que aplica)
Binario: `.agent/coolify-manager-rs/target/release/coolify-manager.exe`

| Comando | Uso |
|---------|-----|
| `deploy --name <sitio> --update` | Despliega/actualiza el tema en el sitio |
| `redeploy --name <sitio>` | Fuerza redeploy via Coolify API (sin cambios de codigo) |
| `health --name <sitio>` | Health check remoto + HTTP (usar post-deploy para verificar) |
| `logs --name <sitio>` | Ver logs del contenedor o debug.log de WordPress |
| `restart --name <sitio>` | Reinicia servicios del sitio |
| `backup --name <sitio>` | Crea copia de seguridad externa |
| `restore --name <sitio>` | Restaura un backup (usar si deploy rompe algo) |
| `exec --name <sitio> -- <cmd>` | Ejecuta comando en el contenedor |
| `git-status --name <sitio>` | Muestra estado de Git en el tema remoto |
| `deploy-websocket --name <sitio>` | Agrega servicio WebSocket (Bun) al stack |

**Flujo deploy obligatorio:** `deploy` → `health` → si falla → `redeploy`.

### Otros comandos utiles
- `codeSentinel.analyzeFile` — analizar archivo actual
- `cssVarsValidator.exportReport` — reporte CSS exportable
- `cssVarsValidator.scanOrphanClasses` — clases CSS sin uso
