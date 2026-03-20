/*
 * Componente: CondicionesSample — Kamples (C124-split)
 * Barra de condiciones de publicación de un sample (descarga, premium, precio, comunidad).
 * Extraído de ContenidoCrear para respetar el límite de 300 líneas.
 */

import { Download, Users } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Tooltip } from '@app/components/ui/Tooltip';

interface CondicionesSampleProps {
    permitirDescarga: boolean;
    setPermitirDescarga: (v: boolean) => void;
    /* [2003A-2] Pendiente: restaurar esPremium, togglePremium, tienePrecio, setTienePrecio, precio cuando se reactive pricing */
    mostrarEnComunidad: boolean;
    setMostrarEnComunidad: (v: boolean) => void;
    esContextoAdjuntar: boolean;
}

export const CondicionesSample = ({
    permitirDescarga, setPermitirDescarga,
    mostrarEnComunidad, setMostrarEnComunidad,
    esContextoAdjuntar,
}: CondicionesSampleProps): JSX.Element => {
    if (esContextoAdjuntar) {
        return (
            <div className="crearCondiciones">
                <Tooltip texto={mostrarEnComunidad ? 'Visible en comunidad' : 'No visible en comunidad'} posicion="bottom">
                    <BotonBase variante="ghost"
                        className={`crearCondicionBtn ${mostrarEnComunidad ? 'crearCondicionActiva' : ''}`}
                        onClick={() => setMostrarEnComunidad(!mostrarEnComunidad)}
                        type="button"
                        soloIcono
                        aria-label={mostrarEnComunidad ? 'Visible en comunidad' : 'No visible en comunidad'}
                    >
                        <Users size={14} />
                    </BotonBase>
                </Tooltip>
            </div>
        );
    }

    return (
        <div className="crearCondiciones">
            <Tooltip texto={permitirDescarga ? 'Descarga permitida' : 'Descarga no permitida'} posicion="bottom">
                <BotonBase variante="ghost"
                    className={`crearCondicionBtn ${permitirDescarga ? 'crearCondicionActiva' : ''}`}
                    onClick={() => setPermitirDescarga(!permitirDescarga)}
                    type="button"
                    soloIcono
                    aria-label={permitirDescarga ? 'Descarga permitida' : 'Descarga no permitida'}
                >
                    <Download size={14} />
                </BotonBase>
            </Tooltip>
            {/* [2003A-2] Pendiente: botón PRO (Crown) desactivado. Restaurar cuando se reactive el sistema de precios */}
            {/* [2003A-2] Pendiente: botón Precio (DollarSign) desactivado. Restaurar cuando se reactive el sistema de precios */}
            <Tooltip texto={mostrarEnComunidad ? 'Visible en comunidad' : 'No visible en comunidad'} posicion="bottom">
                <BotonBase variante="ghost"
                    className={`crearCondicionBtn ${mostrarEnComunidad ? 'crearCondicionActiva' : ''}`}
                    onClick={() => setMostrarEnComunidad(!mostrarEnComunidad)}
                    type="button"
                    soloIcono
                    aria-label={mostrarEnComunidad ? 'Visible en comunidad' : 'No visible en comunidad'}
                >
                    <Users size={14} />
                </BotonBase>
            </Tooltip>
        </div>
    );
};
