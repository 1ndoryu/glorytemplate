/*
 * dataService
 * Servicio para exportar e importar datos del dashboard
 * Permite transferir datos entre entornos mediante archivos JSON
 */

import type {Habito, Tarea} from '../types/dashboard';

export interface DatosDashboardExportados {
    version: string;
    fechaExportacion: string;
    habitos: Habito[];
    tareas: Tarea[];
    notas: string;
}

const VERSION_ACTUAL = '1.0.0';

/*
 * Exporta los datos del dashboard a un archivo JSON
 */
export function exportarDatos(habitos: Habito[], tareas: Tarea[], notas: string): void {
    const datosExportar: DatosDashboardExportados = {
        version: VERSION_ACTUAL,
        fechaExportacion: new Date().toISOString(),
        habitos,
        tareas,
        notas
    };

    const jsonString = JSON.stringify(datosExportar, null, 2);
    const blob = new Blob([jsonString], {type: 'application/json'});
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `dashboard-backup-${formatearFecha(new Date())}.json`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
}

/*
 * Importa datos desde un archivo JSON
 * Retorna una promesa con los datos parseados o un error
 */
export function importarDatos(archivo: File): Promise<DatosDashboardExportados> {
    return new Promise((resolve, reject) => {
        if (!archivo.name.endsWith('.json')) {
            reject(new Error('El archivo debe ser de tipo JSON'));
            return;
        }

        const lector = new FileReader();

        lector.onload = evento => {
            try {
                const contenido = evento.target?.result as string;
                const datos = JSON.parse(contenido) as DatosDashboardExportados;

                const resultado = validarDatosImportados(datos);
                if (!resultado.esValido) {
                    reject(new Error(resultado.mensaje));
                    return;
                }

                resolve(datos);
            } catch (error) {
                reject(new Error('Error al parsear el archivo JSON'));
            }
        };

        lector.onerror = () => {
            reject(new Error('Error al leer el archivo'));
        };

        lector.readAsText(archivo);
    });
}

/*
 * Valida que los datos importados tengan la estructura correcta
 */
interface ResultadoValidacion {
    esValido: boolean;
    mensaje: string;
}

function validarDatosImportados(datos: unknown): ResultadoValidacion {
    if (!datos || typeof datos !== 'object') {
        return {esValido: false, mensaje: 'Formato de datos inválido'};
    }

    const datosTyped = datos as Record<string, unknown>;

    if (!datosTyped.version || typeof datosTyped.version !== 'string') {
        return {esValido: false, mensaje: 'Falta la versión del archivo'};
    }

    if (!Array.isArray(datosTyped.habitos)) {
        return {esValido: false, mensaje: 'Los hábitos deben ser un arreglo'};
    }

    if (!Array.isArray(datosTyped.tareas)) {
        return {esValido: false, mensaje: 'Las tareas deben ser un arreglo'};
    }

    if (typeof datosTyped.notas !== 'string') {
        return {esValido: false, mensaje: 'Las notas deben ser texto'};
    }

    for (const habito of datosTyped.habitos) {
        const validacionHabito = validarHabito(habito);
        if (!validacionHabito.esValido) {
            return validacionHabito;
        }
    }

    for (const tarea of datosTyped.tareas) {
        const validacionTarea = validarTarea(tarea);
        if (!validacionTarea.esValido) {
            return validacionTarea;
        }
    }

    return {esValido: true, mensaje: 'OK'};
}

function validarHabito(habito: unknown): ResultadoValidacion {
    if (!habito || typeof habito !== 'object') {
        return {esValido: false, mensaje: 'Habito invalido encontrado'};
    }

    const h = habito as Record<string, unknown>;

    if (typeof h.id !== 'number') {
        return {esValido: false, mensaje: 'Habito sin ID valido'};
    }

    if (typeof h.nombre !== 'string') {
        return {esValido: false, mensaje: 'Habito sin nombre valido'};
    }

    if (!['Alta', 'Media', 'Baja'].includes(h.importancia as string)) {
        return {esValido: false, mensaje: 'Importancia de habito invalida'};
    }

    if (typeof h.diasInactividad !== 'number') {
        return {esValido: false, mensaje: 'Dias de inactividad invalido'};
    }

    if (typeof h.racha !== 'number') {
        return {esValido: false, mensaje: 'Racha invalida'};
    }

    if (!Array.isArray(h.tags)) {
        return {esValido: false, mensaje: 'Tags de habito invalidos'};
    }

    /* Campos opcionales del nuevo formato */
    if (h.historialCompletados !== undefined && !Array.isArray(h.historialCompletados)) {
        return {esValido: false, mensaje: 'Historial de completados invalido'};
    }

    if (h.ultimoCompletado !== undefined && typeof h.ultimoCompletado !== 'string') {
        return {esValido: false, mensaje: 'Ultimo completado invalido'};
    }

    /* Validar frecuencia si existe */
    if (h.frecuencia !== undefined) {
        if (typeof h.frecuencia !== 'object' || h.frecuencia === null) {
            return {esValido: false, mensaje: 'Frecuencia de habito invalida'};
        }
        const frecuencia = h.frecuencia as Record<string, unknown>;
        const tiposValidos = ['diario', 'cadaXDias', 'semanal', 'diasEspecificos', 'mensual'];
        if (!tiposValidos.includes(frecuencia.tipo as string)) {
            return {esValido: false, mensaje: 'Tipo de frecuencia invalido'};
        }
    }

    return {esValido: true, mensaje: 'OK'};
}

function validarTarea(tarea: unknown): ResultadoValidacion {
    if (!tarea || typeof tarea !== 'object') {
        return {esValido: false, mensaje: 'Tarea inválida encontrada'};
    }

    const t = tarea as Record<string, unknown>;

    if (typeof t.id !== 'number') {
        return {esValido: false, mensaje: 'Tarea sin ID válido'};
    }

    if (typeof t.texto !== 'string') {
        return {esValido: false, mensaje: 'Tarea sin texto válido'};
    }

    if (typeof t.completado !== 'boolean') {
        return {esValido: false, mensaje: 'Estado de tarea inválido'};
    }

    /* Proyecto es opcional para compatibilidad con datos antiguos */

    return {esValido: true, mensaje: 'OK'};
}

/*
 * Formatea una fecha para el nombre del archivo
 */
function formatearFecha(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');

    return `${año}-${mes}-${dia}_${hora}-${minuto}`;
}
