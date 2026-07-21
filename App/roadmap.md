# GloryTemplate Roadmap
pp
> **Descripcion:** Dashboard personal con tareas, habitos, proyectos, notas, actividad y mas. Tema WordPress con React islands.
> **Stack:** WordPress + PHP (backend REST), React + TypeScript (frontend islands), Zustand (estado), CSS modular
> **URL produccion:** https://task.nakomi.studio
> **Servidor:** nakomi (Coolify) stack UUID: u00gc8ss4csc4cckkg4g00ks
> **Deploy:** Coolify (.agent/coolify-manager-rs) sitio: nakomi
> **Repositorio:** glorytemplate: rama glory-react-logic
> **Espejo:** https://github.com/1ndoryu/task (rama main = glory-react-logic). Push: `git push task`. Submodulos: Glory, .agent/code-sentinel, .agent/varsense, .agent/coolify-manager-rs, .agent/coolify-manager.

## Herramientas del agente

- Code Sentinel: `.agent/code-sentinel`
- VarSense: `.agent/varsense`
- Coolify Manager: `.agent/coolify-manager-rs`

## Tareas pendientes

1. Hay un problema, anteriormente no se entiendo mi proposito, cuando doy click a un subhabito para abrir su configuracion se abre la configuracion del habito principal cuando deberia poder modificar el subhabito, esa nunca fue la intencion, los subhabitos deberían poder: posponerse individualmente, cambiar prioridad individualmente, o las otras caracteristica como en los habitos normales, por ejemplo en listaTareasHabito listaTareasHabito--compacto dentro de la configuracion del habito sigue habiendo el boton de lapiz para modificar el nombre en vez de haber un boton de configuracion para modificar el subhabito