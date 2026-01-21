/**
 * Constantes de mensajes de error para el módulo CAP
 *
 * Sistema centralizado de mensajes descriptivos para mejorar la UX.
 * Cada mensaje incluye descripción clara y sugerencia de acción.
 *
 * TO-DO: Preparar para i18n en futuras versiones.
 */

/* Tipos de error conocidos por código */
export type CodigoError = 'CENTRO_NO_ENCONTRADO' | 'CLASE_NO_ENCONTRADA' | 'CLASE_BLOQUEADA' | 'SIN_DATOS_ACTUALIZAR' | 'ERROR_BLOQUEO' | 'ERROR_RED' | 'ERROR_AUTENTICACION' | 'SESION_EXPIRADA' | 'ERROR_SERVIDOR' | 'ERROR_DESCONOCIDO' | 'ALUMNO_NO_ENCONTRADO' | 'CONFLICTO_HORARIO' | 'DATOS_INVALIDOS' | 'REPORTE_NO_DISPONIBLE' | 'SIN_ALUMNOS_DISPONIBLES';

/* Estructura de un mensaje de error */
export interface MensajeError {
    titulo: string;
    descripcion: string;
    sugerencia?: string;
}

/* Mapeo de códigos de error del backend a mensajes descriptivos */
const MENSAJES_ERROR: Record<CodigoError, MensajeError> = {
    CENTRO_NO_ENCONTRADO: {
        titulo: 'Centro no encontrado',
        descripcion: 'No se encontró el centro asociado a tu cuenta.',
        sugerencia: 'Contacta con soporte si el problema persiste.'
    },
    CLASE_NO_ENCONTRADA: {
        titulo: 'Clase no encontrada',
        descripcion: 'La clase que intentas modificar no existe o fue eliminada.',
        sugerencia: 'Recarga el calendario para ver los cambios más recientes.'
    },
    CLASE_BLOQUEADA: {
        titulo: 'Clase bloqueada',
        descripcion: 'No se puede modificar una clase que está bloqueada.',
        sugerencia: 'Desbloquea la clase primero si necesitas editarla.'
    },
    SIN_DATOS_ACTUALIZAR: {
        titulo: 'Sin cambios',
        descripcion: 'No hay datos válidos para actualizar.',
        sugerencia: 'Verifica que hayas modificado algún campo antes de guardar.'
    },
    ERROR_BLOQUEO: {
        titulo: 'Error al cambiar bloqueo',
        descripcion: 'No se pudo cambiar el estado de bloqueo de la clase.',
        sugerencia: 'Intenta de nuevo. Si persiste, recarga la página.'
    },
    ERROR_RED: {
        titulo: 'Error de conexión',
        descripcion: 'No se pudo conectar con el servidor.',
        sugerencia: 'Verifica tu conexión a internet e intenta de nuevo.'
    },
    ERROR_AUTENTICACION: {
        titulo: 'No autorizado',
        descripcion: 'No tienes permisos para realizar esta acción.',
        sugerencia: 'Asegúrate de haber iniciado sesión correctamente.'
    },
    SESION_EXPIRADA: {
        titulo: 'Sesión expirada',
        descripcion: 'Tu sesión ha expirado por inactividad.',
        sugerencia: 'Inicia sesión nuevamente para continuar.'
    },
    ERROR_SERVIDOR: {
        titulo: 'Error del servidor',
        descripcion: 'Ocurrió un error interno al procesar tu solicitud.',
        sugerencia: 'Intenta de nuevo en unos momentos.'
    },
    ERROR_DESCONOCIDO: {
        titulo: 'Error inesperado',
        descripcion: 'Ocurrió un error no identificado.',
        sugerencia: 'Intenta de nuevo. Si persiste, contacta con soporte.'
    },
    ALUMNO_NO_ENCONTRADO: {
        titulo: 'Alumno no encontrado',
        descripcion: 'El alumno que buscas no existe o fue eliminado.',
        sugerencia: 'Actualiza la lista de alumnos para ver los datos actuales.'
    },
    CONFLICTO_HORARIO: {
        titulo: 'Conflicto de horario',
        descripcion: 'Ya existe una clase programada en ese horario.',
        sugerencia: 'Selecciona un horario diferente o edita la clase existente.'
    },
    DATOS_INVALIDOS: {
        titulo: 'Datos inválidos',
        descripcion: 'Los datos ingresados no son válidos.',
        sugerencia: 'Revisa los campos marcados y corrige los errores.'
    },
    REPORTE_NO_DISPONIBLE: {
        titulo: 'Reporte no disponible',
        descripcion: 'No se pudo generar el reporte solicitado.',
        sugerencia: 'Verifica que existan datos para el período seleccionado.'
    },
    SIN_ALUMNOS_DISPONIBLES: {
        titulo: 'Sin alumnos',
        descripcion: 'No hay alumnos disponibles para la operación.',
        sugerencia: 'Añade alumnos o verifica su disponibilidad horaria.'
    }
};

