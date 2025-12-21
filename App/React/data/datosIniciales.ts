/*
 * Datos Iniciales del Dashboard
 * Datos de demostracion usados cuando no hay datos en localStorage
 * Responsabilidad unica: proporcionar datos de ejemplo
 */

import type {Habito, Tarea, Proyecto} from '../types/dashboard';
import {crearFechaHaceNDias, crearFechaEnNDias} from '../utils/fecha';

/*
 * Habitos de demostracion
 * 3 habitos con diferentes estados:
 * - Uno atrasado (no completado ayer, deberia haberse hecho)
 * - Uno para mañana (proximo segun frecuencia)
 * - Uno para dentro de 3 dias
 */
export const habitosIniciales: Habito[] = [
    {
        id: 1,
        nombre: 'Deep Work / Coding',
        importancia: 'Alta',
        diasInactividad: 3,
        racha: 0,
        tags: ['dev', 'focus'],
        historialCompletados: [crearFechaHaceNDias(5), crearFechaHaceNDias(4), crearFechaHaceNDias(3)],
        ultimoCompletado: crearFechaHaceNDias(3),
        fechaCreacion: crearFechaHaceNDias(30),
        frecuencia: {tipo: 'diario'}
    },
    {
        id: 2,
        nombre: 'Lectura Tecnica',
        importancia: 'Media',
        diasInactividad: 0,
        racha: 5,
        tags: ['learning'],
        historialCompletados: [crearFechaHaceNDias(10), crearFechaHaceNDias(8), crearFechaHaceNDias(6), crearFechaHaceNDias(4), crearFechaHaceNDias(2), crearFechaHaceNDias(0)],
        ultimoCompletado: crearFechaHaceNDias(0),
        fechaCreacion: crearFechaHaceNDias(14),
        frecuencia: {tipo: 'cadaXDias', cadaDias: 2}
    },
    {
        id: 3,
        nombre: 'Ejercicio Fisico',
        importancia: 'Baja',
        diasInactividad: 1,
        racha: 8,
        tags: ['salud'],
        historialCompletados: [crearFechaHaceNDias(13), crearFechaHaceNDias(10), crearFechaHaceNDias(7), crearFechaHaceNDias(4), crearFechaHaceNDias(1)],
        ultimoCompletado: crearFechaHaceNDias(1),
        fechaCreacion: crearFechaHaceNDias(20),
        frecuencia: {tipo: 'cadaXDias', cadaDias: 3}
    }
];

/*
 * Tareas de demostracion
 * 2 tareas con diferentes opciones:
 * - Una con prioridad baja
 * - Una con prioridad media y descripcion
 */
export const tareasIniciales: Tarea[] = [
    {
        id: 1,
        texto: 'Revisar backlog semanal',
        completado: false,
        prioridad: 'baja',
        fechaCreacion: crearFechaHaceNDias(2)
    },
    {
        id: 2,
        texto: 'Preparar presentacion del proyecto',
        completado: false,
        prioridad: 'media',
        fechaCreacion: crearFechaHaceNDias(1),
        configuracion: {
            descripcion: 'Incluir graficos de progreso, metricas clave y proximos pasos. Revisar con el equipo antes de enviar.',
            fechaMaxima: crearFechaEnNDias(5)
        }
    }
];

/*
 * Notas iniciales del scratchpad
 */
export const notasIniciales = `- Idea: Refactorizar el modulo de fechas
- Recordatorio: Revisar tareas pendientes

> La consistencia gana a la intensidad.`;

/*
 * Proyectos de demostracion
 * 2 proyectos con tareas asignadas
 */
export const proyectosIniciales: Proyecto[] = [
    {
        id: 1,
        nombre: 'Lanzamiento Web Personal',
        descripcion: 'Rediseño y lanzamiento de portfolio en Next.js',
        prioridad: 'alta',
        estado: 'activo',
        fechaCreacion: crearFechaHaceNDias(10),
        progreso: 35
    },
    {
        id: 2,
        nombre: 'Aprender TypeScript',
        descripcion: 'Curso completo y proyecto practico en TypeScript',
        prioridad: 'media',
        estado: 'activo',
        fechaCreacion: crearFechaHaceNDias(20),
        progreso: 25
    }
];

/*
 * Tareas de proyectos de demostracion
 * Tareas asociadas a los proyectos iniciales
 */
export const tareasProyectosIniciales: Tarea[] = [
    /* Tareas del proyecto 1: Lanzamiento Web Personal */
    {
        id: 101,
        texto: 'Diseñar wireframes de la pagina principal',
        completado: true,
        proyectoId: 1,
        prioridad: 'alta',
        fechaCreacion: crearFechaHaceNDias(9)
    },
    {
        id: 102,
        texto: 'Implementar componente de navegacion',
        completado: false,
        proyectoId: 1,
        prioridad: 'media',
        fechaCreacion: crearFechaHaceNDias(5),
        configuracion: {
            descripcion: 'Incluir menu responsivo y animaciones suaves'
        }
    },
    {
        id: 103,
        texto: 'Configurar dominio y hosting',
        completado: false,
        proyectoId: 1,
        fechaCreacion: crearFechaHaceNDias(3)
    },
    /* Tareas del proyecto 2: Aprender TypeScript */
    {
        id: 201,
        texto: 'Completar modulo de tipos basicos',
        completado: true,
        proyectoId: 2,
        fechaCreacion: crearFechaHaceNDias(18)
    },
    {
        id: 202,
        texto: 'Practicar interfaces y tipos genericos',
        completado: false,
        proyectoId: 2,
        prioridad: 'alta',
        fechaCreacion: crearFechaHaceNDias(10),
        configuracion: {
            descripcion: 'Resolver al menos 5 ejercicios del curso'
        }
    }
];
