/**
 * IndicadorSincronizacion
 *
 * Componente visual que muestra el estado de sincronización con el servidor.
 * Solo visible cuando el usuario está logueado.
 *
 * Estados:
 * - Sincronizado: Checkmark verde
 * - Pendiente: Spinner de carga
 * - Error: Icono de error con tooltip
 * - Offline: Icono de nube tachada
 */

import React from 'react';

interface IndicadorSincronizacionProps {
    sincronizado: boolean;
    pendiente: boolean;
    error: string | null;
    estaLogueado: boolean;
    onSincronizar?: () => void;
}

export function IndicadorSincronizacion({sincronizado, pendiente, error, estaLogueado, onSincronizar}: IndicadorSincronizacionProps): JSX.Element | null {
    /* No mostrar si el usuario no está logueado */
    if (!estaLogueado) {
        return (
            <div id="indicador-sync-offline" className="indicadorSync indicadorSync--offline" title="Modo local - Inicia sesión para sincronizar">
                <span className="indicadorSync__icono">☁</span>
                <span className="indicadorSync__texto">Local</span>
            </div>
        );
    }

    /* Estado de error */
    if (error) {
        return (
            <button id="indicador-sync-error" className="indicadorSync indicadorSync--error" onClick={onSincronizar} title={`Error: ${error}. Click para reintentar.`}>
                <span className="indicadorSync__icono">⚠</span>
                <span className="indicadorSync__texto">Error</span>
            </button>
        );
    }

    /* Estado pendiente/sincronizando */
    if (pendiente || !sincronizado) {
        return (
            <div id="indicador-sync-pendiente" className="indicadorSync indicadorSync--pendiente" title="Sincronizando...">
                <span className="indicadorSync__spinner"></span>
                <span className="indicadorSync__texto">Guardando</span>
            </div>
        );
    }

    /* Estado sincronizado */
    return (
        <div id="indicador-sync-ok" className="indicadorSync indicadorSync--ok" title="Datos sincronizados con el servidor">
            <span className="indicadorSync__icono">✓</span>
            <span className="indicadorSync__texto">Sincronizado</span>
        </div>
    );
}