/* Patrones para detectar códigos de error desde mensajes del backend */
const PATRONES_ERROR: Array<{patron: RegExp; codigo: CodigoError}> = [
    {patron: /centro no encontrado/i, codigo: 'CENTRO_NO_ENCONTRADO'},
    {patron: /clase no encontrada/i, codigo: 'CLASE_NO_ENCONTRADA'},
    {patron: /clase (está )?bloqueada/i, codigo: 'CLASE_BLOQUEADA'},
    {patron: /no se puede (editar|modificar|mover).*bloqueada/i, codigo: 'CLASE_BLOQUEADA'},
    {patron: /no hay datos/i, codigo: 'SIN_DATOS_ACTUALIZAR'},
    {patron: /error al cambiar bloqueo/i, codigo: 'ERROR_BLOQUEO'},
    {patron: /alumno no encontrado/i, codigo: 'ALUMNO_NO_ENCONTRADO'},
    {patron: /conflicto.*horario/i, codigo: 'CONFLICTO_HORARIO'},
    {patron: /ya existe.*clase/i, codigo: 'CONFLICTO_HORARIO'},
    {patron: /datos.*inv[aá]lid/i, codigo: 'DATOS_INVALIDOS'},
    {patron: /reporte.*no.*disponible/i, codigo: 'REPORTE_NO_DISPONIBLE'},
    {patron: /sin alumnos/i, codigo: 'SIN_ALUMNOS_DISPONIBLES'},
    {patron: /no.*pertenece/i, codigo: 'CLASE_NO_ENCONTRADA'}
];

/**
 * Detecta el código de error a partir de un mensaje del backend
 */
function detectarCodigoError(mensaje: string): CodigoError {
    for (const {patron, codigo} of PATRONES_ERROR) {
        if (patron.test(mensaje)) {
            return codigo;
        }
    }
    return 'ERROR_DESCONOCIDO';
}

/**
 * Obtiene el mensaje de error descriptivo para un código
 */
export function obtenerMensajeError(codigo: CodigoError): MensajeError {
    return MENSAJES_ERROR[codigo] || MENSAJES_ERROR.ERROR_DESCONOCIDO;
}

/**
 * Interpreta un error de fetch/respuesta HTTP y devuelve un mensaje descriptivo
 */
export function interpretarErrorHttp(status: number, mensajeBackend?: string): MensajeError {
    /* Primero intentar detectar desde el mensaje del backend */
    if (mensajeBackend) {
        const codigo = detectarCodigoError(mensajeBackend);
        if (codigo !== 'ERROR_DESCONOCIDO') {
            return obtenerMensajeError(codigo);
        }
    }

    /* Si no se detectó patrón, usar código HTTP */
    switch (status) {
        case 400:
            return obtenerMensajeError('DATOS_INVALIDOS');
        case 401:
            return obtenerMensajeError('ERROR_AUTENTICACION');
        case 403:
            return obtenerMensajeError('SESION_EXPIRADA');
        case 404:
            return obtenerMensajeError('CLASE_NO_ENCONTRADA');
        case 409:
            return obtenerMensajeError('CONFLICTO_HORARIO');
        case 500:
        case 502:
        case 503:
            return obtenerMensajeError('ERROR_SERVIDOR');
        default:
            return {
                titulo: 'Error',
                descripcion: mensajeBackend || 'Ocurrió un error al procesar la solicitud.',
                sugerencia: 'Intenta de nuevo.'
            };
    }
}

/**
 * Interpreta errores de red (fetch failed, timeout, etc.)
 */
export function interpretarErrorRed(error: Error): MensajeError {
    const mensaje = error.message.toLowerCase();

    if (mensaje.includes('network') || mensaje.includes('fetch')) {
        return obtenerMensajeError('ERROR_RED');
    }
    if (mensaje.includes('timeout') || mensaje.includes('aborted')) {
        return {
            titulo: 'Tiempo de espera agotado',
            descripcion: 'El servidor tardó demasiado en responder.',
            sugerencia: 'Verifica tu conexión e intenta de nuevo.'
        };
    }

    return obtenerMensajeError('ERROR_DESCONOCIDO');
}

