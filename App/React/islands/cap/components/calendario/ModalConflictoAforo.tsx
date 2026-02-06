/**
 * ModalConflictoAforo Component
 *
 * Modal para resolver conflictos de aforo cuando la demanda de alumnos
 * excede la capacidad máxima por clase en determinados slots horarios.
 *
 * Permite al usuario seleccionar qué alumnos excluir de cada slot conflictivo.
 */

import { useState, useEffect } from 'react';
import { Modal } from '../ui';
import { Boton } from '../ui';
import type { ConflictoAforo, ExclusionesConflicto, Alumno } from '../../types';
import { priorizarPorProximidad, type AlumnoConProgreso } from '../../utils/priorizacionAforo';
import './ModalConflictoAforo.css';

interface ModalConflictoAforoProps {
    abierto: boolean;
    conflictos: ConflictoAforo[];
    onCerrar: () => void;
    onConfirmar: (exclusiones: ExclusionesConflicto) => void;
    cargando?: boolean;
}

export function ModalConflictoAforo({ abierto, conflictos, onCerrar, onConfirmar, cargando = false }: ModalConflictoAforoProps): JSX.Element {
    /* Estado de exclusiones: slotKey -> array de alumnoIds excluidos */
    const [exclusiones, setExclusiones] = useState<ExclusionesConflicto>({});
    const [alumnosInfo, setAlumnosInfo] = useState<Map<number, Alumno>>(new Map());
    const [cargandoAlumnos, setCargandoAlumnos] = useState(false);
    const [slotsAbiertos, setSlotsAbiertos] = useState<Record<string, boolean>>({});

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
                    const candidato = (item as { id?: number; alumnoId?: number; alumno_id?: number }).id
                        ?? (item as { id?: number; alumnoId?: number; alumno_id?: number }).alumnoId
                        ?? (item as { id?: number; alumnoId?: number; alumno_id?: number }).alumno_id;
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
                /* Obtener IDs únicos de alumnos */
                const alumnosIds = new Set<number>();
                conflictos.forEach(c => {
                    const idsNormalizados = normalizarIdsAlumnos(c.alumnos);
                    idsNormalizados.forEach(id => alumnosIds.add(id));
                });

                if (alumnosIds.size === 0) {
                    setAlumnosInfo(new Map());
                    return;
                }

                const idsQuery = Array.from(alumnosIds).join(',');
                const url = `/wp-json/cap/v1/alumnos/por-ids?ids=${encodeURIComponent(idsQuery)}`;

                const response = await fetch(url, {
                    headers: {
                        'X-WP-Nonce': (window as any).wpApiSettings?.nonce || ''
                    }
                });

                if (response.ok) {
                    const data = await response.json();

                    const mapa = new Map<number, Alumno>();
                    (data.alumnos || []).forEach((a: any) => {
                        /* Normalizar ID a número para comparación correcta */
                        const alumnoId = typeof a.id === 'number' ? a.id : parseInt(a.id, 10);

                        if (alumnosIds.has(alumnoId)) {
                            mapa.set(alumnoId, {
                                id: alumnoId,
                                centroId: typeof a.centro_id === 'number' ? a.centro_id : parseInt(a.centro_id, 10),
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

    useEffect(() => {
        const inicial: Record<string, boolean> = {};
        conflictos.forEach(c => {
            inicial[c.slotKey] = true;
        });
        setSlotsAbiertos(inicial);
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

    /* Toggle visual de lista por slot */
    const toggleSlot = (slotKey: string) => {
        setSlotsAbiertos(prev => ({
            ...prev,
            [slotKey]: !prev[slotKey]
        }));
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
        const alumno = alumnosInfo.get(id);
        return alumno?.nombre || `Alumno #${id}`;
    };

    /* Formatear fecha legible evitando desfase por zona horaria. */
    const formatearFecha = (fecha: string): string => {
        const esFechaSimple = /^\d{4}-\d{2}-\d{2}$/.test(fecha);
        const d = esFechaSimple
            ? (() => {
                const [anio, mes, dia] = fecha.split('-').map(Number);
                return new Date(anio, mes - 1, dia);
            })()
            : new Date(fecha);
        if (Number.isNaN(d.getTime())) {
            return fecha;
        }
        return d.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    /* Resolver automáticamente excluyendo alumnos al azar por slot. */
    const resolverAleatoriamente = () => {
        const nuevasExclusiones: ExclusionesConflicto = {};

        conflictos.forEach(conflicto => {
            const alumnosConflicto = normalizarIdsAlumnos(conflicto.alumnos);
            const exceso = Math.max(conflicto.exceso, 0);

            if (exceso === 0 || alumnosConflicto.length === 0) {
                nuevasExclusiones[conflicto.slotKey] = [];
                return;
            }

            const mezcla = [...alumnosConflicto].sort(() => Math.random() - 0.5);
            nuevasExclusiones[conflicto.slotKey] = mezcla.slice(0, Math.min(exceso, mezcla.length));
        });

        setExclusiones(nuevasExclusiones);
        onConfirmar(nuevasExclusiones);
    };

    /*
     * Resolver inteligentemente priorizando por proximidad (horas restantes + continuidad).
     * Usa el algoritmo de priorizacionAforo.ts que:
     * 1. Prioriza alumnos con menos horas restantes (cercanos a terminar)
     * 2. Evita fragmentar el horario (favorece clases seguidas)
     */
    const resolverPorProximidad = () => {
        /* Convertir Map a AlumnoConProgreso para el algoritmo */
        const alumnosConProgreso = new Map<number, AlumnoConProgreso>();
        alumnosInfo.forEach((alumno, id) => {
            alumnosConProgreso.set(id, alumno as AlumnoConProgreso);
        });

        /* Usar el algoritmo inteligente de priorización */
        const nuevasExclusiones = priorizarPorProximidad(conflictos, alumnosConProgreso);

        setExclusiones(nuevasExclusiones);
        onConfirmar(nuevasExclusiones);
    };

    const handleConfirmar = () => {
        if (exclusionesValidas()) {
            onConfirmar(exclusiones);
        }
    };

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} titulo="Conflictos de Aforo" tamano="lg" cerrarConEscape={!cargando}>
            <div className="conflictoAforo" id="modalConflictoAforo">
                <div className="conflictoAforo__descripcion">
                    <p>
                        Se han detectado <strong>{conflictos.length}</strong> slots horarios donde la demanda de alumnos <strong>supera la capacidad máxima</strong> por clase.
                    </p>
                    <p>Selecciona qué alumnos excluir de cada slot para resolver los conflictos, o usa una de las opciones automáticas:</p>
                    <div className="conflictoAforo__accionesRapidas">
                        <div className="conflictoAforo__opcionRapida">
                            <Boton variante="primario" onClick={resolverPorProximidad} disabled={cargando || cargandoAlumnos}>
                                Priorizar por proximidad
                            </Boton>
                            <span className="conflictoAforo__opcionDescripcion">
                                Prioriza alumnos cercanos a terminar y evita fragmentar horarios
                            </span>
                        </div>
                        <div className="conflictoAforo__opcionRapida">
                            <Boton variante="secundario" onClick={resolverAleatoriamente} disabled={cargando || cargandoAlumnos}>
                                Resolver aleatoriamente
                            </Boton>
                            <span className="conflictoAforo__opcionDescripcion">
                                Selecciona alumnos al azar
                            </span>
                        </div>
                    </div>
                </div>

                <div className="conflictoAforo__lista">
                    {conflictos.map(conflicto => {
                        const alumnosConflicto = normalizarIdsAlumnos(conflicto.alumnos);
                        const excluidos = exclusiones[conflicto.slotKey] || [];
                        const faltan = conflicto.exceso - excluidos.length;
                        const resuelto = faltan <= 0;
                        const slotAbierto = slotsAbiertos[conflicto.slotKey] ?? true;
                        const alumnosId = `conflictoAforo-alumnos-${conflicto.slotKey.replace(/[^a-zA-Z0-9_-]/g, '')}`;

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
                                        <button
                                            type="button"
                                            className="conflictoAforo__toggle"
                                            onClick={() => toggleSlot(conflicto.slotKey)}
                                            aria-expanded={slotAbierto}
                                            aria-controls={alumnosId}
                                        >
                                            {slotAbierto ? 'Ocultar alumnos' : `Mostrar alumnos (${alumnosConflicto.length})`}
                                        </button>
                                    </div>
                                </div>

                                {/* Ajuste UX: acordeón por slot para evitar listas infinitas y unificar scroll. */}
                                <div className={`conflictoAforo__slotContenido ${slotAbierto ? '' : 'conflictoAforo__slotContenido--colapsado'}`} id={alumnosId}>
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
