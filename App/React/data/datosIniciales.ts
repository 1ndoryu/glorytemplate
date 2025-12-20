/*
 * Datos Iniciales del Dashboard
 * Datos de demostracion usados cuando no hay datos en localStorage
 * Responsabilidad unica: proporcionar datos de ejemplo
 */

import type {Habito, Tarea} from '../types/dashboard';
import {crearFechaHaceNDias} from '../utils/fecha';

/*
 * Habitos de demostracion
 * Ordenados por Importancia (Alta > Media > Baja) y Dias de Inactividad
 */
export const habitosIniciales: Habito[] = [
    {
        id: 1,
        nombre: 'Deep Work / Coding',
        importancia: 'Alta',
        diasInactividad: 4,
        racha: 12,
        tags: ['dev', 'focus'],
        historialCompletados: [],
        ultimoCompletado: undefined,
        fechaCreacion: crearFechaHaceNDias(30)
    },
    {
        id: 2,
        nombre: 'Lectura Tecnica',
        importancia: 'Alta',
        diasInactividad: 2,
        racha: 5,
        tags: ['learning'],
        historialCompletados: [],
        ultimoCompletado: undefined,
        fechaCreacion: crearFechaHaceNDias(14)
    },
    {
        id: 3,
        nombre: 'Ejercicio Fisico',
        importancia: 'Media',
        diasInactividad: 5,
        racha: 0,
        tags: ['salud'],
        historialCompletados: [],
        ultimoCompletado: undefined,
        fechaCreacion: crearFechaHaceNDias(20)
    },
    {
        id: 4,
        nombre: 'Revision de Backlog',
        importancia: 'Media',
        diasInactividad: 1,
        racha: 30,
        tags: ['admin'],
        historialCompletados: [],
        ultimoCompletado: undefined,
        fechaCreacion: crearFechaHaceNDias(45)
    },
    {
        id: 5,
        nombre: 'Meditacion',
        importancia: 'Baja',
        diasInactividad: 0,
        racha: 2,
        tags: ['mental'],
        historialCompletados: [],
        ultimoCompletado: undefined,
        fechaCreacion: crearFechaHaceNDias(7)
    }
];

/*
 * Tareas de demostracion
 * Mezcla de tareas pendientes y completadas
 */
export const tareasIniciales: Tarea[] = [
    {
        id: 1,
        texto: 'Refactorizar componente de autenticacion',
        completado: false
    },
    {
        id: 2,
        texto: 'Responder correos pendientes de clientes',
        completado: true
    },
    {
        id: 3,
        texto: 'Actualizar documentacion de API',
        completado: false
    },
    {
        id: 4,
        texto: 'Configurar entorno de staging',
        completado: false
    }
];

/*
 * Notas iniciales del scratchpad
 */
export const notasIniciales = `- Idea: Refactorizar el módulo de fechas
- Recordatorio: Comprar café

> La consistencia gana a la intensidad.`;

/*
 * Proyectos de demostracion
 */
import type {Proyecto} from '../types/dashboard';

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
        nombre: 'Aprender Rust',
        descripcion: 'Curso completo y proyecto final en Rust',
        prioridad: 'media',
        estado: 'pausado',
        fechaCreacion: crearFechaHaceNDias(45),
        progreso: 15
    }
];
