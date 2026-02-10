/**
 * InputAutocompletado
 *
 * Componente de búsqueda con autocompletado para seleccionar elementos de una lista.
 * Filtra opciones en tiempo real mientras el usuario escribe.
 * Se usa en lugar de un <select> cuando la lista puede ser larga.
 */

import {useState, useRef, useEffect, useCallback} from 'react';
import './InputAutocompletado.css';

interface OpcionAutocompletado {
    id: number | string;
    etiqueta: string;
    detalle?: string;
}

interface InputAutocompletadoProps {
    opciones: OpcionAutocompletado[];
    valorSeleccionado: number | string | null;
    onSeleccionar: (id: number | string | null) => void;
    placeholder?: string;
    etiqueta?: string;
    icono?: React.ReactNode;
    cargando?: boolean;
    className?: string;
}

export function InputAutocompletado({opciones, valorSeleccionado, onSeleccionar, placeholder = 'Buscar...', etiqueta, icono, cargando = false, className = ''}: InputAutocompletadoProps) {
    const [busqueda, setBusqueda] = useState('');
    const [abierto, setAbierto] = useState(false);
    const [indiceFoco, setIndiceFoco] = useState(-1);
    const contenedorRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listaRef = useRef<HTMLUListElement>(null);

    /* Sincronizar el texto de búsqueda con la opción seleccionada */
    useEffect(() => {
        if (valorSeleccionado !== null) {
            const opcion = opciones.find(o => o.id === valorSeleccionado);
            if (opcion) {
                setBusqueda(opcion.etiqueta);
            }
        } else {
            setBusqueda('');
        }
    }, [valorSeleccionado, opciones]);

    /* Cerrar dropdown al hacer click fuera */
    useEffect(() => {
        const handleClickFuera = (e: MouseEvent) => {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
                setAbierto(false);
                /* Restaurar texto de opción seleccionada si se cerró sin elegir */
                if (valorSeleccionado !== null) {
                    const opcion = opciones.find(o => o.id === valorSeleccionado);
                    if (opcion) setBusqueda(opcion.etiqueta);
                }
            }
        };
        document.addEventListener('mousedown', handleClickFuera);
        return () => document.removeEventListener('mousedown', handleClickFuera);
    }, [valorSeleccionado, opciones]);

    /* Filtrar opciones por texto de búsqueda */
    const opcionesFiltradas = busqueda.trim()
        ? opciones.filter(o => {
            const texto = `${o.etiqueta} ${o.detalle || ''}`.toLowerCase();
            return texto.includes(busqueda.toLowerCase());
        })
        : opciones;

    /* Scroll automático al elemento con foco */
    useEffect(() => {
        if (indiceFoco >= 0 && listaRef.current) {
            const items = listaRef.current.querySelectorAll('.capAutocompletado__opcion');
            const item = items[indiceFoco] as HTMLElement;
            if (item) {
                item.scrollIntoView({block: 'nearest'});
            }
        }
    }, [indiceFoco]);

    const handleFocus = () => {
        setAbierto(true);
        setIndiceFoco(-1);
        /* Seleccionar todo el texto al hacer foco para facilitar nueva búsqueda */
        if (inputRef.current) {
            inputRef.current.select();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBusqueda(e.target.value);
        setAbierto(true);
        setIndiceFoco(-1);
        /* Si el usuario borra el texto, deseleccionar */
        if (!e.target.value.trim()) {
            onSeleccionar(null);
        }
    };

    const handleSeleccionar = useCallback((opcion: OpcionAutocompletado) => {
        onSeleccionar(opcion.id);
        setBusqueda(opcion.etiqueta);
        setAbierto(false);
        setIndiceFoco(-1);
    }, [onSeleccionar]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!abierto) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setAbierto(true);
                e.preventDefault();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setIndiceFoco(prev => Math.min(prev + 1, opcionesFiltradas.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setIndiceFoco(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (indiceFoco >= 0 && opcionesFiltradas[indiceFoco]) {
                    handleSeleccionar(opcionesFiltradas[indiceFoco]);
                }
                break;
            case 'Escape':
                setAbierto(false);
                inputRef.current?.blur();
                break;
        }
    };

    const handleLimpiar = () => {
        setBusqueda('');
        onSeleccionar(null);
        inputRef.current?.focus();
    };

    return (
        <div className={`capAutocompletado ${className}`} ref={contenedorRef}>
            {etiqueta && <label className="capAutocompletado__etiqueta">{etiqueta}</label>}

            <div className="capAutocompletado__inputContenedor">
                {icono && <span className="capAutocompletado__icono">{icono}</span>}

                <input
                    ref={inputRef}
                    type="text"
                    className={`capAutocompletado__input ${icono ? 'capAutocompletado__input--conIcono' : ''}`}
                    value={busqueda}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    role="combobox"
                    aria-expanded={abierto}
                    aria-autocomplete="list"
                    aria-controls="lista-autocompletado"
                />

                {valorSeleccionado !== null && (
                    <button type="button" className="capAutocompletado__limpiar" onClick={handleLimpiar} aria-label="Limpiar selección">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" x2="6" y1="6" y2="18" />
                            <line x1="6" x2="18" y1="6" y2="18" />
                        </svg>
                    </button>
                )}
            </div>

            {abierto && (
                <ul className="capAutocompletado__lista" ref={listaRef} id="lista-autocompletado" role="listbox">
                    {cargando ? (
                        <li className="capAutocompletado__mensaje">Cargando...</li>
                    ) : opcionesFiltradas.length === 0 ? (
                        <li className="capAutocompletado__mensaje">No se encontraron resultados</li>
                    ) : (
                        opcionesFiltradas.map((opcion, indice) => (
                            <li
                                key={opcion.id}
                                className={`capAutocompletado__opcion ${indice === indiceFoco ? 'capAutocompletado__opcion--foco' : ''} ${opcion.id === valorSeleccionado ? 'capAutocompletado__opcion--seleccionada' : ''}`}
                                onClick={() => handleSeleccionar(opcion)}
                                role="option"
                                aria-selected={opcion.id === valorSeleccionado}
                            >
                                <span className="capAutocompletado__opcionTexto">{opcion.etiqueta}</span>
                                {opcion.detalle && <span className="capAutocompletado__opcionDetalle">{opcion.detalle}</span>}
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}

export default InputAutocompletado;
