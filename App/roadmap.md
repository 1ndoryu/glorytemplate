# GloryTemplate Roadmap

> **Descripción:** Dashboard personal con tareas, hábitos, proyectos, notas, actividad y más. Tema WordPress con React islands.
> **Stack:** WordPress + PHP (backend REST), React + TypeScript (frontend islands), Zustand (estado), CSS modular
> **URL producción:** https://task.nakomi.studio
> **Servidor:** nakomi (Coolify) stack UUID: u00gc8ss4csc4cckkg4g00ks
> **Deploy:** Coolify (.agent/coolify-manager-rs) sitio: nakomi
> **Repositorio:** glorytemplate: rama glory-react-logic
> **Espejo:** https://github.com/1ndoryu/task (rama main = glory-react-logic). Push: `git push task`. Submódulos: Glory, .agent/code-sentinel, .agent/varsense, .agent/coolify-manager-rs, .agent/coolify-manager.

## Herramientas del agente

- Code Sentinel: `.agent/code-sentinel`
- VarSense: `.agent/varsense`
- Coolify Manager: `.agent/coolify-manager-rs`

## Tareas pendientes

### 0. Migración de WordPress a Glory RS manteniendo el frontend
> Plan: `PLAN_MIGRACION_GLORY_RS.md` — **Activo: Fase 0, inventario y decisiones bloqueantes**

Reemplazar progresivamente WordPress/PHP por un monolito Rust/Axum + PostgreSQL, conservando el frontend React actual. La primera fase debe producir el catálogo de 141 rutas, DTOs, permisos, consumidores, tablas y dependencias, y resolver la estrategia de identidad/sesión antes de implementar.

### 1. Dependencias condicionales entre tareas, hábitos y subhábitos
> Plan: `PLAN_DEPENDENCIAS.md`

Permitir condicionar una tarea, hábito o subhábito a que otro elemento esté completado antes de poder marcarlo. Debe funcionar entre todos los tipos (tarea ↔ hábito ↔ subhábito). Los elementos bloqueados pierden opacidad (50 %), muestran un badge de candado y, al intentar completarlos, la dependencia faltante parpadea y se muestra una alerta. Se incluirán dos modos de condición:
- **Estricto:** la dependencia se reinicia cada día/periodo según la frecuencia.
- **Suave:** una vez cumplida, la dependencia queda desbloqueada indefinidamente aunque el dependiente no se haya completado.

### 2. Grupos de ejecución (multi-panel de tareas/hábitos)
> Plan: `PLAN_GRUPOS_EJECUCION.md`

Añadir un concepto de "grupo" a las tareas y hábitos para poder tener varios paneles de ejecución abiertos simultáneamente, cada uno mostrando un grupo distinto. Las tareas sin grupo permanecen en el estado base. Desde la sección de acciones del panel se podrá cambiar de grupo, crear uno nuevo o volver a "sin grupo". Las tareas y hábitos se podrán crear directamente en un grupo y arrastrar entre grupos. Los grupos se persisten para que cada panel recuerde el suyo tras recargar.

### 3. División de paneles dentro de una columna
> Plan: `PLAN_SPLIT_PANEL.md`

Permitir dividir un panel en dos dentro de la misma columna del layout, comenzando por el panel de ejecución y el de notas. Esto no añade más columnas al layout, sino que añade un botón de "dividir" en las opciones del panel. Similar a cómo las notas permiten abrir varias instancias, un panel dividido mostrará dos vistas independientes una al lado de la otra.
