/*
 * IndicadorAlmacenamiento.tsx
 * Muestra el uso de almacenamiento del usuario con barra de progreso
 */

import {HardDrive, AlertTriangle} from 'lucide-react';
import {useAlmacenamiento} from '../../hooks/useAlmacenamiento';

interface IndicadorAlmacenamientoProps {
    mostrarDetalles?: boolean;
}

export function IndicadorAlmacenamiento({mostrarDetalles = true}: IndicadorAlmacenamientoProps): JSX.Element {
    const {info, cargando, porcentaje, cercaDelLimite, limiteExcedido, colorBarra} = useAlmacenamiento();

    if (cargando) {
        return (
            <div className="indicadorAlmacenamiento indicadorAlmacenamiento--cargando">
                <div className="indicadorAlmacenamientoIcono">
                    <HardDrive size={16} />
                </div>
                <div className="indicadorAlmacenamientoContenido">
                    <span className="indicadorAlmacenamientoTexto">Cargando almacenamiento...</span>
                </div>
            </div>
        );
    }

    if (!info) {
        return <></>;
    }

    return (
        <div className={`indicadorAlmacenamiento ${cercaDelLimite ? 'indicadorAlmacenamiento--advertencia' : ''} ${limiteExcedido ? 'indicadorAlmacenamiento--excedido' : ''}`}>
            <div className="indicadorAlmacenamientoEncabezado">
                <div className="indicadorAlmacenamientoIcono">{limiteExcedido || cercaDelLimite ? <AlertTriangle size={16} /> : <HardDrive size={16} />}</div>
                <span className="indicadorAlmacenamientoTitulo">Almacenamiento</span>
                <span className="indicadorAlmacenamientoPorcentaje">{porcentaje}%</span>
            </div>

            <div className="barraAlmacenamientoContenedor">
                <div
                    className="barraAlmacenamientoProgreso"
                    style={{
                        width: `${Math.min(porcentaje, 100)}%`,
                        backgroundColor: colorBarra
                    }}
                />
            </div>

            {mostrarDetalles && (
                <div className="indicadorAlmacenamientoDetalles">
                    <span className="indicadorAlmacenamientoUsado">
                        {info.usadoFormateado} de {info.limiteFormateado}
                    </span>
                    <span className="indicadorAlmacenamientoDisponible">{info.disponibleFormateado} disponible</span>
                </div>
            )}

            {limiteExcedido && <div className="indicadorAlmacenamientoAlerta">Has alcanzado tu límite. Elimina archivos o actualiza a Premium.</div>}

            {cercaDelLimite && !limiteExcedido && <div className="indicadorAlmacenamientoAlerta indicadorAlmacenamientoAlerta--advertencia">Estás cerca de tu límite de almacenamiento.</div>}

            {!info.esPremium && !limiteExcedido && (
                <div className="indicadorAlmacenamientoUpgrade">
                    <span>Actualiza a Premium para 10 GB de almacenamiento</span>
                </div>
            )}
        </div>
    );
}
