/*
 * ShowcaseIsland — Kamples
 * Galería visual interactiva de todos los componentes del design system.
 * Ruta: /dev/componentes
 * Refactorizado: secciones extraídas a componentes independientes (SRP).
 */

import { useState, useCallback } from 'react';
import { ContenedorNotificaciones, crearToast } from '@app/components/ui';
import type { DatosToast } from '@app/components/ui';
import {
    ShowcaseEspaciados,
    ShowcaseBotones,
    ShowcaseFormularios,
    ShowcaseOverlays,
} from './secciones';
import '../../styles/componentes/showcase.css';

export const ShowcaseIsland = (): JSX.Element => {
    const [toasts, setToasts] = useState<DatosToast[]>([]);

    const agregarToast = useCallback((tipo: 'exito' | 'error' | 'advertencia' | 'info') => {
        const mensajes: Record<string, { titulo: string; mensaje: string }> = {
            exito: { titulo: 'Sample subido', mensaje: 'Tu sample se procesó correctamente.' },
            error: { titulo: 'Error de carga', mensaje: 'No se pudo procesar el archivo.' },
            advertencia: { titulo: 'Formato no soportado', mensaje: 'Intenta con WAV o FLAC.' },
            info: { titulo: 'Nuevo seguidor', mensaje: '@productor_42 te sigue.' },
        };
        const { titulo, mensaje } = mensajes[tipo];
        const nuevoToast = crearToast(tipo, titulo, mensaje);
        setToasts((prev) => [...prev, nuevoToast]);
    }, []);

    const cerrarToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <div className="showcaseContenedor" id="seccionShowcase">
            <h1 className="showcaseTitulo">Kamples — Design System</h1>
            <p className="showcaseSubtitulo">
                Galería visual de componentes. Revisa cada elemento antes de integrarlo.
            </p>

            <ShowcaseEspaciados />
            <ShowcaseBotones onToast={agregarToast} />
            <ShowcaseFormularios onToast={agregarToast} />
            <ShowcaseOverlays onToast={agregarToast} />

            <ContenedorNotificaciones toasts={toasts} onCerrar={cerrarToast} />
        </div>
    );
};

export default ShowcaseIsland;
