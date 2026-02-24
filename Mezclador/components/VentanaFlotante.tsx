/*
 * VentanaFlotante — Ventana arrastreable dentro del DAW.
 * C287: Reemplaza modales fijos por ventanas libres que se pueden mover,
 * minimizar y cerrar. Al minimizar, un icono aparece en BarraVentanasMinimizadas.
 * C311: Prop botonesExtra para renderizar acciones adicionales en el header.
 */

import { X, Minus } from 'lucide-react';
import { useVentanaFlotante } from '../hooks/useVentanaFlotante';
import { BotonBase } from '@app/components/ui/BotonBase';

interface VentanaFlotanteProps {
    id: string;
    titulo: string;
    ancho?: number;
    /** Nodo React que se renderiza en el header antes de minimizar/cerrar */
    botonesExtra?: React.ReactNode;
    children: React.ReactNode;
}

export const VentanaFlotante = ({
    id,
    titulo,
    ancho = 700,
    botonesExtra,
    children,
}: VentanaFlotanteProps): JSX.Element | null => {
    const {
        ventana,
        ventanaRef,
        arrastrando,
        cerrar,
        minimizar,
        enfocar,
        iniciarDrag,
    } = useVentanaFlotante(id);

    /* No renderizar si no existe o está minimizada */
    if (!ventana || ventana.minimizada) return null;

    return (
        <div
            ref={ventanaRef}
            className={`ventanaFlotante ${arrastrando ? 'ventanaFlotanteArrastrando' : ''}`}
            style={{
                left: ventana.posicion.x,
                top: ventana.posicion.y,
                width: ancho,
                zIndex: ventana.zIndex,
            }}
            onMouseDown={(e) => {
                e.stopPropagation();
                enfocar(id);
            }}
        >
            {/* Barra de título — arrastreable */}
            <div
                className="ventanaFlotanteTitulo"
                onMouseDown={iniciarDrag}
            >
                <span className="ventanaFlotanteTituloTexto">{titulo}</span>
                <div className="ventanaFlotanteBotones">
                    {botonesExtra}
                    <BotonBase variante="ghost"
                        className="ventanaFlotanteBoton"
                        onClick={(e) => { e.stopPropagation(); minimizar(id); }}
                        title="Minimizar"
                    >
                        <Minus size={12} />
                    </BotonBase>
                    <BotonBase variante="ghost"
                        className="ventanaFlotanteBoton ventanaFlotanteBotonCerrar"
                        onClick={(e) => { e.stopPropagation(); cerrar(id); }}
                        title="Cerrar"
                    >
                        <X size={12} />
                    </BotonBase>
                </div>
            </div>

            {/* Contenido de la ventana */}
            <div className="ventanaFlotanteContenido">
                {children}
            </div>
        </div>
    );
};
