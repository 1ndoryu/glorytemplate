/*
 * Componente: ModalSeleccionColeccion — Kamples (Fase 5.4)
 * Modal que muestra las colecciones del usuario para añadir un sample.
 * Incluye opción de crear colección nueva inline.
 */

import { useState, useEffect, useCallback } from 'react';
import { FolderPlus, Check, Plus, Loader } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useColeccionPickerStore } from '@app/stores/coleccionPickerStore';
import {
    listarColecciones,
    crearColeccion,
    agregarSampleAColeccion,
} from '@app/services/apiColecciones';
import { crearLogger } from '@app/services/logger';
import type { Coleccion } from '@app/types';
import '../../styles/componentes/modalSeleccionColeccion.css';

const log = crearLogger('ModalSeleccionColeccion');

export const ModalSeleccionColeccion = (): JSX.Element | null => {
    const { abierto, sample, cerrar } = useColeccionPickerStore();

    const [colecciones, setColecciones] = useState<Coleccion[]>([]);
    const [cargando, setCargando] = useState(false);
    const [agregando, setAgregando] = useState<number | null>(null);
    const [agregados, setAgregados] = useState<Set<number>>(new Set());

    /* Modo crear inline */
    const [creando, setCreando] = useState(false);
    const [nuevoNombre, setNuevoNombre] = useState('');

    /* Cargar colecciones al abrir */
    useEffect(() => {
        if (!abierto) {
            setAgregados(new Set());
            setCreando(false);
            setNuevoNombre('');
            return;
        }

        const cargar = async () => {
            setCargando(true);
            try {
                const resp = await listarColecciones();
                if (resp.ok && resp.data) {
                    setColecciones(resp.data);
                }
            } catch (err) {
                log.error('Error cargando colecciones', err);
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, [abierto]);

    /* Añadir sample a una colección */
    const manejarAgregar = useCallback(
        async (coleccionId: number) => {
            if (!sample || agregando !== null) return;
            setAgregando(coleccionId);
            try {
                const resp = await agregarSampleAColeccion(coleccionId, sample.id);
                if (resp.ok) {
                    setAgregados((prev) => new Set(prev).add(coleccionId));
                    log.info('Sample añadido a colección', { coleccionId, sampleId: sample.id });
                }
            } catch (err) {
                log.error('Error añadiendo a colección', err);
            } finally {
                setAgregando(null);
            }
        },
        [sample, agregando]
    );

    /* Crear colección nueva y añadir sample */
    const manejarCrear = useCallback(async () => {
        if (!nuevoNombre.trim() || !sample) return;

        setAgregando(-1);
        try {
            const resp = await crearColeccion({
                nombre: nuevoNombre.trim(),
                descripcion: '',
                esPublica: false,
            });
            if (resp.ok && resp.data) {
                /* Añadir sample a la nueva colección */
                await agregarSampleAColeccion(resp.data.id, sample.id);
                setColecciones((prev) => [resp.data!, ...prev]);
                setAgregados((prev) => new Set(prev).add(resp.data!.id));
                setCreando(false);
                setNuevoNombre('');
                log.info('Colección creada y sample añadido', { id: resp.data.id });
            }
        } catch (err) {
            log.error('Error creando colección', err);
        } finally {
            setAgregando(null);
        }
    }, [nuevoNombre, sample]);

    if (!abierto || !sample) return null;

    return (
        <Modal abierto={abierto} onCerrar={cerrar} titulo="Añadir a colección" tamano="pequeno">
            <div className="seleccionColeccionContenido">
                {/* Sample que se va a añadir */}
                <div className="seleccionColeccionSample">
                    <span className="seleccionColeccionSampleTitulo">{sample.titulo}</span>
                    <span className="seleccionColeccionSampleCreador">
                        {sample.creador.nombreVisible || sample.creador.username}
                    </span>
                </div>

                {/* Lista de colecciones */}
                {cargando ? (
                    <div className="seleccionColeccionCargando">
                        <Loader size={20} className="seleccionColeccionSpinner" />
                        <span>Cargando colecciones...</span>
                    </div>
                ) : (
                    <div className="seleccionColeccionLista">
                        {colecciones.map((col) => {
                            const yaAgregado = agregados.has(col.id);
                            const agregandoEste = agregando === col.id;

                            return (
                                <button
                                    key={col.id}
                                    className={`seleccionColeccionItem ${yaAgregado ? 'seleccionColeccionItemAgregado' : ''}`}
                                    onClick={() => !yaAgregado && manejarAgregar(col.id)}
                                    disabled={yaAgregado || agregandoEste}
                                    type="button"
                                >
                                    <FolderPlus size={16} />
                                    <span className="seleccionColeccionItemNombre">{col.nombre}</span>
                                    <span className="seleccionColeccionItemCount">
                                        {col.totalSamples} samples
                                    </span>
                                    {yaAgregado && <Check size={14} className="seleccionColeccionCheck" />}
                                    {agregandoEste && <Loader size={14} className="seleccionColeccionSpinner" />}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Crear nueva colección inline */}
                {creando ? (
                    <div className="seleccionColeccionCrear">
                        <input
                            type="text"
                            value={nuevoNombre}
                            onChange={(e) => setNuevoNombre(e.target.value)}
                            placeholder="Nombre de la colección..."
                            className="seleccionColeccionInput"
                            maxLength={100}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && manejarCrear()}
                        />
                        <BotonBase
                            variante="primario"
                            tamano="sm"
                            onClick={manejarCrear}
                            disabled={!nuevoNombre.trim() || agregando === -1}
                        >
                            {agregando === -1 ? 'Creando...' : 'Crear'}
                        </BotonBase>
                    </div>
                ) : (
                    <button
                        className="seleccionColeccionNueva"
                        onClick={() => setCreando(true)}
                        type="button"
                    >
                        <Plus size={16} />
                        <span>Nueva colección</span>
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default ModalSeleccionColeccion;
