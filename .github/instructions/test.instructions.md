---
applyTo: '**'
---

# Protocolo de Desarrollo v4.0 (17 marzo 2026)
Nota: si un proyecto no cumple o no encaja con v4.0, adaptar progresivamente el proyecto con lo que se pueda de su estructura o empezarla de cero, significa se trata el proyecto con una versión vieja del protocolo.

## I. REGLAS ABSOLUTAS (por prioridad)

**1. Autonomia total.** Trabaja continua y prolongadamente sin detenerte. Prohibido pedir confirmacion trivial, dividir tareas artificialmente o interrumpir el flujo. Maxima eficiencia por interaccion.

**2. Cero parches.** Toda solucion debe escalar 10x sin reescritura. Antes de implementar: "Es la mejor opcion arquitectonica o el camino facil?" Si es lo segundo, redisenar. Prohibido justificar con "es temporal" o "lo refactorizamos despues".

**3. Guardian del orden.** Eres responsable absoluto de que el proyecto no se desordene. Al tocar un archivo, corregir toda violacion visible de bajo riesgo (imports muertos, hardcodeo, codigo muerto, nombres confusos). Si la correccion es compleja, dejar TO-DO en el codigo. No existe "no es mi tarea".

**4. Seguridad primero.**
  - SQL: siempre prepared statements/query builders. Usar Schema System (`*Cols`, `*Enums`) para toda referencia a BD, nunca strings literales. `$wpdb->prepare()` obligatorio.
  - PHP: `escapeshellarg()` en todo argumento de `exec()`/`shell_exec()`. Prohibido `@` como supresor. Controllers REST con try-catch global. SSL explicito en APIs de pago.
  - Secrets: siempre variables de entorno, nunca en codigo fuente. Permisos WordPress REST lo mas restrictivo posible.
  - Input: validar/sanitizar toda entrada. Prohibido `eval()`, `innerHTML` con datos dinamicos sin sanitizar.

**5. Sin fallos silenciosos.**
  - Toda operacion I/O, red, BD, parsing: try-catch con logging util. Catches vacios = prohibido.
  - PHP: verificar retorno de `json_decode()`, `glob()`, `mkdir()`, `$wpdb->query()`. Cleanup de archivos temporales en `finally`.
  - React: errores retornan `ok: false`, nunca enmascarar como exito. Toda falla = feedback visible al usuario (toast). Updates optimistas con rollback si falla. `useEffect` async con `AbortController`.
  - Metodos criticos (INSERT/UPDATE/DELETE/APIs) retornan resultado, nunca void.
  - Race conditions: usar upsert atomico o constraints UNIQUE, no buscar-crear secuencial.

**6. Rendimiento.**
  - Prohibido queries N+1 o roundtrips innecesarios. Combinar con CTEs/CASE/JOINs.
  - Zustand: selectores especificos (`useStore(s => s.campo)`), nunca store completo.
  - PostgreSQL INTERVAL: validar con whitelist, nunca interpolar.

**7. Arquitectura SOLID.**
  - SRP: 1 componente = 1 responsabilidad. Max 3 `useState`. Logica >5 lineas va en hook separado (`useMiComponente.ts`).
  - Limites: componentes/estilos max 300 lineas, hooks max 120, utils max 150. Si excede, dividir.
  - Directorios jerarquicos por dominio (`components/ui/`, `features/auth/`). Prohibido carpeta plana.
  - OCP (extender por props/composicion), ISP (props minimas), DIP (depender de abstracciones).

**8. Estandares de codigo.**
  - JS/TS: `camelCase` vars/funcs, `PascalCase` componentes/clases.
  - CSS: nombres en espanol y `camelCase` (`.contenedorPrincipal`). Todo en archivos `.css` separados. Prohibido CSS inline. Variables obligatorias para colores/espaciados/tipografia.
  - Verificar que toda referencia existe antes de usarla (variables CSS, imports, tipos). Si lo creas, conectalo.
  - UI atomica: todo elemento reutilizable es su propio componente. Zustand para estado global.

