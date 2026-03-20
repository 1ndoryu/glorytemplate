# Falsos positivos — Sentinel Report 2026-03-20

## 1. `html-nativo-en-vez-de-componente` en componentes UI base (Modal.tsx, Alerta.tsx)

**Problema:** Sentinel marca `<button>` nativo dentro de `Modal.tsx` (línea 67) y `Alerta.tsx` (línea 65) como violación. Pero estos archivos SON los componentes UI del sistema — usar un `<Boton>` dentro de `<Modal>` para el botón de cerrar crearía una dependencia circular.

**Regla a implementar:** Excluir archivos dentro de `components/ui/` de la regla `html-nativo-en-vez-de-componente`. Los componentes base del sistema de diseño DEBEN usar elementos nativos.

**Patrón de exclusión sugerido:** Si el archivo está en un path que matchea `**/components/ui/**`, no aplicar `html-nativo-en-vez-de-componente`.

---

## 2. `n-plus-1-query` en subconsultas correlacionadas (Alumno.php)

**Problema:** Sentinel marca las subconsultas correlacionadas en `obtenerPorCentro()` (línea 92) y `obtenerPorIds()` como N+1. Pero son subconsultas dentro de UN solo SELECT, no múltiples queries separadas. El motor de BD optimiza internamente. Mientras es subóptimo vs JOINs, NO es el antipatrón N+1 (múltiples round-trips a BD).

**Regla a implementar:** La regla `n-plus-1-query` debería distinguir entre:
- Queries dentro de loops PHP (verdadero N+1 — round-trips separados) → WARNING
- Subconsultas correlacionadas en SQL (subóptimo pero single query) → HINT con mensaje diferente: "Subconsulta correlacionada. Considerar reescribir como JOIN para mayor eficiencia."

---

## 3. `n-plus-1-query` en INSERT de clases con parent-child (CalendarPersistenceService.php)

**Problema:** Sentinel marca el INSERT de clases dentro del loop (línea 60) como N+1. Pero el patrón parent-child (clase → asistencia) REQUIERE el `$wpdb->insert_id` de cada padre para vincular los hijos. No se puede hacer batch INSERT del padre porque se perdería la relación.

**Regla a implementar:** Si un INSERT dentro de un loop es seguido inmediatamente por el uso de `$wpdb->insert_id` o equivalente para vincular registros hijos, debería ser INFO en vez de WARNING, con mensaje: "INSERT en loop justificado por relación parent-child (insert_id requerido)."

---

## 4. `fallo-sin-feedback` en catch de JSON.parse dentro de useEffect (PanelHorarios.tsx)

**Problema:** Sentinel marca el catch en línea 109 que usa `console.error` como "fallo sin feedback". Pero este catch es un fallback que maneja JSON malformado del config y cae al constructor de horarios por defecto. El usuario no necesita ver este error porque el fallback resuelve el problema automáticamente.

**Regla a implementar:** Si un catch block dentro de un parsing/deserialización tiene un fallback funcional (no solo logea y retorna), no debería marcarse como `fallo-sin-feedback`. Detectar patrón: `catch { console.error(...); /* código que no retorna ni re-throwea, seguido de lógica funcional */ }`.

---

## 5. Error crítico en `Glory/src/Tools/GitCommandRunner.php` (exec sin escapeshellarg)

**Nota:** Este archivo está en `Glory/` (submodulo/framework externo, gitignored). No es parte del proyecto App. Sentinel debería excluir `Glory/` si el path está en `.gitignore`, o al menos marcarlo como "fuera de scope" en el reporte.

**Regla a implementar:** Agregar opción de excluir paths gitignored del análisis, o al menos agruparlos en sección separada del reporte.
