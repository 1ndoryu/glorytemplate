# Plan de Sistema "Smart Drag & Drop" y Resolución de Conflictos

> **Objetivo:** Implementar una experiencia de usuario fluida y segura para mover clases en el calendario, eliminando la rigidez de las zonas de "soltar" actuales y previniendo superposiciones accidentales mediante un sistema de alertas inteligente.

## 1. Análisis del Problema Actual
1.  **Dropzones Rígidas:** El usuario debe acertar en un área pequeña ("SOLTAR AQUI"), lo que es frustrante.
2.  **Falta de Validación:** El sistema permite soltar una clase encima de otra (mismo día u otro día) sin advertencia, creando superposiciones visuales "terribles".
3.  **Calculo de Hora:** La hora no se infiere de la posición visual del ratón, sino del slot específico donde se suelta.

## 2. Solución Propuesta: "Smart Snap & Safety"

### 2.1 Concepto de Interacción (UX)
*   **Columna Completa es Dropzone:** Cada columna de día (`ColumnaDia`) será una única zona de soltar (Droppable) grande.
*   **Cálculo de Posición (Snapping):**
    *   Al arrastrar una clase sobre una columna, calcularemos su posición `Y` relativa al contenedor del día.
    *   Convertiremos `pixeles` -> `minutos` basándonos en la altura de la hora (ej: `60px = 60min`).
    *   **Snap:** La clase "saltará" visualmente al intervalo más cercano (ej. cada 15 o 30 min) mientras se arrastra (si es posible con `dnd-kit`) o al soltarla.
    *   *Resultado:* El usuario suelta la clase "más o menos a las 10:00" y el sistema la ajusta matemáticamente a `10:00:00`.
*   **Feedback Visual:**
    *   Mostrar una "sombra" o indicador de dónde caerá la clase antes de soltar.

### 2.2 Sistema de Gestión de Conflictos (Lógica)
Antes de confirmar cualquier movimiento (mismo día o distinto), el sistema ejecutará una **Validación de Colisión**.

**Algoritmo de Validación:**
1.  Detectar `NuevaHoraInicio` y `NuevaHoraFin` basadas en la posición de soltado.
2.  Buscar en el estado (`clases` del día destino) si existe alguna clase que intercepte el intervalo `[NuevaHoraInicio, NuevaHoraFin]`.
3.  *Excepción:* Ignorar la misma clase que se está moviendo.

**Escenarios:**
*   **Caso A: Espacio Libre:**
    *   Acción: Mover inmediatamente.
    *   Feedback: Sonido suave o snap visual.
*   **Caso B: Colisión Detector (Choque):**
    *   Acción: **DETENER** el movimiento (no actualizar estado visual final todavía).
    *   UI: Mostrar **Modal de Resolución de Conflictos**.

### 2.3 Modal de Resolución de Conflictos
Este modal es crítico para cumplir con el requisito de "alerta".

**Contenido del Modal:**
*   **Título:** "Conflicto de Horario detectado"
*   **Mensaje:** "Estás moviendo la clase **[Asignatura]** a las **[Hora]**. Esto choca con:"
*   **Lista:** Muestra las clases afectadas (ej. "Mecánica (10:00 - 11:00)").
*   **Opciones de Acción:**
    1.  **⛔ Cancelar:** La clase vuelve a su posición original.
    2.  **⬇️ Desplazar (Push):** La clase nueva toma el lugar; la clase existente se *empuja* hacia abajo (cambia su hora de inicio a `NuevaHoraFin` de la clase entrante). *Nota: Esto puede causar efecto dominó, se validará recursivamente o se limitará a 1 nivel.*
    3.  **🔄 Intercambiar (Swap):** (Opcional) Si las duraciones coinciden, intercambian lugares.
    4.  **🗑️ Sobrescribir:** Borra la clase antigua y pone la nueva (Peligroso, quizás oculto o secundario).

> **Recomendación MVP:** Inicialmente implementar **Cancelar** y **Mover de todas formas (Solapando)** o **Desplazar simple**. El usuario mencionó "desplazará determinadas clases", lo que sugiere la opción de Empujar/Desplazar.

## 3. Plan Técnico de Implementación

### Fase A: Refactorización del Drag & Drop (Snapping)
1.  **Frontend (`dnd-kit`):**
    *   Cambiar `Droppable` de slots individuales a un `Droppable` por `ColumnaDia`.
    *   En `onDragEnd`:
        *   Obtener coordenadas del evento (`delta.y`).
        *   Calcular nueva hora: `HoraBase + (Pixeles / PixelesPorHora)`.
        *   Redondear a `step` de 15/30 min.

### Fase B: Lógica de Validación
1.  **Utilities:**
    *   Crear `checkTimeCollision(claseMoviendose, listaClasesDia, nuevaHora)`.
    *   Devuelve: `{ hasCollision: boolean, collidingClasses: ClassItem[] }`.

### Fase C: Interfaz de Alerta
1.  **Estado Global UI:**
    *   Añadir `collisionModalState` en Zustand (`useCalendarioStore` o nuevo `useUIStore`).
2.  **Componente Modal:**
    *   `ConflictModal.tsx`: Renderiza encima del calendario si hay colisión pendiente.

### Fase D: Ejecución del Movimiento
1.  **Refactor Action:**
    *   Modificar la acción `moverClase` en el store.
    *   Ahora aceptará un flag `force` o `strategy` ('plain', 'push').
    *   Si `strategy === 'push'`, calcula nuevos horarios para las clases afectadas.

## 4. Estimación de Complejidad
*   **Calculo de Coordenadas:** Media (requiere precisión de píxeles/CSS).
*   **Detección Colisiones:** Baja (matemática de rangos simple).
*   **Lógica de Desplazamiento (Push):** Alta (efecto cascada: si muevo A sobre B, B baja. ¿Y si B choca con C?).
    *   *Simplificación:* Solo desplazar la inmediata, si esa choca, mostrar error "No hay espacio suficiente".

## 5. Siguientes Pasos Inmediatos
1.  Actualizar ROADMAP.md con este plan.
2.  Crear estructura de archivos para los nuevos helpers (`collisionUtils.ts`).
