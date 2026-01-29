# Test Plan: Clases Bloqueadas y Conflictos de Horario

## Contexto
Fix implementado para manejar correctamente las clases bloqueadas en el sistema de resolución de conflictos.

## Escenarios de Prueba

### ✅ Escenario 1: Mover clase a horario ocupado por clase NO bloqueada
**Setup:**
1. Clase A: Lunes 08:00-13:00 (NO bloqueada)
2. Clase B: Lunes 15:00-19:00 (NO bloqueada)

**Acción:**
Arrastrar Clase B a las 09:00 (solapa con Clase A)

**Resultado esperado:**
- Modal de conflicto se muestra
- Botón "Desplazar clases" funciona correctamente
- Clase A se desplaza a las 14:00 (después de Clase B)
- Ambas clases se actualizan sin errores

---

### ✅ Escenario 2: Mover clase a horario ocupado por clase BLOQUEADA
**Setup:**
1. Clase A: Lunes 08:00-13:00 (BLOQUEADA)
2. Clase B: Lunes 15:00-19:00 (NO bloqueada)

**Acción:**
Arrastrar Clase B a las 09:00 (solapa con Clase A bloqueada)

**Resultado esperado:**
- Modal de conflicto se muestra
- Al hacer clic en "Desplazar clases":
  - Se muestra toast: "No se puede desplazar porque hay clases bloqueadas en el camino..."
  - Sistema busca automáticamente horario más cercano
  - Clase B se mueve al horario disponible más cercano (13:00 o posterior)
  - Clase A NO se mueve (permanece bloqueada en 08:00-13:00)

---

### ✅ Escenario 3: Desplazamiento en cascada con clase bloqueada intermedia
**Setup:**
1. Clase A: Lunes 08:00-10:00 (NO bloqueada)
2. Clase B: Lunes 10:00-12:00 (BLOQUEADA)
3. Clase C: Lunes 12:00-14:00 (NO bloqueada)
4. Clase D: Lunes 15:00-17:00 (NO bloqueada)

**Acción:**
Arrastrar Clase D a las 09:00 (solaparía con A, empujando a B y C)

**Resultado esperado:**
- Modal de conflicto detecta que hay clase bloqueada (B) en el camino
- Al intentar desplazar:
  - Sistema detecta que Clase B está bloqueada y no se puede mover
  - Toast de notificación sobre clase bloqueada
  - Fallback automático: busca horario más cercano disponible
  - Clase D se mueve a horario alternativo que no cause conflicto
  - Clases A, B, C NO se mueven

---

### ✅ Escenario 4: Editar hora desde modal de detalle con conflicto
**Setup:**
1. Clase A: Martes 10:00-12:00 (BLOQUEADA)
2. Clase B: Martes 14:00-16:00 (NO bloqueada)

**Acción:**
1. Abrir modal de detalle de Clase B
2. Cambiar hora inicio a 10:00

**Resultado esperado:**
- Detecta conflicto con Clase A bloqueada
- Modal de conflicto se muestra
- Opción "Desplazar clases" detecta clase bloqueada
- Fallback automático a horario más cercano
- Clase B se mueve al slot disponible más cercano a 10:00
- Clase A permanece bloqueada sin cambios

---

### ✅ Escenario 5: No hay horario disponible cercano
**Setup:**
1. Clases bloqueadas ocupando todos los slots del día
2. Clase X: Miércoles 15:00-17:00 (NO bloqueada)

**Acción:**
Intentar mover Clase X a horario ocupado por bloqueada

**Resultado esperado:**
- Modal de conflicto se muestra
- Al intentar desplazar: detecta clases bloqueadas
- Busca horario cercano: NO encuentra disponible
- Toast: "No hay un horario disponible cercano para mover la clase"
- Modal se cierra
- Clase X permanece en su posición original

---

## Validaciones de Integridad

### ✅ Estado consistente
- [ ] Clases bloqueadas NUNCA cambian de posición involuntariamente
- [ ] No se crean solapamientos después de resolver conflictos
- [ ] Historial (Deshacer) funciona correctamente
- [ ] Actualización optimista se revierte correctamente en caso de error

### ✅ Mensajes de usuario
- [ ] Mensajes claros cuando hay conflicto con bloqueada
- [ ] Toast indica qué está pasando (desplazamiento → fallback)
- [ ] Error específico si se intenta mover una clase que está bloqueada

### ✅ Comportamiento del modal
- [ ] Modal de conflicto muestra información correcta
- [ ] Botón "Mover al más cercano" funciona correctamente
- [ ] Modal se cierra correctamente después de resolver

---

## Casos Edge

### Clase que se intenta mover está bloqueada
**Acción:** Arrastrar una clase bloqueada a otra posición

**Resultado esperado:**
- Drag NO se activa (está bloqueado desde el inicio)
- Si de alguna forma se intenta mover: error claro indicando que está bloqueada

### Todas las clases del día están bloqueadas
**Resultado esperado:**
- Sistema puede agregar nuevas clases en horarios libres
- No se pueden desplazar las existentes

---

## Checklist de Testing Manual

- [ ] Escenario 1: Desplazamiento normal sin bloqueadas
- [ ] Escenario 2: Conflicto directo con bloqueada
- [ ] Escenario 3: Cascada con bloqueada intermedia
- [ ] Escenario 4: Edición desde modal con conflicto
- [ ] Escenario 5: Sin horario alternativo disponible
- [ ] Validar mensajes de toast
- [ ] Verificar que Deshacer funciona correctamente
- [ ] Confirmar que no hay errores en consola
- [ ] Verificar que estado del backend es consistente

---

## Notas de Implementación

**Cambios principales:**
1. `resolverDesplazamientoCascada` retorna `null` si detecta bloqueadas
2. Handlers validan respuesta antes de aplicar cambios
3. Fallback automático a `encontrarHorarioDisponibleMasCercano`
4. Validación previa en `moverMultiplesClases` para evitar intentos inválidos

**Archivos modificados:**
- `collisionUtils.ts`
- `CalendarioSemanal.tsx`
- `ModalDetalleClase.tsx`
- `useCalendario.ts`
