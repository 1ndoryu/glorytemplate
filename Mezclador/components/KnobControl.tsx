/*
 * KnobControl — Control rotatorio estilo DAW profesional.
 * C294: Renderiza un knob SVG circular con arco de valor (270°).
 * Interacción: drag vertical (arriba=más, abajo=menos).
 * C295: Doble click restablece al valor por defecto.
 */

import { useCallback, useRef, useState } from 'react';

interface KnobControlProps {
    valor: number;
    min: number;
    max: number;
    paso?: number;
    etiqueta: string;
    valorPorDefecto: number;
    formatoValor?: (v: number) => string;
    onChange: (v: number) => void;
    tamano?: number;
    colorArco?: string;
    bipolar?: boolean;
}

/* Ángulos en grados: arco de 270° (de -135° a +135°) */
const ANGULO_INICIO = -135;
const ANGULO_FIN = 135;
const RANGO_ANGULO = ANGULO_FIN - ANGULO_INICIO;

/* Sensibilidad: píxeles de drag vertical para recorrer todo el rango */
const SENSIBILIDAD_NORMAL = 150;
const SENSIBILIDAD_FINA = 600;

/* Convierte un porcentaje (0-1) a coordenadas en el arco SVG */
const porcentajeACoord = (porcentaje: number, radio: number, cx: number, cy: number) => {
    const angulo = ANGULO_INICIO + porcentaje * RANGO_ANGULO;
    const rad = (angulo * Math.PI) / 180;
    return {
        x: cx + radio * Math.cos(rad),
        y: cy + radio * Math.sin(rad),
    };
};

/* Genera el path SVG de un arco */
const generarArco = (
    porcentajeInicio: number,
    porcentajeFin: number,
    radio: number,
    cx: number,
    cy: number,
): string => {
    const inicio = porcentajeACoord(porcentajeInicio, radio, cx, cy);
    const fin = porcentajeACoord(porcentajeFin, radio, cx, cy);
    const anguloBarrido = (porcentajeFin - porcentajeInicio) * RANGO_ANGULO;
    const arcoGrande = Math.abs(anguloBarrido) > 180 ? 1 : 0;
    const sentido = anguloBarrido >= 0 ? 1 : 0;
    return `M ${inicio.x} ${inicio.y} A ${radio} ${radio} 0 ${arcoGrande} ${sentido} ${fin.x} ${fin.y}`;
};