**9. Comentarios = memoria del proyecto.**
  - Formato: bloques `/* ... */` explicando el "por que". Prohibido barras decorativas (`====`).
  - Al completar una tarea, dejar comentario compacto en el codigo con: que se hizo, por que, gotchas encontrados, que queda pendiente.
  - No borrar comentarios de tareas anteriores — son registro de evolucion. Actualizar si quedan obsoletos.
  - Las lecciones aprendidas viven en los comentarios del codigo, no en MDs.

**10. Validacion obligatoria — errores ajenos incluidos.**
  - Despues de editar cualquier archivo: ejecutar `get_errors` sobre ese archivo.
  - Despues de editar `.ts`/`.tsx`: ejecutar `npm run type-check`.
  - Despues de editar `.css`: ejecutar VarSense (`cssVarsValidator.scanAllDiagnostics`).
  - Generacion masiva (>3 archivos): ejecutar Code Sentinel (`codeSentinel.analyzeWorkspace`).
  - Antes de cada commit: `npm run type-check` como minimo.
  - **Si los comandos reportan errores — aunque no esten relacionados con tu tarea — corregirlos es tu responsabilidad.** No se avanza ni se commitea con errores pendientes. Los errores pre-existentes encontrados se corrigen en el mismo commit o en uno separado si son muchos.

**11. Commits.**
  - Prohibido `git add .` o `git add --all`. Siempre `git add archivo1 archivo2` explicito.
  - Verificar `git diff --stat HEAD` y `git status` antes de commitear.
  - Cada tarea = un commit separado. Mensaje claro: `{id}: descripcion breve`.
  - Commit automatico al completar tarea, sin pedir permiso.

**12. PowerShell + SSH.**
  - SQL complejo via SSH: usar base64 (`[Convert]::ToBase64String` + `base64 -d` en remoto). PS5 no tiene heredoc.
  - Alternativa: crear `.sh` local, copiar con `scp`, ejecutar remotamente.

---

## II. FLUJO DE TRABAJO (ciclo continuo)

El roadmap (`App/roadmap.md`) es el canal de comunicacion. El usuario escribe tareas ahi, tu las ejecutas.

### ID de tarea
Cada tarea recibe un ID unico basado en la fecha: `{DD}{M}{A}-{N}`
- `DD` = dia (01-31)
- `M` = mes (1-9, A=oct, B=nov, C=dic)
- `A` = ano del proyecto (A=2026, B=2027, C=2028...)
- `N` = numero secuencial de tarea ese dia (1, 2, 3...)
- Ejemplo: 17 marzo 2026, tarea 1 = `173A-1`. Tarea 2 ese dia = `173A-2`.

### Paso 1 — Leer roadmap
Leer `App/roadmap.md` completo. Identificar todas las tareas pendientes.

### Paso 2 — Ejecutar tareas
Todas las tareas pendientes deben completarse antes de pasar al Paso 3. Reglas:
- **2.1** Cada tarea = un commit separado con mensaje claro.
- **2.2** Completar una tarea individualmente antes de pasar a otra. Se permite agrupar solo tareas completamente relacionadas.
- **2.3** Dejar comentarios en el codigo referenciando la tarea: que se hizo, instrucciones clave, problemas enfrentados, pendientes sobre esa funcionalidad. No borrar comentarios anteriores.
- **2.4** Prohibido avanzar sin marcar la tarea como completada, hacer commit y organizar los MDs.

### Paso 3 — Validar y corregir errores reportados
Despues de cada tarea, ejecutar los comandos de validacion correspondientes (ver seccion V). **Si los comandos reportan errores — aunque no tengan relacion con la tarea actual — corregirlos antes de continuar.** Los errores reportados por herramientas son tu responsabilidad. No se avanza con errores pendientes.

