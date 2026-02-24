/*
 * Componente: BotonExperimentos
 * Botón admin-only en TopBar para generar contenido de test realista.
 * Crea usuario test + notificación + mensaje con un solo click.
 * Lógica extraída a useBotonExperimentos hook.
 */

import { FlaskConical, Check, Loader2, AlertTriangle } from 'lucide-react';
import { useBotonExperimentos } from '../../hooks/useBotonExperimentos';
import '../../styles/componentes/experimentos.css';
import { BotonBase } from './BotonBase';

export const BotonExperimentos = (): JSX.Element | null => {
    const {
        estado,
        panelVisible,
        ultimoResultado,
        esAdmin,
        ejecutar,
        ejecutarEmbeddings,
        togglePanel,
    } = useBotonExperimentos();

    /* Solo visible para admin real */
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
            <BotonBase variante="ghost"
                className={`experimentosBtn experimentosBtn--${estado}`}
                onClick={togglePanel}
                aria-label="Experimentos de test"
                type="button"
                title="Generar contenido de test"
            >
                {iconoEstado()}
            </BotonBase>

            {panelVisible && (
                <div className="experimentosPanel">
                    <div className="experimentosTitulo">Experimentos</div>

                    <BotonBase variante="ghost"
                        className="experimentosAccion"
                        onClick={() => ejecutar()}
                        disabled={estado === 'cargando'}
                        type="button"
                    >
                        <FlaskConical size={13} />
                        Generar todo
                    </BotonBase>

                    <BotonBase variante="ghost"
                        className="experimentosAccion"
                        onClick={() => ejecutar(['notificacion'])}
                        disabled={estado === 'cargando'}
                        type="button"
                    >
                        Notificación
                    </BotonBase>

                    <BotonBase variante="ghost"
                        className="experimentosAccion"
                        onClick={() => ejecutar(['mensaje'])}
                        disabled={estado === 'cargando'}
                        type="button"
                    >
                        Mensaje
                    </BotonBase>

                    <div className="experimentosSeparador" />

                    <BotonBase variante="ghost"
                        className="experimentosAccion"
                        onClick={() => ejecutarEmbeddings(false)}
                        disabled={estado === 'cargando'}
                        type="button"
                    >
                        Generar embeddings
                    </BotonBase>

                    <BotonBase variante="ghost"
                        className="experimentosAccion"
                        onClick={() => ejecutarEmbeddings(true)}
                        disabled={estado === 'cargando'}
                        type="button"
                    >
                        Regenerar todos
                    </BotonBase>

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
