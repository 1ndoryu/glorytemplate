/*
 * VentanaFlotante — Ventana arrastreable dentro del DAW.
 * C287: Reemplaza modales fijos por ventanas libres que se pueden mover,
 * minimizar y cerrar. Al minimizar, un icono aparece en BarraVentanasMinimizadas.
 * C311: Prop botonesExtra para renderizar acciones adicionales en el header.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Minus } from 'lucide-react';
import { useVentanasStore } from '../stores/ventanasStore';

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
    const ventana = useVentanasStore(s => s.ventanas.find(v => v.id === id));
    const cerrar = useVentanasStore(s => s.cerrarVentana);
    const minimizar = useVentanasStore(s => s.minimizarVentana);
    const enfocar = useVentanasStore(s => s.enfocarVentana);
    const mover = useVentanasStore(s => s.moverVentana);

    const [arrastrando, setArrastrando] = useState(false);
    const dragRef = useRef({ offsetX: 0, offsetY: 0 });
    const ventanaRef = useRef<HTMLDivElement>(null);

    /* Posición estable para useCallback — evita re-crear si ventana es null */
    const posicionRef = useRef({ x: 0, y: 0 });
    if (ventana) {
        posicionRef.current = ventana.posicion;
    }

    /* Iniciar drag desde la barra de título — ANTES del early return (regla de hooks) */
    const iniciarDrag = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        e.preventDefault();
        e.stopPropagation();

        dragRef.current = {
            offsetX: e.clientX - posicionRef.current.x,
            offsetY: e.clientY - posicionRef.current.y,
        };
        setArrastrando(true);
        enfocar(id);
    }, [id, enfocar]);

    /* Listeners de documento para drag suave */
    useEffect(() => {
        if (!arrastrando) return;

        const moverHandler = (ev: MouseEvent) => {
            const nuevoX = Math.max(0, Math.min(
                window.innerWidth - 100,
                ev.clientX - dragRef.current.offsetX
            ));
            const nuevoY = Math.max(0, Math.min(
                window.innerHeight - 40,
                ev.clientY - dragRef.current.offsetY
            ));
            mover(id, { x: nuevoX, y: nuevoY });
        };

        const soltarHandler = () => setArrastrando(false);

        document.addEventListener('mousemove', moverHandler);
        document.addEventListener('mouseup', soltarHandler);

        return () => {
            document.removeEventListener('mousemove', moverHandler);
            document.removeEventListener('mouseup', soltarHandler);
        };
    }, [arrastrando, id, mover]);

    /* Cerrar con Escape */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') cerrar(id);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [id, cerrar]);

    /* No renderizar si no existe o está minimizada — DESPUÉS de todos los hooks */
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
                    <button
                        className="ventanaFlotanteBoton"
                        onClick={(e) => { e.stopPropagation(); minimizar(id); }}
                        title="Minimizar"
                    >
                        <Minus size={12} />
                    </button>
                    <button
                        className="ventanaFlotanteBoton ventanaFlotanteBotonCerrar"
                        onClick={(e) => { e.stopPropagation(); cerrar(id); }}
                        title="Cerrar"
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Contenido de la ventana */}
            <div className="ventanaFlotanteContenido">
                {children}
            </div>
        </div>
    );
};