/**
 * Formatea un mensaje de error completo para mostrar al usuario
 * Combina título, descripción y sugerencia en un solo texto
 */
export function formatearMensajeError(mensajeError: MensajeError): string {
    let texto = mensajeError.descripcion;
    if (mensajeError.sugerencia) {
        texto += ` ${mensajeError.sugerencia}`;
    }
    return texto;
}

/**
 * Genera mensajes específicos por contexto de operación
 * Para usar cuando se conoce la operación que falló
 */
export const MENSAJES_CONTEXTUALES = {
    calendario: {
        cargar: {
            fallback: 'No se pudieron cargar las clases del calendario.',
            sugerencia: 'Verifica tu conexión e intenta recargar la página.'
        },
        generar: {
            fallback: 'No se pudo generar el calendario.',
            sugerencia: 'Verifica que existan alumnos con disponibilidad configurada.'
        },
        mover: {
            fallback: 'No se pudo mover la clase.',
            sugerencia: 'Verifica que el día destino esté disponible.'
        },
        actualizar: {
            fallback: 'No se pudieron guardar los cambios.',
            sugerencia: 'Intenta de nuevo en unos momentos.'
        },
        bloquear: {
            fallback: 'No se pudo cambiar el estado de bloqueo.',
            sugerencia: 'Recarga la página e intenta de nuevo.'
        },
        eliminar: {
            fallback: 'No se pudo eliminar la clase.',
            sugerencia: 'Intenta de nuevo. Si está bloqueada, desbloquéala primero.'
        }
    },
    alumnos: {
        cargar: {
            fallback: 'No se pudieron cargar los alumnos.',
            sugerencia: 'Verifica tu conexión e intenta de nuevo.'
        },
        crear: {
            fallback: 'No se pudo crear el alumno.',
            sugerencia: 'Verifica que los datos sean correctos.'
        },
        actualizar: {
            fallback: 'No se pudieron guardar los cambios del alumno.',
            sugerencia: 'Intenta de nuevo.'
        },
        eliminar: {
            fallback: 'No se pudo eliminar el alumno.',
            sugerencia: 'Puede que tenga clases asignadas. Revisa su calendario.'
        }
    },
    disponibilidad: {
        cargar: {
            fallback: 'No se pudo cargar la disponibilidad.',
            sugerencia: 'Recarga la página para intentar de nuevo.'
        },
        guardar: {
            fallback: 'No se pudo guardar la disponibilidad.',
            sugerencia: 'Intenta de nuevo en unos momentos.'
        }
    },
    configuracion: {
        cargar: {
            fallback: 'No se pudo cargar la configuración.',
            sugerencia: 'Recarga la página para intentar de nuevo.'
        },
        guardar: {
            fallback: 'No se pudieron guardar los cambios.',
            sugerencia: 'Verifica los datos e intenta de nuevo.'
        }
    },
    reportes: {
        generar: {
            fallback: 'No se pudo generar el reporte.',
            sugerencia: 'Verifica que existan datos para el período seleccionado.'
        }
    }
} as const;

export type ContextoError = keyof typeof MENSAJES_CONTEXTUALES;
export type OperacionError<T extends ContextoError> = keyof (typeof MENSAJES_CONTEXTUALES)[T];

/**
 * Obtiene un mensaje de error contextualizado por módulo y operación
 */
export function obtenerMensajeContextual<T extends ContextoError>(contexto: T, operacion: OperacionError<T>): {fallback: string; sugerencia: string} {
    const contextoDatos = MENSAJES_CONTEXTUALES[contexto];
    const operacionDatos = contextoDatos[operacion as keyof typeof contextoDatos];
    return operacionDatos as {fallback: string; sugerencia: string};
}

/**
 * Función helper para procesar respuestas de API con errores descriptivos
 * Uso: await procesarRespuestaApi(response, 'calendario', 'mover')
 */
export async function procesarErrorApi<T extends ContextoError>(response: Response, contexto: T, operacion: OperacionError<T>): Promise<string> {
    const contextual = obtenerMensajeContextual(contexto, operacion);

    try {
        const data = await response.json();
        const mensajeBackend = data.error || data.message || data.mensaje;

        if (mensajeBackend) {
            const interpretado = interpretarErrorHttp(response.status, mensajeBackend);
            return formatearMensajeError(interpretado);
        }
    } catch {
        /* No se pudo parsear la respuesta como JSON */
    }

    /* Fallback al mensaje contextual */
    return `${contextual.fallback} ${contextual.sugerencia}`;
}
