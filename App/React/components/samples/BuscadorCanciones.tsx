/*
 * Componente: BuscadorCanciones
 * Buscador con debounce que consulta /canciones/buscar.
 * Muestra resultados como lista seleccionable; expone opcion "nueva cancion".
 * TO-DO: Extraer logica (4 useState + debounce + click-fuera) a useBuscadorCanciones.ts para cumplir SRP.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, PlusCircle, X } from 'lucide-react';
import { buscarCanciones } from '../../services/apiCanciones';
import type { Cancion } from '../../types/cancion';
import { InputBusqueda } from '../ui/InputBusqueda';
import { BotonBase } from '../ui/BotonBase';
import { useT } from '@app/utils/i18n/useT';
import '../../styles/componentes/buscadorCanciones.css';

interface BuscadorCancionesProps {
    placeholder?: string;
    onSeleccionar: (cancion: Cancion | null) => void;
    onAgregarNueva?: () => void;
    cancionActual?: Cancion | null;
}

export function BuscadorCanciones({
    placeholder = 'Buscar canción por título o artista...',
    onSeleccionar,
    onAgregarNueva,
    cancionActual = null,
}: BuscadorCancionesProps): JSX.Element {
    const [query, setQuery] = useState('');
    const [resultados, setResultados] = useState<Cancion[]>([]);
    const [cargando, setCargando] = useState(false);
    const [abierto, setAbierto] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const contenedorRef = useRef<HTMLDivElement>(null);
    const { t } = useT();

    /* Cierra la lista al hacer click fuera */
    useEffect(() => {
        const manejarClickFuera = (e: MouseEvent) => {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
                setAbierto(false);
            }
        };
        document.addEventListener('mousedown', manejarClickFuera);
        return () => document.removeEventListener('mousedown', manejarClickFuera);
    }, []);

    /* Busqueda con debounce de 350ms */
    const buscar = useCallback((texto: string) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (texto.length < 2) {
            setResultados([]);
            setAbierto(false);
            return;
        }

        timeoutRef.current = setTimeout(async () => {
            setCargando(true);
            try {
                const resp = await buscarCanciones(texto, 8);
                if (resp.ok && resp.data) {
                    setResultados(resp.data);
                    setAbierto(true);
                }
            } finally {
                setCargando(false);
            }
        }, 350);
    }, []);

    useEffect(() => {
        buscar(query);
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [query, buscar]);

    const elegirCancion = (c: Cancion) => {
        onSeleccionar(c);
        setQuery('');
        setResultados([]);
        setAbierto(false);
    };

    return (
        <div className="buscadorCanciones" ref={contenedorRef}>
            {cancionActual && (
                <div className="buscadorCancionSeleccionada">
                    <div className="buscadorCancionInfo">
                        <span className="buscadorCancionTitulo">{cancionActual.titulo}</span>
                        {cancionActual.artistaNombre && (
                            <span className="buscadorCancionArtista">{cancionActual.artistaNombre}</span>
                        )}
                        {cancionActual.anio && (
                            <span className="buscadorCancionAnio">({cancionActual.anio})</span>
                        )}
                    </div>
                    <BotonBase
                        variante="ghost"
                        tamano="ninguno"
                        className="buscadorCancionQuitar"
                        onClick={() => onSeleccionar(null)}
                        aria-label={t('busqueda.quitarCancion')}
                        type="button"
                    >
                        <X size={14} />
                    </BotonBase>
                </div>
            )}

            <InputBusqueda
                placeholder={placeholder}
                valor={query}
                onChange={setQuery}
                debounceMs={0} /* debounce propio via useEffect */
            />

            {cargando && (
                <div className="buscadorCargando">
                    <Search size={14} />
                    <span>{t('busqueda.buscando')}</span>
                </div>
            )}

            {abierto && !cargando && (
                <ul className="buscadorResultados">
                    {resultados.map((c) => (
                        <li key={c.id} className="buscadorResultadoItem">
                            <BotonBase
                                variante="ghost"
                                tamano="ninguno"
                                type="button"
                                className="buscadorResultadoBoton"
                                onClick={() => elegirCancion(c)}
                            >
                                <span className="buscadorResultadoTitulo">{c.titulo}</span>
                                {c.artistaNombre && (
                                    <span className="buscadorResultadoArtista">{c.artistaNombre}</span>
                                )}
                                {c.anio && (
                                    <span className="buscadorResultadoAnio">({c.anio})</span>
                                )}
                            </BotonBase>
                        </li>
                    ))}

                    {resultados.length === 0 && query.length >= 2 && (
                        <li className="buscadorSinResultados">
                            <span>{t('busqueda.noEncontrado').replace('{q}', query)}</span>
                            {onAgregarNueva && (
                                <BotonBase
                                    variante="ghost"
                                    tamano="ninguno"
                                    type="button"
                                    className="buscadorBotonNueva"
                                    onClick={() => {
                                        setAbierto(false);
                                        onAgregarNueva();
                                    }}
                                >
                                    <PlusCircle size={14} />
                                    Agregar nueva cancion
                                </BotonBase>
                            )}
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
