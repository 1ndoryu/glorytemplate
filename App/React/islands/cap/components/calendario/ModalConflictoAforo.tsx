/**
 * ModalConflictoAforo Component
 *
 * Modal para resolver conflictos de aforo cuando la demanda de alumnos
 * excede la capacidad máxima por clase en determinados slots horarios.
 *
 * Permite al usuario seleccionar qué alumnos excluir de cada slot conflictivo.
 */

import {useState, useEffect} from 'react';
import {Modal} from '../ui';
import {Boton} from '../ui';
import type {ConflictoAforo, ExclusionesConflicto, Alumno} from '../../types';
import './ModalConflictoAforo.css';

interface ModalConflictoAforoProps {
    abierto: boolean;
    conflictos: ConflictoAforo[];
    onCerrar: () => void;
    onConfirmar: (exclusiones: ExclusionesConflicto) => void;
    cargando?: boolean;
}

export function ModalConflictoAforo({abierto, conflictos, onCerrar, onConfirmar, cargando = false}: ModalConflictoAforoProps): JSX.Element {
    /* Estado de exclusiones: slotKey -> array de alumnoIds excluidos */
    const [exclusiones, setExclusiones] = useState<ExclusionesConflicto>({});
    const [alumnosInfo, setAlumnosInfo] = useState<Map<number, Alumno>>(new Map());
    const [cargandoAlumnos, setCargandoAlumnos] = useState(false);

    /* Normalización defensiva para evitar formatos inesperados en la respuesta. */
    const normalizarIdsAlumnos = (lista: unknown): number[] => {
        if (!Array.isArray(lista)) return [];

        return lista
            .map(item => {
                if (typeof item === 'number') return item;
                if (typeof item === 'string') {
                    const parsed = Number(item);
                    return Number.isFinite(parsed) ? parsed : null;
                }
                if (item && typeof item === 'object') {
                    const candidato = (item as {id?: number; alumnoId?: number; alumno_id?: number}).id
                        ?? (item as {id?: number; alumnoId?: number; alumno_id?: number}).alumnoId
                        ?? (item as {id?: number; alumnoId?: number; alumno_id?: number}).alumno_id;
                    return typeof candidato === 'number' ? candidato : null;
                }
                return null;
            })
            .filter((id): id is number => Number.isFinite(id));
    };

    /* Cargar información de alumnos al abrir */
    useEffect(() => {
        if (!abierto || conflictos.length === 0) return;

        const cargarAlumnos = async () => {
            setCargandoAlumnos(true);
            try {
                /* Debug: verificar conflictos recibidos */
                console.log('[ModalConflictoAforo] Conflictos recibidos:', conflictos);

                /* Obtener IDs únicos de alumnos */
                const alumnosIds = new Set<number>();
                conflictos.forEach(c => {
                    console.log('[ModalConflictoAforo] Procesando conflicto:', c);
                    console.log('[ModalConflictoAforo] c.alumnos:', c.alumnos);
                    const idsNormalizados = normalizarIdsAlumnos(c.alumnos);
                    console.log('[ModalConflictoAforo] IDs normalizados:', idsNormalizados);
                    idsNormalizados.forEach(id => alumnosIds.add(id));
                });

                console.log('[ModalConflictoAforo] IDs únicos finales:', Array.from(alumnosIds));

                if (alumnosIds.size === 0) {
                    console.warn('[ModalConflictoAforo] No se encontraron IDs de alumnos');
                    setAlumnosInfo(new Map());
                    return;
                }

                const idsQuery = Array.from(alumnosIds).join(',');
                const url = `/wp-json/cap/v1/alumnos?ids=${encodeURIComponent(idsQuery)}`;
                console.log('[ModalConflictoAforo] Haciendo fetch a:', url);

                const response = await fetch(url, {
                    headers: {
                        'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''
                    }
                });

                console.log('[ModalConflictoAforo] Response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('[ModalConflictoAforo] Datos recibidos:', data);
                    
                    const mapa = new Map<number, Alumno>();
                    (data.alumnos || []).forEach((a: any) => {
                        if (alumnosIds.has(a.id)) {
                            mapa.set(a.id, {
                                id: a.id,
                                centroId: a.centro_id,
                                nombre: a.nombre,
                                email: a.email,
                                telefono: a.telefono,
                                dni: a.dni,
                                horasCompletadas: parseFloat(a.horas_completadas) || 0,
                                estado: a.estado,
                                createdAt: a.created_at
                            });
                        }
                    });
                    console.log('[ModalConflictoAforo] Mapa de alumnos generado:', mapa);
                    setAlumnosInfo(mapa);
                } else {
                    console.error('[ModalConflictoAforo] Response no OK:', await response.text());
                    setAlumnosInfo(new Map());
                }
            } catch (err) {
                console.error('[ModalConflictoAforo] Error cargando alumnos:', err);
            } finally {
                setCargandoAlumnos(false);
            }
        };

        cargarAlumnos();
    }, [abierto, conflictos]);

    /* Inicializar exclusiones vacías */
    useEffect(() => {
        const inicial: ExclusionesConflicto = {};
        conflictos.forEach(c => {
            inicial[c.slotKey] = [];
        });
        setExclusiones(inicial);
    }, [conflictos]);

    /* Toggle exclusión de alumno */
    const toggleExclusion = (slotKey: string, alumnoId: number) => {
        setExclusiones(prev => {
            const actuales = prev[slotKey] || [];
            const yaExcluido = actuales.includes(alumnoId);

            return {
                ...prev,
                [slotKey]: yaExcluido ? actuales.filter(id => id !== alumnoId) : [...actuales, alumnoId]
            };
        });
    };

    /* Verificar si todas las exclusiones resuelven los conflictos */
    const exclusionesValidas = (): boolean => {
        return conflictos.every(c => {
            const excluidos = exclusiones[c.slotKey]?.length || 0;
            return excluidos >= c.exceso;
        });
    };

    /* Obtener nombre de alumno */
    const getNombreAlumno = (id: number): string => {
        return alumnosInfo.get(id)?.nombre || `Alumno #${id}`;
    };

    /* Formatear fecha legible */
    const formatearFecha = (fecha: string): string => {
        const d = new Date(fecha);
        if (Number.isNaN(d.getTime())) {
            return fecha;
        }
        return d.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    const handleConfirmar = () => {
        if (exclusionesValidas()) {
            onConfirmar(exclusiones);
        }
    };

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} titulo="Conflictos de Aforo" tamano="lg" cerrarConEscape={!cargando}>
            <div className="conflictoAforo">
                <div className="conflictoAforo__descripcion">
                    <p>
                        Se han detectado <strong>{conflictos.length}</strong> slots horarios donde la demanda de alumnos <strong>supera la capacidad máxima</strong> por clase.
                    </p>
                    <p>Selecciona qué alumnos excluir de cada slot para resolver los conflictos.</p>
                </div>

                <div className="conflictoAforo__lista">
                    {conflictos.map(conflicto => {
                        const alumnosConflicto = normalizarIdsAlumnos(conflicto.alumnos);
                        const excluidos = exclusiones[conflicto.slotKey] || [];
                        const faltan = conflicto.exceso - excluidos.length;
                        const resuelto = faltan <= 0;

                        return (
                            <div key={conflicto.slotKey} className={`conflictoAforo__slot ${resuelto ? 'conflictoAforo__slot--resuelto' : ''}`}>
                                <div className="conflictoAforo__slotHeader">
                                    <div className="conflictoAforo__slotInfo">
                                        <span className="conflictoAforo__fecha">{formatearFecha(conflicto.fecha)}</span>
                                        <span className="conflictoAforo__hora">
                                            {conflicto.horaInicio} - {conflicto.horaFin}
                                        </span>
                                    </div>
                                    <div className="conflictoAforo__stats">
                                        <span className="conflictoAforo__demanda">
                                            Demanda: <strong>{conflicto.demanda}</strong>
                                        </span>
                                        <span className="conflictoAforo__capacidad">
                                            Capacidad: <strong>{conflicto.capacidad}</strong>
                                        </span>
                                        {!resuelto && <span className="conflictoAforo__exceso">Excluir: {faltan} más</span>}
                                        {resuelto && <span className="conflictoAforo__ok">✓ Resuelto</span>}
                                    </div>
                                </div>

                                <div className="conflictoAforo__alumnos">
                                    {cargandoAlumnos ? (
                                        <span className="conflictoAforo__cargando">Cargando alumnos...</span>
                                    ) : alumnosConflicto.length === 0 ? (
                                        <span className="conflictoAforo__vacio">No hay alumnos disponibles en este slot.</span>
                                    ) : (
                                        alumnosConflicto.map(alumnoId => {
                                            const excluido = excluidos.includes(alumnoId);
                                            return (
                                                <label key={alumnoId} className={`conflictoAforo__alumno ${excluido ? 'conflictoAforo__alumno--excluido' : ''}`}>
                                                    <input type="checkbox" checked={excluido} onChange={() => toggleExclusion(conflicto.slotKey, alumnoId)} className="conflictoAforo__checkbox" />
                                                    <span className="conflictoAforo__alumnoNombre">{getNombreAlumno(alumnoId)}</span>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="conflictoAforo__acciones">
                    <Boton variante="ghost" onClick={onCerrar} disabled={cargando}>
                        Cancelar
                    </Boton>
                    <Boton variante="primario" onClick={handleConfirmar} disabled={!exclusionesValidas() || cargando} cargando={cargando}>
                        Generar con exclusiones
                    </Boton>
                </div>
            </div>
        </Modal>
    );
}

export default ModalConflictoAforo;
