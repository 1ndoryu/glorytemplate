/*
 * Componente: CondicionesSample — Kamples (C124-split)
 * Barra de condiciones de publicación de un sample (descarga, premium, precio, comunidad).
 * Extraído de ContenidoCrear para respetar el límite de 300 líneas.
 */

import { Download, Crown, Users, DollarSign } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Tooltip } from '@app/components/ui/Tooltip';

interface CondicionesSampleProps {
    permitirDescarga: boolean;
    setPermitirDescarga: (v: boolean) => void;
    esPremium: boolean;
    togglePremium: () => void;
    tienePrecio: boolean;
    setTienePrecio: (v: boolean) => void;
    mostrarEnComunidad: boolean;
    setMostrarEnComunidad: (v: boolean) => void;
    precio: string;
    esContextoAdjuntar: boolean;
}

export const CondicionesSample = ({
    permitirDescarga, setPermitirDescarga,
    esPremium, togglePremium,
    tienePrecio, setTienePrecio,
    mostrarEnComunidad, setMostrarEnComunidad,
    precio, esContextoAdjuntar,
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
                    onClick={() => { if (!esPremium) setPermitirDescarga(!permitirDescarga); }}
                    type="button"
                    soloIcono
                    aria-label={permitirDescarga ? 'Descarga permitida' : 'Descarga no permitida'}
                    disabled={esPremium}
                >
                    <Download size={14} />
                </BotonBase>
            </Tooltip>
            <Tooltip texto={esPremium ? 'Solo Pro — genera ingresos al creador' : 'Sample gratuito'} posicion="bottom">
                <BotonBase variante="ghost"
                    className={`crearCondicionBtn ${esPremium ? 'crearCondicionPremium' : ''}`}
                    onClick={togglePremium}
                    type="button"
                    soloIcono
                    aria-label={esPremium ? 'Solo Pro — genera ingresos' : 'Sample gratuito'}
                >
                    <Crown size={14} />
                </BotonBase>
            </Tooltip>
            <Tooltip texto={tienePrecio ? `Con precio $${precio || '0'} — cualquier usuario puede comprar` : 'Sin precio'} posicion="bottom">
                <BotonBase variante="ghost"
                    className={`crearCondicionBtn ${tienePrecio ? 'crearCondicionPrecio' : ''}`}
                    onClick={() => setTienePrecio(!tienePrecio)}
                    type="button"
                    soloIcono
                    aria-label={tienePrecio ? 'Con precio' : 'Sin precio'}
                >
                    <DollarSign size={14} />
                </BotonBase>
            </Tooltip>
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