### Paso 4 — Archivar tarea completada
Mover la tarea completada del roadmap a un archivo en `App/Agente/completados/` con nombre `tareas-YYYY-MM-DD.md`. Si ya existe uno con la fecha de hoy, agregar ahi. El roadmap nunca acumula tareas completadas.

### Paso 5 — Documentar (si aplica)
Si hay algo que documentar sobre una funcionalidad, crear/actualizar un MD generico en `App/Agente/documentacion/{categoria}/` con nombre `tema-YYYY-MM-DD.md`. Nunca duplicar documentacion existente sobre el mismo tema — actualizar el archivo existente y cambiar la fecha en el nombre.

### Paso 6 — Prevencion (si aplica, problemas que se puedan detectar o prevenir con Code Sentinel)
Preguntarse: "Se puede detectar o prevenir automaticamente la proxima vez con Code Sentinel?" Si si, crear un MD en `App/Agente/prevencion/` con nombre `prevencion-tema-YYYY-MM-DD.md` describiendo la regla a implementar, y dejar referencia en el roadmap como tarea pendiente.

### Paso 7 — Revisar pendientes de prevencion
Leer `App/Agente/prevencion/`. Si hay MDs pendientes de implementar:
1. Implementar la regla en `.agent/code-sentinel` (o `.agent/varsense` si es CSS).
2. Ejecutar la extension contra el caso original para verificar que detecta el problema.
3. Reinstalar la extension (`vsce package` + instalar `.vsix`).
4. Confirmar deteccion exitosa mediante test, eliminar el MD de prevencion y marcar como completada.
- Si no hay pendientes, saltar este paso.

### Paso 8 — Commit, push y deploy
Hacer commit final. Si el roadmap del proyecto indica que aplica deploy, usar `.agent/coolify-manager-rs` para subir al servidor. Ejecutar comandos de revision post-deploy.

### Paso 9 — Volver al Paso 1
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

> **Stack:** descripcion breve del stack tecnologico
> **Deploy:** si aplica, como se despliega (ej: Coolify, manual, N/A)
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
    prevencion/
      prevencion-tema-YYYY-MM-DD.md       <-- Reglas para Code Sentinel (pendientes de implementar)
```

### Reglas de los MDs
1. **roadmap.md** solo contiene tareas pendientes. Nunca acumula completadas.
2. Todo MD tiene fecha en su nombre (`YYYY-MM-DD`) para saber que tan actualizado esta.
3. Documentacion se organiza en carpetas por categoria dentro de `documentacion/`.
4. Nunca duplicar documentacion — si ya existe un MD sobre el tema, actualizarlo (y actualizar la fecha).
5. Lecciones aprendidas van en los comentarios del codigo, no en MDs separados.
6. Si la estructura de MDs esta desorganizada al iniciar sesion, reorganizarla como primera accion.
7. Archivos en `App/docs (ignorar)/` son legacy — no modificar ni mover sin instruccion del usuario.

---

## V. COMANDOS DE REVISION

### Validacion de codigo
| Cuando | Comando |
|--------|---------|
| Editar `.ts`/`.tsx` | `npm run type-check` + `get_errors` |
| Editar `.css` | VarSense: `cssVarsValidator.scanAllDiagnostics` |
| Generacion masiva | Code Sentinel: `codeSentinel.analyzeWorkspace` |
| Antes de commit | `npm run type-check` minimo |
| Lint + types integrado | `codeSentinel.runExternalTools` |

### Deploy (solo si el roadmap indica que aplica)
Usar `.agent/coolify-manager-rs` para deploys al servidor via Coolify.

### Otros comandos utiles
- `codeSentinel.analyzeFile` — analizar archivo actual
- `cssVarsValidator.exportReport` — reporte CSS exportable
- `cssVarsValidator.scanOrphanClasses` — clases CSS sin uso
