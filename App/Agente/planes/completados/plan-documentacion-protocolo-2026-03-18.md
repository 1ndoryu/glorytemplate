# Plan — Documentación de dominios + protocolo de cierre — 2026-03-18

## Tareas
- 183A-10: documentaciones detalladas nuevas de algoritmo, colecciones, canciones/sampleos y sincronizador
- 183A-11: reforzar protocolo para documentación obligatoria, planes obligatorios en tareas complejas/repetitivas y campo explícito sobre Glory Sentinel en los MDs

## Fases
1. Auditar documentación nueva y completados de ayer/hoy para detectar huecos reales
2. Localizar en código los dominios a documentar sin depender de MDs legacy
3. Actualizar .github/instructions/test.instructions.md con reglas faltantes
4. Crear o actualizar MDs reutilizables por dominio en App/Agente/documentacion/
5. Validar cambios, archivar tareas, mover plan a completados y commitear

## Estado actual
- En curso
- 173A-8 ya documentó auth/push móvil y sirve como base parcial para 183A-11

## Riesgos
- El roadmap usa IDs duplicados y parte de la historia previa mezcla tareas de protocolo con tarea 183A-10 actual.
- La documentación pedida cubre varios dominios; hay que evitar copiar legacy y documentar desde código vigente.
