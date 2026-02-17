/*
 * Componente: ModalSeleccionColeccion — Kamples
 * Modal sin cabecera para seleccionar colección y añadir un sample.
 * C106: Sin cabeza, sin contador/icono, solo imagen+nombre, indicador "ya guardado".
 * C107: Buscador arriba con filtrado en tiempo real y creación de colección inline.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Check, Loader, Plus, Search, X } from 'lucide-react';
import { useColeccionPickerStore } from '@app/stores/coleccionPickerStore';
import {
    listarColecciones,
    crearColeccion,
    agregarSampleAColeccion,
    obtenerRelevantesParaSample,
} from '@app/services/apiColecciones';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import { crearLogger } from '@app/services/logger';
import type { Coleccion } from '@app/types';
import '../../styles/componentes/modalSeleccionColeccion.css';

const log = crearLogger('ModalSeleccionColeccion');

export const ModalSeleccionColeccion = (): JSX.Element | null => {
    const { abierto, sample, posicion, cerrar } = useColeccionPickerStore();

    const [colecciones, setColecciones] = useState<Coleccion[]>([]);
    const [cargando, setCargando] = useState(false);
    const [agregando, setAgregando] = useState<number | null>(null);
    /* Set de colecciones donde el sample ya ha sido añadido (esta sesión) */
    const [agregados, setAgregados] = useState<Set<number>>(new Set());
    /* Set de colecciones donde ya estaba guardado (viene del backend) */
    const [yaGuardadoEn, setYaGuardadoEn] = useState<Set<number>>(new Set());

    /* Buscador */
    const [busqueda, setBusqueda] = useState('');

    /* Cargar colecciones al abrir */
    useEffect(() => {
        if (!abierto) {
            setAgregados(new Set());
            setYaGuardadoEn(new Set());
            setBusqueda('');
            return;
        }

        const cargar = async () => {
            setCargando(true);
            try {
                const [respTodas, respRelevantes] = await Promise.all([
                    listarColecciones(),
                    sample ? obtenerRelevantesParaSample(sample.id) : Promise.resolve(null),
                ]);

                if (respTodas.ok && respTodas.data) {
                    let ordenadas = respTodas.data;

                    if (respRelevantes?.ok && respRelevantes.data?.length) {
                        const idsRelevantes = new Set(respRelevantes.data.map((c) => c.id));
                        const relevantes = ordenadas.filter((c) => idsRelevantes.has(c.id));
                        const resto = ordenadas.filter((c) => !idsRelevantes.has(c.id));
                        ordenadas = [...relevantes, ...resto];
                    }

                    setColecciones(ordenadas);

                    /* C190: Detectar colecciones donde el sample ya está guardado */
                    if (sample && respRelevantes?.ok && respRelevantes.data) {
                        const guardados = new Set<number>();
                        for (const col of respRelevantes.data) {
                            if (col.contieneElSample) guardados.add(col.id);
                        }
                        setYaGuardadoEn(guardados);
                    }
                }
            } catch (err) {
                log.error('Error cargando colecciones', err);
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, [abierto, sample]);

    /* Filtrar colecciones por búsqueda */
    const coleccionesFiltradas = useMemo(() => {
        if (!busqueda.trim()) return colecciones;
        const termino = busqueda.toLowerCase().trim();
        return colecciones.filter((c) => c.nombre.toLowerCase().includes(termino));
    }, [colecciones, busqueda]);

    /* Verificar si existe una colección con el nombre buscado (para crear) */
    const existeConNombre = useMemo(() => {
        if (!busqueda.trim()) return false;
        return colecciones.some((c) => c.nombre.toLowerCase() === busqueda.trim().toLowerCase());
    }, [colecciones, busqueda]);

    /* Añadir sample a una colección */
    const manejarAgregar = useCallback(
        async (coleccionId: number) => {
            if (!sample || agregando !== null) return;
            setAgregando(coleccionId);
            try {
                const resp = await agregarSampleAColeccion(coleccionId, sample.id);
                if (resp.ok) {
                    setAgregados((prev) => new Set(prev).add(coleccionId));
                    log.info('Sample anadido a coleccion', { coleccionId, sampleId: sample.id });
                }
            } catch (err) {
                log.error('Error anadiendo a coleccion', err);
            } finally {
                setAgregando(null);
            }
        },
        [sample, agregando]
    );

    /* Crear colección nueva con el nombre de la búsqueda */
    const manejarCrear = useCallback(async () => {
        if (!busqueda.trim() || !sample || existeConNombre) return;

        setAgregando(-1);
        try {
            const resp = await crearColeccion({
                nombre: busqueda.trim(),
                descripcion: '',
                esPublica: false,
            });
            if (resp.ok && resp.data) {
                await agregarSampleAColeccion(resp.data.id, sample.id);
                setColecciones((prev) => [resp.data!, ...prev]);
                setAgregados((prev) => new Set(prev).add(resp.data!.id));
                setBusqueda('');
                log.info('Coleccion creada y sample anadido', { id: resp.data.id });
            }
        } catch (err) {
            log.error('Error creando coleccion', err);
        } finally {
            setAgregando(null);
        }
    }, [busqueda, sample, existeConNombre]);

    if (!abierto || !sample) return null;

    /*
     * C182: Si hay posición, calcular top/left ajustados al viewport.
     * El panel ocupa ~280px ancho y ~350px alto max.
     */
    const estiloPanel: React.CSSProperties | undefined = posicion
        ? {
            position: 'fixed',
            /* C261: Clamp bidireccional — panel 320x420 + 8px margen */
            top: Math.max(8, Math.min(posicion.y, window.innerHeight - 428)),
            left: Math.max(8, Math.min(posicion.x, window.innerWidth - 328)),
        }
        : undefined;

    return (
        <div
            className={`seleccionColeccionOverlay ${posicion ? 'seleccionColeccionOverlayContextual' : ''}`}
            onClick={cerrar}
        >
            <div
                className="seleccionColeccionPanel"
                style={estiloPanel}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Buscador arriba (C107) */}
                <div className="seleccionColeccionBuscador">
                    <Search size={14} className="seleccionColeccionBuscadorIcono" />
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar o crear colección..."
                        className="seleccionColeccionInput"
                        maxLength={100}
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && busqueda.trim() && !existeConNombre) {
                                manejarCrear();
                            }
                            if (e.key === 'Escape') cerrar();
                        }}
                    />
                    {busqueda && (
                        <button
                            className="seleccionColeccionLimpiar"
                            onClick={() => setBusqueda('')}
                            type="button"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* Lista de colecciones */}
                {cargando ? (
                    <div className="seleccionColeccionCargando">
                        <Loader size={18} className="seleccionColeccionSpinner" />
                    </div>
                ) : (
                    <div className="seleccionColeccionLista">
                        {coleccionesFiltradas.map((col) => {
                            const yaGuardado = yaGuardadoEn.has(col.id) || agregados.has(col.id);
                            const agregandoEste = agregando === col.id;

                            return (
                                <button
                                    key={col.id}
                                    className={`seleccionColeccionItem ${yaGuardado ? 'seleccionColeccionItemGuardado' : ''}`}
                                    onClick={() => !yaGuardado && manejarAgregar(col.id)}
                                    disabled={yaGuardado || agregandoEste}
                                    type="button"
                                >
                                    <img
                                        className="seleccionColeccionItemImg"
                                        src={col.imagenUrl || obtenerImagenColor(col.id)}
                                        alt=""
                                    />
                                    <span className="seleccionColeccionItemNombre">{col.nombre}</span>
                                    {yaGuardado && (
                                        <span className="seleccionColeccionYaGuardado">
                                            <Check size={12} />
                                        </span>
                                    )}
                                    {agregandoEste && <Loader size={14} className="seleccionColeccionSpinner" />}
                                </button>
                            );
                        })}

                        {coleccionesFiltradas.length === 0 && !cargando && (
                            <div className="seleccionColeccionVacio">
                                {busqueda.trim() ? 'Sin resultados' : 'No tienes colecciones'}
                            </div>
                        )}
                    </div>
                )}

                {/* Botón crear colección (visible solo si hay texto y no existe) */}
                {busqueda.trim() && !existeConNombre && (
                    <button
                        className="seleccionColeccionCrearBtn"
                        onClick={manejarCrear}
                        disabled={agregando === -1}
                        type="button"
                    >
                        <Plus size={14} />
                        <span>Crear "{busqueda.trim()}"</span>
                        {agregando === -1 && <Loader size={12} className="seleccionColeccionSpinner" />}
                    </button>
                )}

                {/* Alerta si ya existe */}
                {busqueda.trim() && existeConNombre && (
                    <div className="seleccionColeccionAlerta">
                        Ya tienes una colección con ese nombre
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModalSeleccionColeccion;
