/**
 * PanelDemo
 *
 * Panel de control para el modo demo.
 * Permite poblar y limpiar datos de ejemplo para testing y demos comerciales.
 * Solo visible para administradores en entornos de desarrollo.
 */

import {Boton, Tarjeta, TarjetaHeader, TarjetaBody, Badge, Spinner} from '../ui';
import {IconoBaseDatos, IconoAdvertencia, IconoEliminar, IconoUsuarios} from '../icons';
import {usePanelDemo} from '../../hooks/usePanelDemo';

/* Declaración de tipo para wpApiSettings de WordPress */
declare global {
    interface Window {
        wpApiSettings?: {
            nonce: string;
            root: string;
        };
    }
}

export function PanelDemo() {
    const {
        estado, cargando, ejecutando, mensaje, confirmandoLimpiarTodas,
        poblarDatos, limpiarDatos, limpiarTodasLasClases,
    } = usePanelDemo();

    /* Mientras carga, mostrar spinner */
    if (cargando) {
        return (
            <Tarjeta className="capPanelConfig capPanelConfig--demo">
                <TarjetaBody>
                    /* sentinel-disable-next-line css-inline-jsx */
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
