---
applyTo: '**'
---
# Protocolo de Desarrollo y Conducta (v3.2)

## 0. VSCODE INSTRUCCIÓN

* **Flujo**: Al iniciar una tarea o recibir instrucciones del usuario, trabaja prolongadamente en cumplir cada una de las tareas, no te detengas a realizar consultas o dudas al usuario, o dividir la tarea en pasos. Cada vez que te detienes a consultar al usuario, consumes una llamada de credito del usuario, por eso debes evitarlo al máximo posible y solo realizar consultas cuando sea estrictamente necesario. Si tienes varios pasos o varias metas o varias tareas, hazlas todas de una vez. Si puedes asegurarte por tu cuenta que todo este bien, testear por tu cuenta, revisiones extra, mejor para asegurar el menor numero de llamadas posibles, aprovechar para hacer refactorizaciones que no impliquen riesgos, mejoras pequeñas, etc.

## 1. Principios Generales y Comunicación
* **Idioma:** Español obligatorio en toda comunicación y nombres de clases CSS.
* **Ambigüedad:** Ante la duda, **PREGUNTA** antes de escribir código. (No es relevante en VSCODE)
* **Prohibiciones:** Cero emojis en código/comentarios.
* **Integridad:** Prohibido omitir código (`// ...resto`). Ediciones atómicas y completas.
* **Mentalidad:** Entender antes de modificar. Si ves una mejora arquitectónica posible, **hazla** (si es rápida) o deja un **TO-DO** comentado.

## 2. Estándares de Código y Comentarios
* **Nomenclatura JS/TS:** `camelCase` (vars/funcs), `PascalCase` (componentes/clases).
* **Nomenclatura CSS:** **Español** y `camelCase` (ej: `.contenedorPrincipal`, `.botonActivo`).
* **Limpieza:** Priorizar legibilidad. Evitar namespaces completos en imports.
* **Formato de Comentarios:**
    * **Prohibido:** Barras decorativas (`====`).
    * **Obligatorio:** Bloques limpios `/* ... */` o breves líneas explicativas del "por qué".
    * **Registro:** Dejar comentarios cortos sobre lo aprendido o arreglado en cada iteración.

## 3. Arquitectura y SOLID (CRÍTICO)
* **Límites de Archivo:**
    * Componentes/Estilos: máx **300 líneas**.
    * Hooks: máx **120 líneas**.
    * Utils: máx **150 líneas**.
    * *Acción:* Si excede, dividir obligatoriamente.
* **Organización Escalable (Directorios):**
    * **PROHIBIDO** acumular todos los componentes en una sola carpeta plana.
    * **OBLIGATORIO** organizar jerárquicamente por dominio, módulo o tipo (ej: `components/ui/`, `features/auth/`, `layouts/`). Estructurar pensando siempre que el proyecto va a crecer.
* **SRP (Single Responsibility):** 1 Componente = 1 Responsabilidad. (Máx 3 `useState`, separar lógica de vista).
* **Principios:**
    * **OCP:** Extender por props/composición, no modificar fuente.
    * **LSP:** Hijos sustituibles por padres.
    * **ISP:** Props mínimas y específicas.
    * **DIP:** Depender de abstracciones/interfaces.

## 4. React y Estado
* **Atomicidad (Todo es un Componente):** Cualquier elemento de UI reutilizable o distinguible (botones, badges, inputs, tarjetas) **DEBE** abstraerse en su propio componente. No duplicar JSX ni crear componentes monolíticos.
* **Gestión de Estado:** Usar **Zustand** (o herramientas simples) para evitar complejidad.
* **Identificadores:** Todo contenedor principal debe tener `id` único (ej: `id="seccionHero"`).
* **Estructura:** Componentes pequeños y enfocados.

## 5. Estilos CSS (Centralizados)
* **Ubicación:** Todo en archivos `.css` separados (ej: `init.css`, `variables.css`). **Prohibido CSS inline** o hardcodeado.
* **Variables:** Uso obligatorio para colores, espaciados y tipografía.
* **Reutilización:** Buscar clases existentes antes de crear nuevas y jamas olvides revisar las variables y usarlas.

## 6. Flujo de Trabajo y Entrega
1.  **Ejecución:**
    * **NO** ejecutar comandos de terminal para verificar errores (linter/build).
    * **NO** ejecutar el navegador.
    * *Nota:* El usuario es el responsable de probar y verificar errores.
2.  **Commit:** Al finalizar una tarea, realizar **commit** de los cambios automáticamente (sin pedir permiso).
3.  **Documentación:** Actualizar siempre los `.md` de documentación y contexto al terminar.
4.  **Cierre de Interacción:**
    * Dejar un resumen **muy corto** de qué debe comprobar el usuario.
    * Listar brevemente los cambios/arreglos realizados.
    * Realizar (o anotar) TO-DOs de mejora arquitectónica aunque no sean el foco principal, estos TO-DOs siempre tienen que ir en los comentarios del codigo o en el md de trabajo.

---

### Ejemplo de Estilo de Comentario Aceptado

```javascript
/*
 * Función para calcular totales.
 * Se extrajo la lógica de impuestos para cumplir SRP.
 */
const calcularTotal = () => { ... }