export const KnobControl = ({
    valor,
    min,
    max,
    paso = 0.01,
    etiqueta,
    valorPorDefecto,
    formatoValor,
    onChange,
    tamano = 44,
    colorArco,
    bipolar = false,
}: KnobControlProps): JSX.Element => {
    const [arrastrando, setArrastrando] = useState(false);
    const dragRef = useRef({ yInicial: 0, valorInicial: 0 });

    const rango = max - min;
    const porcentaje = rango > 0 ? (valor - min) / rango : 0;

    /* Centro y radio del SVG */
    const cx = tamano / 2;
    const cy = tamano / 2;
    const radioExterno = tamano / 2 - 3;
    const radioArco = radioExterno - 4;

    /* Posición del indicador (puntero del knob) */
    const anguloIndicador = ANGULO_INICIO + porcentaje * RANGO_ANGULO;
    const radInd = (anguloIndicador * Math.PI) / 180;
    const punteroInicio = {
        x: cx + (radioArco - 8) * Math.cos(radInd),
        y: cy + (radioArco - 8) * Math.sin(radInd),
    };
    const punteroFin = {
        x: cx + (radioArco - 2) * Math.cos(radInd),
        y: cy + (radioArco - 2) * Math.sin(radInd),
    };

    /* Arco de fondo (track completo) */
    const arcoFondo = generarArco(0, 1, radioArco, cx, cy);

    /* Arco de valor */
    let arcoValor: string;
    if (bipolar) {
        /* Para controles bipolares (ej. Pan, Pitch), el arco parte desde el centro */
        const centro = 0.5;
        if (porcentaje >= centro) {
            arcoValor = generarArco(centro, porcentaje, radioArco, cx, cy);
        } else {
            arcoValor = generarArco(porcentaje, centro, radioArco, cx, cy);
        }
    } else {
        arcoValor = generarArco(0, porcentaje, radioArco, cx, cy);
    }

    /* Texto del valor formateado */
    const textoValor = formatoValor ? formatoValor(valor) : valor.toFixed(paso < 1 ? 2 : 0);

    /* Color del arco activo */
    const color = colorArco ?? 'var(--acento, #6c63ff)';

    /* Iniciar drag */
    const iniciarDrag = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        dragRef.current = {
            yInicial: e.clientY,
            valorInicial: valor,
        };
        setArrastrando(true);

        const sensibilidad = e.shiftKey ? SENSIBILIDAD_FINA : SENSIBILIDAD_NORMAL;

        const moverHandler = (ev: MouseEvent) => {
            const deltaY = dragRef.current.yInicial - ev.clientY;
            const sens = ev.shiftKey ? SENSIBILIDAD_FINA : sensibilidad;
            const deltaValor = (deltaY / sens) * rango;
            let nuevo = dragRef.current.valorInicial + deltaValor;

            /* Snap al paso */
            nuevo = Math.round(nuevo / paso) * paso;
            nuevo = Math.max(min, Math.min(max, nuevo));

            onChange(nuevo);
        };

        const soltarHandler = () => {
            setArrastrando(false);
            document.removeEventListener('mousemove', moverHandler);
            document.removeEventListener('mouseup', soltarHandler);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', moverHandler);
        document.addEventListener('mouseup', soltarHandler);
    }, [valor, min, max, paso, rango, onChange]);

    /* C295: Doble click restablece al valor por defecto */
    const alDobleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(valorPorDefecto);
    }, [valorPorDefecto, onChange]);

    /* C295: Scroll de rueda para ajuste fino */
    const alRueda = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const direccion = e.deltaY < 0 ? 1 : -1;
        const incremento = e.shiftKey ? paso : paso * 5;
        let nuevo = valor + direccion * incremento;
        nuevo = Math.round(nuevo / paso) * paso;
        nuevo = Math.max(min, Math.min(max, nuevo));
        onChange(nuevo);
    }, [valor, min, max, paso, onChange]);

    return (
        <div
            className={`knobControl ${arrastrando ? 'knobControlArrastrando' : ''}`}
            title={`${etiqueta}: ${textoValor} (doble-click para restablecer)`}
        >
            <svg
                width={tamano}
                height={tamano}
                viewBox={`0 0 ${tamano} ${tamano}`}
                className="knobControlSvg"
                onMouseDown={iniciarDrag}
                onDoubleClick={alDobleClick}
                onWheel={alRueda}
            >
                {/* Cuerpo del knob (círculo oscuro) */}
                <circle
                    cx={cx}
                    cy={cy}
                    r={radioArco - 6}
                    fill="var(--fondoElevado2, #2a2a3a)"
                    stroke="var(--bordeDefault, #444)"
                    strokeWidth={1}
                />

                {/* Arco de fondo (track) */}
                <path
                    d={arcoFondo}
                    fill="none"
                    stroke="var(--fondoHover, #333)"
                    strokeWidth={3}
                    strokeLinecap="round"
                />

                {/* Arco de valor activo */}
                {porcentaje > 0.003 && (
                    <path
                        d={arcoValor}
                        fill="none"
                        stroke={color}
                        strokeWidth={3}
                        strokeLinecap="round"
                    />
                )}

                {/* Indicador / puntero */}
                <line
                    x1={punteroInicio.x}
                    y1={punteroInicio.y}
                    x2={punteroFin.x}
                    y2={punteroFin.y}
                    stroke="var(--textoDefault, #eee)"
                    strokeWidth={2}
                    strokeLinecap="round"
                />
            </svg>

            {/* Valor numérico debajo */}
            <span className="knobControlValor">{textoValor}</span>
            <span className="knobControlEtiqueta">{etiqueta}</span>
        </div>
    );
};
