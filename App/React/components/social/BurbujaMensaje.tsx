/*
 * Componente: BurbujaMensaje — Kamples (Fase 5.2)
 * Renderiza una burbuja de chat con soporte multimedia.
 * Tipos: texto, imagen, audio, sample.
 */

import { useBurbujaMensaje } from '@app/hooks/useBurbujaMensaje';
import type { Mensaje } from '@app/types';
import '../../styles/componentes/burbujaMensaje.css';

interface BurbujaMensajeProps {
    mensaje: Mensaje;
    esMio: boolean;
    compacto?: boolean;
}

export const BurbujaMensaje = ({ mensaje, esMio, compacto = false }: BurbujaMensajeProps): JSX.Element => {
    const { tipo, renderContenido, claseBase, claseMia, claseOtra } = useBurbujaMensaje({
        mensaje, esMio, compacto,
    });

    return (
        <div className={`${claseBase} ${esMio ? claseMia : claseOtra} ${tipo !== 'texto' ? 'burbujaTipoMedia' : ''}`}>
            {compacto ? (
                renderContenido()
            ) : (
                <div className="chatBurbujaContenido">
                    {renderContenido()}
                </div>
            )}
        </div>
    );
};

export default BurbujaMensaje;
