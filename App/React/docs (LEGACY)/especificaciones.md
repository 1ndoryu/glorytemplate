Recopilación Completa de Requisitos del Cliente (Proyecto Autoescuela CAP)

1. Concepto General

Se trata de crear una plataforma web (SaaS) con calendarios automatizados para autoescuelas.

Primer objetivo: Crear el calendario para el curso CAP (Certificado de Aptitud Profesional, obligatorio para camioneros).

Propósito: Automatizar la generación del calendario introduciendo la disponibilidad de los alumnos, pero permitiendo edición manual posterior por parte de los dueños de la autoescuela.

Tipo de Web: Sitio interno de administración (no público en cuanto a contenido, pero sí accesible vía login). Herramienta de gestión.

2. Flujo de Trabajo (Workflow del Usuario)

Login: Al abrir la web, lo primero debe ser la pantalla de inicio de sesión (Usuario/Contraseña).

Configuración Inicial: El usuario entra y fija:

La semana que quiere generar.

Capacidad de alumnos por clase.

Descansos y duración de clases.

Horarios del centro.

Gestión de Alumnos: Se añade a los alumnos (nombre, apellidos, teléfono) y su disponibilidad.

Nota sobre disponibilidad: Debe ser totalmente flexible. Ejemplos: "ir 1 hora por la mañana y 2 por la tarde", "solo por la tarde", "solo días concretos".

Generación: Se pulsa "Generar Calendario". El sistema crea bloques respetando reglas, oferta y demanda.

Regla de Sobrecupo (Overbooking): Si hay más alumnos disponibles que cupo en la clase, debe salir un aviso para que el dueño seleccione manualmente quién entra.

Edición y Bloqueo (Snapshot):

Si el usuario quiere fijar una clase ("esta va sí o sí"), la bloquea.

Ejemplo: Cambiar horas de un alumno manualmentey bloquear esa fila.

Regenerar: Al volver a generar, el sistema respeta lo bloqueado y recalcula el resto.

Exportación: Descarga de reportes ("Plan alumnos" y "Totales alumnos").

Deshacer: Si el resultado no convence, debe haber opción de restaurar el calendario al estado anterior.

3. Reglas del Negocio (Hard Rules)

A. Estructura del Curso CAP

Asignaturas: 8 en total.

Horas Totales: 35 horas por alumno.

Seguimiento: El sistema debe llevar el conteo exacto de horas restantes por alumno (pueden hacerlo a su ritmo).

Duración Mínima: Ilegal completar las 35h en menos de 4 días (aunque tenga disponibilidad total).

B. Límites Legales Diarios

Máximo: 9 horas de clase al día por alumno.

Descansos Obligatorios:

Si hace 6h: 30 min descanso (o 2 de 15 min).

Si hace 9h: 45 min descanso (3 de 15 min o 1 de 30 min + 1 de 15 min).

Configuración: La autoescuela selecciona la distribución y puede moverlos después de generar.

C. Reglas Operativas del Calendario

Prioridad: Disponibilidad del alumno.

Capacidad: Configurable (5, 10, 15 alumnos, etc.).

Bloqueos: El generador no toca ni pisa clases bloqueadas manualmente.

Anti-solapes: No crear clases que choquen con las bloqueadas.

Anti-duplicados: No generar clases idénticas si ya existen.

D. Horarios Típicos del Centro (Configurables)

Mañana: 08:00–15:30 (L–J) y 07:30–15:30 (S–D). Viernes mañana NO hay clase.

Tarde: 15:00–23:00 (L–J) o alternativa 18:00–23:00. Viernes: 16:00–21:30. S–D tarde NO hay clase.

4. Pantallas Solicitadas

Login: Usuario, contraseña.

Configuración: Semana a generar, capacidad, descansos, duración clases.

Asignaturas:

Cambiar duración total (por si cambia la ley).

Asignar color para el calendario.

Alumnos: Disponibilidad detallada y horas restantes.

Calendario (Vista Principal):

Vista semanal.

Edición de clase: Fecha, inicio/fin, tramo, asignatura, capacidad, alumnos (multi-selección), bloqueada (sí/no), notas.

Botones: Generar, Deshacer, Exportar.

5. Reportes (PDF)

Plan Alumnos (Semana): Listado por alumno con: Nombre, fecha, día, hora inicio/fin, tramo, asignatura y horas previstas.

Totales Alumnos (Semana): Sumatorio de horas por asignatura y total general de la semana por alumno.

6. Modelo de Negocio (SaaS) y Pagos

Suscripción: Los usuarios (autoescuelas) pagarán una suscripción mensual.

Pasarela de Pago: Necesaria para gestionar cobros y cancelaciones.

Escalabilidad Comercial:

Inicio: Solo calendario CAP.

Futuro: Calendarios para otros cursos/clases normales.

Niveles futuros: Básica, Estándar, Premium.

Costes: El cliente asume que las actualizaciones futuras (multiclase, nuevos calendarios) se pagarán como extras.

7. Especificaciones Técnicas y Aclaraciones

Tecnología: No impone restricciones ("Por mi no hay problema si lo haces con WordPress... usa la herramienta con la que mejor te manejes"), siempre que cumpla los requisitos. Nota: Se decidió evitar WP por complejidad técnica.

Simultaneidad (Aulas):

Inicialmente: 1 única clase a la vez.

Futuro: Posibilidad de gestionar más de una clase simultánea.

Instrucción: Crear la web para una clase, pero dejar la estructura preparada para actualizar a múltiples en el futuro.

Naturaleza de la Web: No puede ser estática (tiene motor de generación, bloqueos, snapshots).