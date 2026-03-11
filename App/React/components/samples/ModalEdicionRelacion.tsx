/*
 * Componente: ModalEdicionRelacion — Kamples (L6.2c)
 * Modal para proponer ediciones o eliminaciones de relaciones existentes.
 * Vista pura; logica en useEdicionRelacion.
 */

import { Modal } from '../ui/Modal';
import { BotonBase } from '../ui/BotonBase';
import { CampoTexto } from '../ui/CampoTexto';
import { SelectorBase } from '../ui/SelectorBase';
import { useEdicionRelacion } from '../../hooks/useEdicionRelacion';
import type { RelacionParaEditar } from '../../hooks/useEdicionRelacion';
import type { TipoRelacion, TipoElemento } from '../../types/cancion';
import { ETIQUETAS_TIPO_RELACION, ETIQUETAS_TIPO_ELEMENTO } from '../../types/cancion';
import '../../styles/componentes/modalEdicionRelacion.css';

interface ModalEdicionRelacionProps {
    relacion: RelacionParaEditar | null;
    modoEliminacion?: boolean;
    onCerrar: () => void;
    onExito?: () => void;
}

export const ModalEdicionRelacion = ({
    relacion,
    modoEliminacion = false,
    onCerrar,
    onExito,
}: ModalEdicionRelacionProps): JSX.Element | null => {
    const hook = useEdicionRelacion();

    /* Sincronizar relacion activa con el hook cuando cambia la prop */
    const necesitaSincronizar =
        relacion &&
        (!hook.relacionActiva || hook.relacionActiva.id !== relacion.id || hook.modoEliminacion !== modoEliminacion);

    if (necesitaSincronizar && relacion) {
        if (modoEliminacion) {
            hook.abrirEliminacion(relacion);
        } else {
            hook.abrirEdicion(relacion);
        }
    }

    const abierto = relacion !== null;

    const handleCerrar = () => {
        hook.cerrar();
        onCerrar();
    };

    const handleEnviar = async () => {
        const exitoso = await hook.enviar();
        if (exitoso) {
            onExito?.();
            handleCerrar();
        }
    };

    const titulo = hook.modoEliminacion
        ? 'Reportar relacion incorrecta'
        : 'Sugerir correccion';

    const pie = (
        <div className="modalEdicionRelacionPie">
            <BotonBase variante="ghost" onClick={handleCerrar} type="button">
                Cancelar
            </BotonBase>
            <BotonBase
                variante={hook.modoEliminacion ? 'peligro' : 'primario'}
                onClick={handleEnviar}
                cargando={hook.cargando}
                type="button"
            >
                {hook.modoEliminacion ? 'Enviar reporte' : 'Enviar sugerencia'}
            </BotonBase>
        </div>
    );

    return (
        <Modal abierto={abierto} onCerrar={handleCerrar} titulo={titulo} tamano="pequeno" pie={pie}>
            <div className="modalEdicionRelacion">
                {/* Info de la relacion actual */}
                <div className="modalEdicionRelacionInfo">
                    <span className="modalEdicionRelacionInfoEtiqueta">Relacion actual</span>
                    <span className="modalEdicionRelacionInfoValor">
                        {relacion?.cancionFuente ?? '?'} → {relacion?.cancionDestino ?? '?'}
                    </span>
                    <span className="modalEdicionRelacionInfoValor">
                        {relacion ? ETIQUETAS_TIPO_RELACION[relacion.tipoRelacion] : ''} ·{' '}
                        {relacion ? ETIQUETAS_TIPO_ELEMENTO[relacion.tipoElemento] : ''}
                    </span>
                </div>

                {hook.modoEliminacion ? (
                    /* Modo eliminacion: solo pedir razon */
                    <div className="modalEdicionRelacionCampos">
                        <CampoTexto
                            etiqueta="Razon (min. 10 caracteres)"
                            multilínea
                            rows={3}
                            placeholder="Explica por que esta relacion es incorrecta o no deberia existir..."
                            value={hook.razon}
                            onChange={(e) => hook.setRazon((e.target as HTMLTextAreaElement).value)}
                        />
                    </div>
                ) : (
                    /* Modo edicion: campos editables */
                    <div className="modalEdicionRelacionCampos">
                        <SelectorBase
                            etiqueta="Tipo de relacion"
                            value={hook.tipoRelacion}
                            onChange={(e) => hook.setTipoRelacion(e.target.value as TipoRelacion)}
                        >
                            {Object.entries(ETIQUETAS_TIPO_RELACION).map(([valor, etiqueta]) => (
                                <option key={valor} value={valor}>
                                    {etiqueta}
                                </option>
                            ))}
                        </SelectorBase>

                        <SelectorBase
                            etiqueta="Tipo de elemento"
                            value={hook.tipoElemento}
                            onChange={(e) => hook.setTipoElemento(e.target.value as TipoElemento)}
                        >
                            {Object.entries(ETIQUETAS_TIPO_ELEMENTO).map(([valor, etiqueta]) => (
                                <option key={valor} value={valor}>
                                    {etiqueta}
                                </option>
                            ))}
                        </SelectorBase>

                        <CampoTexto
                            etiqueta="Razon del cambio (opcional)"
                            multilínea
                            rows={2}
                            placeholder="Explica brevemente por que sugieres este cambio..."
                            value={hook.razon}
                            onChange={(e) => hook.setRazon((e.target as HTMLTextAreaElement).value)}
                        />
                    </div>
                )}

                <p className="modalEdicionRelacionAviso">
                    Tu sugerencia sera revisada por un moderador antes de aplicarse.
                </p>
            </div>
        </Modal>
    );
};
