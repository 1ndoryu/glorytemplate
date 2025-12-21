/**
 * Panel de Configuración de Seguridad
 *
 * Permite al usuario gestionar opciones de seguridad como:
 * - Cifrado end-to-end de datos
 * - Estado de la conexión HTTPS
 * - Información sobre protección de datos
 */

import {useState} from 'react';
import {Lock, Unlock, Shield, ShieldCheck, ShieldAlert, Key, Info, CheckCircle, AlertTriangle} from 'lucide-react';
import {useCifrado} from '../../hooks';
import {ToggleSwitch, Modal} from '../shared';

interface PanelSeguridadProps {
    visible: boolean;
    onCerrar: () => void;
}

export function PanelSeguridad({visible, onCerrar}: PanelSeguridadProps) {
    const {estadoCifrado, cargando, error, toggleCifrado} = useCifrado();
    const [procesando, setProcesando] = useState(false);
    const [mensajeExito, setMensajeExito] = useState<string | null>(null);

    const esHttps = window.location.protocol === 'https:';

    const handleToggleCifrado = async (nuevoValor: boolean) => {
        setProcesando(true);
        setMensajeExito(null);

        const exito = await toggleCifrado(nuevoValor);

        if (exito) {
            setMensajeExito(nuevoValor ? 'Cifrado activado' : 'Cifrado desactivado');
            setTimeout(() => setMensajeExito(null), 3000);
        }

        setProcesando(false);
    };

    if (!visible) return null;

    return (
        <Modal estaAbierto={visible} onCerrar={onCerrar} titulo="Seguridad y Privacidad">
            <div id="panel-seguridad-contenido" className="panelSeguridadContenido">
                {/* Estado HTTPS */}
                <section className="seccionSeguridad">
                    <div className="seccionSeguridadEncabezado">
                        <span className={`iconoSeguridad ${esHttps ? 'seguro' : 'advertencia'}`}>{esHttps ? <Lock size={18} /> : <Unlock size={18} />}</span>
                        <div className="seccionSeguridadInfo">
                            <h3>Conexion HTTPS</h3>
                            <p className="descripcionSeguridad">{esHttps ? 'Conexion cifrada. Los datos viajan de forma segura entre tu navegador y el servidor.' : 'Conexion no segura. Configura HTTPS en tu servidor para proteger los datos en transito.'}</p>
                        </div>
                        <span className={`estadoIndicador ${esHttps ? 'activo' : 'inactivo'}`}>{esHttps ? 'Seguro' : 'Inseguro'}</span>
                    </div>
                </section>

                {/* Cifrado de Datos */}
                <section className="seccionSeguridad">
                    <div className="seccionSeguridadEncabezado">
                        <span className={`iconoSeguridad ${estadoCifrado?.habilitado ? 'seguro' : ''}`}>{estadoCifrado?.habilitado ? <ShieldCheck size={18} /> : <Shield size={18} />}</span>
                        <div className="seccionSeguridadInfo">
                            <h3>Cifrado E2E</h3>
                            <p className="descripcionSeguridad">Protege tus habitos, tareas y proyectos con cifrado AES-256-GCM. Los datos se almacenan cifrados en la base de datos.</p>
                        </div>
                    </div>

                    <div className="controlCifrado">
                        {cargando ? (
                            <span className="cargandoIndicador">verificando estado...</span>
                        ) : error ? (
                            <span className="errorIndicador">{error}</span>
                        ) : (
                            <>
                                <ToggleSwitch checked={estadoCifrado?.habilitado ?? false} onChange={handleToggleCifrado} disabled={procesando} />
                                <span className="etiquetaCifrado">{estadoCifrado?.habilitado ? 'ENABLED' : 'DISABLED'}</span>
                                {procesando && <span className="procesandoIndicador">procesando...</span>}
                                {mensajeExito && <span className="exitoIndicador">{mensajeExito}</span>}
                            </>
                        )}
                    </div>

                    {estadoCifrado?.habilitado && (
                        <div className="detallesCifrado">
                            <div className="detalleCifradoItem">
                                <span className="etiqueta">Algoritmo</span>
                                <span className="valor">{estadoCifrado.algoritmo}</span>
                            </div>
                            <div className="detalleCifradoItem">
                                <span className="etiqueta">Derivacion</span>
                                <span className="valor">{estadoCifrado.tipoClaveDerivacion}</span>
                            </div>
                        </div>
                    )}
                </section>

                {/* Información Adicional */}
                <section className="seccionSeguridad infoAdicional">
                    <div className="seccionSeguridadEncabezado">
                        <span className="iconoSeguridad">
                            <Info size={18} />
                        </span>
                        <div className="seccionSeguridadInfo">
                            <h3>Politica de Datos</h3>
                            <ul className="listaInfo">
                                <li>Tus datos nunca se comparten con terceros</li>
                                <li>El cifrado usa una clave unica derivada de tu cuenta</li>
                                <li>Los datos locales se mantienen offline</li>
                                <li>Puedes exportar tus datos en cualquier momento</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </div>
        </Modal>
    );
}

export default PanelSeguridad;
