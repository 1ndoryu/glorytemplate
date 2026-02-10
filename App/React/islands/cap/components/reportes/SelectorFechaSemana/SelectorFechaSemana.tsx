/**
 * SelectorFechaSemana
 *
 * Componente de selección visual de semana con mini-calendario.
 * Clickar en el rango de fechas abre un calendario mensual.
 * Al seleccionar cualquier día, se elige automáticamente su semana (lunes-viernes).
 */

import {useState, useRef, useEffect, useMemo} from 'react';
import {ChevronLeft, ChevronRight, Calendar} from 'lucide-react';
import './SelectorFechaSemana.css';

interface SelectorFechaSemanaProps {
    semanaSeleccionada: Date;
    onCambiarSemana: (nuevaSemana: Date) => void;
    formatearSemana: (fecha: Date) => string;
}

/* Obtener el lunes de la semana de una fecha dada */
function obtenerLunes(fecha: Date): Date {
    const d = new Date(fecha);
    const dia = d.getDay();
    /* 0=dom => retroceder 6; 1=lun => 0; 2=mar => 1... */
    const diff = dia === 0 ? -6 : 1 - dia;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

const NOMBRES_MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA_CORTOS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function SelectorFechaSemana({semanaSeleccionada, onCambiarSemana, formatearSemana}: SelectorFechaSemanaProps) {
    const [abierto, setAbierto] = useState(false);
    const [mesVista, setMesVista] = useState(() => new Date(semanaSeleccionada.getFullYear(), semanaSeleccionada.getMonth(), 1));
    const contenedorRef = useRef<HTMLDivElement>(null);

    /* Cerrar al hacer click fuera */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
                setAbierto(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* Sincronizar mesVista con la semana seleccionada al abrir */
    useEffect(() => {
        if (abierto) {
            setMesVista(new Date(semanaSeleccionada.getFullYear(), semanaSeleccionada.getMonth(), 1));
        }
    }, [abierto, semanaSeleccionada]);

    /* Generar días del mes para la vista del calendario */
    const diasCalendario = useMemo(() => {
        const year = mesVista.getFullYear();
        const month = mesVista.getMonth();

        /* Primer día del mes y cómo cae en la semana (ajustado a lunes=0) */
        const primerDia = new Date(year, month, 1);
        let diaInicio = primerDia.getDay() - 1;
        if (diaInicio < 0) diaInicio = 6;

        /* Último día del mes */
        const ultimoDia = new Date(year, month + 1, 0).getDate();

        const dias: Array<{fecha: Date; esMesActual: boolean}> = [];

        /* Días del mes anterior para rellenar la primera semana */
        for (let i = diaInicio - 1; i >= 0; i--) {
            const fecha = new Date(year, month, -i);
            dias.push({fecha, esMesActual: false});
        }

        /* Días del mes actual */
        for (let d = 1; d <= ultimoDia; d++) {
            dias.push({fecha: new Date(year, month, d), esMesActual: true});
        }

        /* Completar última semana con días del mes siguiente */
        const restante = 7 - (dias.length % 7);
        if (restante < 7) {
            for (let i = 1; i <= restante; i++) {
                dias.push({fecha: new Date(year, month + 1, i), esMesActual: false});
            }
        }

        return dias;
    }, [mesVista]);

    const lunesSeleccionado = obtenerLunes(semanaSeleccionada);

    /* Comprobar si un día está en la semana seleccionada */
    const estaEnSemanaSeleccionada = (fecha: Date): boolean => {
        const lunes = new Date(lunesSeleccionado);
        const viernes = new Date(lunesSeleccionado);
        viernes.setDate(viernes.getDate() + 4);
        const f = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
        return f >= lunes && f <= viernes;
    };

    const esHoy = (fecha: Date): boolean => {
        const hoy = new Date();
        return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth() && fecha.getDate() === hoy.getDate();
    };

    const handleSeleccionarDia = (fecha: Date) => {
        const lunes = obtenerLunes(fecha);
        onCambiarSemana(lunes);
        setAbierto(false);
    };

    const handleMesAnterior = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMesVista(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleMesSiguiente = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMesVista(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    /* Navegación por flechas (semana anterior/siguiente) */
    const handleSemanaAnterior = () => {
        const nueva = new Date(semanaSeleccionada);
        nueva.setDate(nueva.getDate() - 7);
        onCambiarSemana(nueva);
    };

    const handleSemanaSiguiente = () => {
        const nueva = new Date(semanaSeleccionada);
        nueva.setDate(nueva.getDate() + 7);
        onCambiarSemana(nueva);
    };

    return (
        <div className="capSelectorFechaSemana" ref={contenedorRef}>
            <div className="capSelectorSemana">
                <button type="button" className="capSelectorSemana__btn" onClick={handleSemanaAnterior} aria-label="Semana anterior">
                    <ChevronLeft size={18} />
                </button>

                <button type="button" className="capSelectorFechaSemana__textoBtn" onClick={() => setAbierto(!abierto)} aria-label="Abrir calendario">
                    <Calendar size={14} className="capSelectorFechaSemana__iconoCal" />
                    <span>{formatearSemana(semanaSeleccionada)}</span>
                </button>

                <button type="button" className="capSelectorSemana__btn" onClick={handleSemanaSiguiente} aria-label="Semana siguiente">
                    <ChevronRight size={18} />
                </button>
            </div>

            {abierto && (
                <div className="capCalendarioMini">
                    {/* Cabecera del calendario con navegación de meses */}
                    <div className="capCalendarioMini__cabecera">
                        <button type="button" className="capCalendarioMini__navBtn" onClick={handleMesAnterior}>
                            <ChevronLeft size={16} />
                        </button>
                        <span className="capCalendarioMini__mesAnio">
                            {NOMBRES_MESES[mesVista.getMonth()]} {mesVista.getFullYear()}
                        </span>
                        <button type="button" className="capCalendarioMini__navBtn" onClick={handleMesSiguiente}>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Días de la semana */}
                    <div className="capCalendarioMini__diasSemana">
                        {DIAS_SEMANA_CORTOS.map(dia => (
                            <span key={dia} className="capCalendarioMini__diaSemana">{dia}</span>
                        ))}
                    </div>

                    {/* Grid de días */}
                    <div className="capCalendarioMini__grid">
                        {diasCalendario.map(({fecha, esMesActual}, i) => {
                            const enSemana = estaEnSemanaSeleccionada(fecha);
                            const hoy = esHoy(fecha);
                            const clases = [
                                'capCalendarioMini__dia',
                                !esMesActual && 'capCalendarioMini__dia--otroMes',
                                enSemana && 'capCalendarioMini__dia--enSemana',
                                hoy && 'capCalendarioMini__dia--hoy'
                            ].filter(Boolean).join(' ');

                            return (
                                <button type="button" key={i} className={clases} onClick={() => handleSeleccionarDia(fecha)}>
                                    {fecha.getDate()}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SelectorFechaSemana;
