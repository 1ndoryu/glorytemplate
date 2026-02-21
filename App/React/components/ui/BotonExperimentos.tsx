/*
 * Componente: BotonExperimentos
 * Botón admin-only en TopBar para generar contenido de test realista.
 * Crea usuario test + notificación + mensaje con un solo click.
 */

import { useState, useCallback } from 'react';
import { FlaskConical, Check, Loader2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@app/stores/authStore';
import { generarExperimento, generarEmbeddings, regenerarEmbeddings } from '@app/services/apiExperimentos';
import '../../styles/componentes/experimentos.css';

type EstadoBoton = 'idle' | 'cargando' | 'exito' | 'error';

export const BotonExperimentos = (): JSX.Element | null => {
    const usuario = useAuthStore(s => s.usuario);
    const [estado, setEstado] = useState<EstadoBoton>('idle');
    const [panelVisible, setPanelVisible] = useState(false);
    const [ultimoResultado, setUltimoResultado] = useState<string | null>(null);

    const ejecutar = useCallback(async (acciones?: ('usuario' | 'notificacion' | 'mensaje')[]) => {
        setEstado('cargando');
        setUltimoResultado(null);

        try {
            const resp = await generarExperimento(acciones);
            console.log('[Experimentos] Respuesta completa:', resp);

            if (resp.ok && resp.data) {
                setEstado('exito');
                /*
                 * apiPeticion extrae json.data, así que resp.data puede ser:
                 * - { ok, data: { usuario, notificacion, mensaje } }
                 * - { usuario, notificacion, mensaje } (si el backend no envuelve en data)
                 */
                const raw = resp.data as Record<string, unknown>;
                const d = (raw.data ?? raw) as Record<string, Record<string, unknown>>;
                const partes: string[] = [];

                if (d.usuario) partes.push(`Usuario: ${d.usuario.username ?? d.usuario.pgId}`);
                if (d.notificacion) partes.push(`Notif: ${d.notificacion.tipo}`);
                if (d.mensaje) partes.push(`Msg: "${String(d.mensaje.contenido ?? d.mensaje.mensaje ?? '').slice(0, 40)}"`);

                setUltimoResultado(partes.length > 0 ? partes.join(' | ') : 'Ejecutado correctamente');
            } else {
                setEstado('error');
                setUltimoResultado(resp.error ?? 'Error desconocido');
                console.error('[Experimentos] Error:', resp.error, resp);
            }
        } catch {
            setEstado('error');
            setUltimoResultado('Error de red');
        }

        /* Resetear estado visual tras 3 segundos */
        setTimeout(() => setEstado('idle'), 3000);
    }, []);

    const ejecutarEmbeddings = useCallback(async (regenerar = false) => {
        setEstado('cargando');
        setUltimoResultado(null);
        try {
            const resp = regenerar ? await regenerarEmbeddings() : await generarEmbeddings();
            if (resp.ok && resp.data) {
                setEstado('exito');
                const d = resp.data;
                setUltimoResultado(`Embeddings: ${d.actualizados ?? 0} en ${d.tiempoMs ?? 0}ms`);
            } else {
                setEstado('error');
                setUltimoResultado(resp.error ?? 'Error embeddings');
            }
        } catch {
            setEstado('error');
            setUltimoResultado('Error de red');
        }
        setTimeout(() => setEstado('idle'), 3000);
    }, []);

    /* Solo visible para admin real (no override) — después de todos los hooks */
    const esAdmin = usuario?.rol === 'admin';
    if (!esAdmin) return null;

    const iconoEstado = () => {
        switch (estado) {
            case 'cargando':
                return <Loader2 size={14} className="experimentosIconoGirando" />;
            case 'exito':
                return <Check size={14} />;
            case 'error':
                return <AlertTriangle size={14} />;
            default:
                return <FlaskConical size={14} />;
        }
    };

    return (
        <div className="experimentosContenedor">
            <button
                className={`experimentosBtn experimentosBtn--${estado}`}
                onClick={() => setPanelVisible((v) => !v)}
                aria-label="Experimentos de test"
                type="button"
                title="Generar contenido de test"
            >
                {iconoEstado()}
            </button>

            {panelVisible && (
                <div className="experimentosPanel">
                    <div className="experimentosTitulo">Experimentos</div>

                    <button
                        className="experimentosAccion"
                        onClick={() => ejecutar()}
                        disabled={estado === 'cargando'}
                        type="button"
                    >
                        <FlaskConical size={13} />
                        Generar todo
                    </button>

                    <button
                        className="experimentosAccion"
                        onClick={() => ejecutar(['notificacion'])}
                        disabled={estado === 'cargando'}
                        type="button"
                    >
                        Notificación
                    </button>

                    <button
                        className="experimentosAccion"
                        onClick={() => ejecutar(['mensaje'])}
                        disabled={estado === 'cargando'}
                        type="button"
                    >
                        Mensaje
                    </button>

                    <div className="experimentosSeparador" />

                    <button
                        className="experimentosAccion"
                        onClick={() => ejecutarEmbeddings(false)}
                        disabled={estado === 'cargando'}
                        type="button"
                    >
                        Generar embeddings
                    </button>

                    <button
                        className="experimentosAccion"
                        onClick={() => ejecutarEmbeddings(true)}
                        disabled={estado === 'cargando'}
                        type="button"
                    >
                        Regenerar todos
                    </button>

                    {ultimoResultado && (
                        <div className={`experimentosResultado experimentosResultado--${estado}`}>
                            {ultimoResultado}
                        </div>
                    )}

                    <div className="experimentosInfo">
                        Crea usuario test + contenido real
                    </div>
                </div>
            )}
        </div>
    );
};

export default BotonExperimentos;
