# Plan — Deploy Coolify + dependencias React remotas — 2026-03-18

## Tarea
- 183A-12: corregir fallo de health/deploy y verificar que el manager sí despliega commits reales

## Fases
1. Confirmar la causa del fallo remoto desde código y logs del roadmap
2. Corregir dependencias de App/React para imports de Capacitor
3. Ajustar coolify-manager-rs para no reutilizar node_modules obsoletos y para reportar commits también en rutas de fallo
4. Validar con builds locales y compilación del manager
5. Archivar tarea, mover plan a completados, commit y push

## Hallazgo inicial
- El build remoto falla resolviendo `@capacitor/push-notifications` desde App/React.
- update_glory_theme() solo ejecuta npm install si detecta ausencia de node_modules, no cambios de package/lock.
- App/React todavía no declara los paquetes de Capacitor que ahora importa.
