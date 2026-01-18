import React, {useState} from 'react';
import {Server, Terminal} from 'lucide-react';
import {Tarjeta} from '../../ui/Tarjeta';
import {Boton} from '../../ui/Boton';
import {usePanel} from '../../../context/PanelContext';

export const VistaHosting: React.FC = () => {
    const {serverStats} = usePanel();
    const [tab, setTab] = useState('general');
    const tabs = ['General', 'Archivos', 'Terminal', 'Logs'];

    return (
        <div className="bloqueVista">
            <header className="hostingHeader">
                <div className="hostingInfo">
                    <h2 className="hostingTitulo">
                        <div className="iconoHostingWrapper">
                            <Server size={18} />
                        </div>
                        srv-nakomi-01
                    </h2>
                    <p className="hostingMeta">
                        IP: {serverStats.ip} • {serverStats.os}
                    </p>
                </div>
                <div className="hostingAcciones">
                    <Boton variante="ghost" tamano="sm" className="botonAlerta">
                        Detener
                    </Boton>
                    <Boton variante="ghost" tamano="sm" className="botonExito">
                        Reiniciar
                    </Boton>
                </div>
            </header>

            <div className="hostingTabs">
                {tabs.map(t => (
                    <button key={t} onClick={() => setTab(t.toLowerCase())} className={`hostingTabBtn ${tab === t.toLowerCase() ? 'active' : ''}`}>
                        {t}
                    </button>
                ))}
            </div>

            <div className="hostingContenido">
                {tab === 'general' && (
                    <div className="hostingGrid">
                        <Tarjeta className="hostingCard">
                            <h4 className="textIndice tituloCard">Recursos del Sistema</h4>
                            <div className="recursosLista">
                                <div className="recursoItem">
                                    <div className="recursoLabel">
                                        <span>CPU Load</span>
                                        <span>{serverStats.cpu}%</span>
                                    </div>
                                    <div className="barraProgresoFondo">
                                        <div className="barraProgresoRelleno" style={{width: `${serverStats.cpu}%`}} />
                                    </div>
                                </div>
                                <div className="recursoItem">
                                    <div className="recursoLabel">
                                        <span>RAM Usage</span>
                                        <span>
                                            {serverStats.ram}GB / {serverStats.ramTotal}GB
                                        </span>
                                    </div>
                                    <div className="barraProgresoFondo">
                                        <div className="barraProgresoRelleno colorSecundario" style={{width: `${(serverStats.ram / serverStats.ramTotal) * 100}%`}} />
                                    </div>
                                </div>
                            </div>
                        </Tarjeta>
                        <Tarjeta className="hostingCard">
                            <h4 className="textIndice tituloCard">Acceso SSH Rápido</h4>
                            <div className="sshBox">
                                <span>ssh nakomi@{serverStats.ip} -p 22</span>
                                <Terminal size={14} />
                            </div>
                            <p className="sshNota">Utiliza tu clave privada configurada en el perfil.</p>
                        </Tarjeta>
                    </div>
                )}
                {tab === 'terminal' && (
                    <div className="terminalWindow">
                        <div className="terminalLine exito">nakomi@server:~$ status check</div>
                        <div className="terminalLine blanco">All systems operational. Uptime: {serverStats.uptime}.</div>
                        <div className="terminalLine exito">nakomi@server:~$ docker ps</div>
                        <div className="terminalLine gris">
                            CONTAINER ID IMAGE COMMAND CREATED STATUS PORTS{'\n'}
                            a1b2c3d4e5f6 nginx:latest "/docker-entrypoint.…" 2 days ago Up 2 days 0.0.0.0:80{'>'}80/tcp
                        </div>
                        <div className="terminalInput">
                            <span className="terminalPrompt">nakomi@server:~$</span>
                            <span className="terminalCursor"></span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
