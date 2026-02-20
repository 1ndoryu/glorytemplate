/**
 * PanelDemo
 *
 * Panel de control para el modo demo.
 * Permite poblar y limpiar datos de ejemplo para testing y demos comerciales.
 * Solo visible para administradores en entornos de desarrollo.
 */

import {useState, useEffect} from 'react';
import {Boton, Tarjeta, TarjetaHeader, TarjetaBody, Badge, Spinner} from '../ui';
import {IconoBaseDatos, IconoAdvertencia, IconoEliminar, IconoUsuarios} from '../icons';
import {API_BASE} from '../../constants/cap-constants';

/* Declaración de tipo para wpApiSettings de WordPress */
declare global {
    interface Window {
        wpApiSettings?: {
            nonce: string;
            root: string;
        };
    }
}

interface EstadoDemo {
    activo: boolean;
    permitido: boolean;
    estadisticas: {
        alumnos: number;
        clases: number;
    };
}

export function PanelDemo() {
    const [estado, setEstado] = useState<EstadoDemo | null>(null);
    const [cargando, setCargando] = useState(true);
    const [ejecutando, setEjecutando] = useState<'seed' | 'clean' | 'limpiarTodas' | null>(null);
    const [mensaje, setMensaje] = useState<{tipo: 'exito' | 'error'; texto: string} | null>(null);
    const [confirmandoLimpiarTodas, setConfirmandoLimpiarTodas] = useState(false);

    /* Obtener estado inicial */
    useEffect(() => {
        const controller = new AbortController();
        obtenerEstado(controller.signal);
        return () => controller.abort();
    }, []);

    const obtenerEstado = async (signal?: AbortSignal) => {
        try {
            const response = await fetch(`${API_BASE}/demo/status`, {
                headers: {
                    'X-WP-Nonce': window.wpApiSettings?.nonce || ''
                },
                signal
            });

            if (response.ok) {
                const data = await response.json();
                setEstado(data);
            }
        } catch (error) {
            /* Ignorar cancelaciones por AbortController */
            if (error instanceof DOMException && error.name === 'AbortError') return;
            console.error('Error al obtener estado demo:', error);
        } finally {
            setCargando(false);
        }
    };

    const poblarDatos = async () => {
        setEjecutando('seed');
        setMensaje(null);

        try {
            const response = await fetch(`${API_BASE}/demo/seed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApiSettings?.nonce || ''
                }
            });

            /* Verificar si la respuesta HTTP fue exitosa */
            if (!response.ok) {
                setMensaje({tipo: 'error', texto: `Error ${response.status}: ${response.statusText}`});
                return;
            }

            /* Intentar parsear JSON */
            try {
                const data = await response.json();
                if (data.exito) {
                    setMensaje({
                        tipo: 'exito',
                        texto: `Datos creados: ${data.estadisticas?.alumnos || 0} alumnos, ${data.estadisticas?.clases || 0} clases`
                    });
                } else {
                    setMensaje({tipo: 'error', texto: data.error || 'Error al poblar datos'});
                }
            } catch {
                /* Respuesta HTTP ok pero JSON invalido: estado incierto, no reportar exito falso */
                setMensaje({tipo: 'error', texto: 'La respuesta del servidor no es válida. Verifica el estado de los datos.'});
            }

            /* Siempre refrescar el estado al final */
            await obtenerEstado();
        } catch (error) {
            console.error('Error de conexión:', error);
            setMensaje({tipo: 'error', texto: 'Error de conexión al servidor'});
        } finally {
            setEjecutando(null);
        }
    };

    const limpiarDatos = async () => {
        if (!confirm('¿Estás seguro de que deseas eliminar todos los datos de demostración?')) {
            return;
        }

        setEjecutando('clean');
        setMensaje(null);

        try {
            const response = await fetch(`${API_BASE}/demo/clean`, {
                method: 'DELETE',
                headers: {
                    'X-WP-Nonce': window.wpApiSettings?.nonce || ''
                }
            });

            const data = await response.json();

            if (data.exito) {
                setMensaje({
                    tipo: 'exito',
                    texto: `Datos eliminados: ${data.eliminados.alumnos} alumnos, ${data.eliminados.clases} clases`
                });
                /* Refrescar estado en segundo plano */
                obtenerEstado().catch(() => {});
            } else {
                setMensaje({tipo: 'error', texto: data.error || 'Error al limpiar datos'});
            }
        } catch (error) {
            setMensaje({tipo: 'error', texto: 'Error de conexión al limpiar datos'});
        } finally {
            setEjecutando(null);
        }
    };

    /* Función para eliminar TODAS las clases (incluso huérfanas) */
    const limpiarTodasLasClases = async () => {
        if (!confirmandoLimpiarTodas) {
            /* Primera vez: mostrar confirmación */
            setConfirmandoLimpiarTodas(true);
            setMensaje({tipo: 'error', texto: '¡ATENCIÓN! Esto eliminará TODAS las clases. Click de nuevo para confirmar.'});
            /* Reset automático después de 5 segundos */
            setTimeout(() => {
                setConfirmandoLimpiarTodas(false);
                setMensaje(null);
            }, 5000);
            return;
        }

        /* Segunda confirmación con prompt */
        const confirmacion = prompt('Escribe ELIMINAR_TODO para confirmar:');
        if (confirmacion !== 'ELIMINAR_TODO') {
            setMensaje({tipo: 'error', texto: 'Operación cancelada'});
            setConfirmandoLimpiarTodas(false);
            return;
        }

        setEjecutando('limpiarTodas');
        setMensaje(null);
        setConfirmandoLimpiarTodas(false);

        try {
            const response = await fetch(`${API_BASE}/clases/limpiar-todas?confirmar=ELIMINAR_TODO&incluirBloqueadas=true`, {
                method: 'DELETE',
                headers: {
                    'X-WP-Nonce': window.wpApiSettings?.nonce || ''
                }
            });

            const data = await response.json();

            if (data.exito) {
                setMensaje({
                    tipo: 'exito',
                    texto: data.mensaje || `Se eliminaron ${data.eliminadas} clases`
                });
                await obtenerEstado();
            } else {
                setMensaje({tipo: 'error', texto: data.error || 'Error al limpiar clases'});
            }
        } catch (error) {
            setMensaje({tipo: 'error', texto: 'Error de conexión al limpiar clases'});
        } finally {
            setEjecutando(null);
        }
    };

    /* Mientras carga, mostrar spinner */
    if (cargando) {
        return (
            <Tarjeta className="capPanelConfig capPanelConfig--demo">
                <TarjetaBody>
                    <div className="capFlexCenter" style={{padding: '2rem'}}>
                        <Spinner tamano="md" />
                    </div>
                </TarjetaBody>
            </Tarjeta>
        );
    }

    /* Si no está permitido el modo demo, no mostrar */
    if (!estado?.permitido) {
        return null;
    }

    return (
        <Tarjeta className="capPanelConfig capPanelConfig--demo">
            <TarjetaHeader>
                <div className="capFlexStart capGap--sm">
                    <span className="capPanelConfig__icono capPanelConfig__icono--advertencia">
                        <IconoBaseDatos />
                    </span>
                    <h3 className="capTitulo capTitulo--sm">Modo Demo</h3>
                    {estado.activo && <Badge variante="advertencia">Activo</Badge>}
                </div>
            </TarjetaHeader>
            <TarjetaBody>
                <div className="capDemoInfo">
                    {/* Advertencia */}
                    <div className="capDemoInfo__advertencia">
                        <IconoAdvertencia size={16} />
                        <span>Solo disponible en modo desarrollo (WP_DEBUG)</span>
                    </div>

                    {/* Estado actual */}
                    {estado.activo && (
                        <div className="capDemoInfo__estadisticas">
                            <div className="capDemoInfo__stat">
                                <IconoUsuarios size={16} />
                                <span>{estado.estadisticas.alumnos} alumnos demo</span>
                            </div>
                            <div className="capDemoInfo__stat">
                                <span>{estado.estadisticas.clases} clases demo</span>
                            </div>
                        </div>
                    )}

                    {/* Mensaje de feedback */}
                    {mensaje && <div className={`capDemoInfo__mensaje capDemoInfo__mensaje--${mensaje.tipo}`}>{mensaje.texto}</div>}

                    {/* Acciones */}
                    <div className="capDemoInfo__acciones">
                        <Boton variante="outline" tamano="sm" onClick={poblarDatos} disabled={ejecutando !== null}>
                            {ejecutando === 'seed' ? <Spinner tamano="sm" /> : <IconoBaseDatos size={16} />}
                            Poblar datos demo
                        </Boton>

                        {estado.activo && (
                            <Boton variante="peligro" tamano="sm" onClick={limpiarDatos} disabled={ejecutando !== null}>
                                {ejecutando === 'clean' ? <Spinner tamano="sm" /> : <IconoEliminar size={16} />}
                                Limpiar datos demo
                            </Boton>
                        )}

                        {/* Botón para limpiar TODAS las clases (incluye huérfanas) */}
                        <Boton variante={confirmandoLimpiarTodas ? 'peligro' : 'outline'} tamano="sm" onClick={limpiarTodasLasClases} disabled={ejecutando !== null}>
                            {ejecutando === 'limpiarTodas' ? <Spinner tamano="sm" /> : <IconoEliminar size={16} />}
                            {confirmandoLimpiarTodas ? '¡CONFIRMAR ELIMINACIÓN!' : 'Eliminar TODAS las clases'}
                        </Boton>
                    </div>

                    <p className="capTexto capTexto--xs capTexto--terciario capMt--sm">Los datos demo son identificables por emails terminados en @ejemplo.com</p>
                </div>
            </TarjetaBody>
        </Tarjeta>
    );
}

export default PanelDemo;
