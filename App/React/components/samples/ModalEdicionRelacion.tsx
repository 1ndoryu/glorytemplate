/*
 * Componente: ModalEdicionRelacion — Kamples (L6.2c)
 * Modal para proponer ediciones o eliminaciones de relaciones existentes.
 * Vista pura; logica en useEdicionRelacion.
 */

import { Modal } from '../ui/Modal';
import { BotonBase } from '../ui/BotonBase';
import { CampoTexto } from '../ui/CampoTexto';
import { SelectorMenu } from '../ui/SelectorMenu';
import { Checkbox } from '../ui/Checkbox';
import { useEdicionRelacion } from '../../hooks/useEdicionRelacion';
import { useAuthStore } from '../../stores/authStore';
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
    const esAdmin = useAuthStore(s => s.usuario?.rol === 'admin');

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
        <Modal abierto={abierto} onCerrar={handleCerrar} tamano="pequeno"  pie={pie}>
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
                            placeholder="Explica por qué esta relación es incorrecta o no debería existir..."
                            value={hook.razon}
                            onChange={(e) => hook.setRazon((e.target as HTMLTextAreaElement).value)}
                        />
                    </div>
                ) : (
                    /* Modo edicion: campos editables */
                    <div className="modalEdicionRelacionCampos">
                        <SelectorMenu
                            etiqueta="Tipo de relación"
                            valor={hook.tipoRelacion}
                            onChange={(v) => hook.setTipoRelacion(v as TipoRelacion)}
                            opciones={Object.entries(ETIQUETAS_TIPO_RELACION).map(([valor, etiqueta]) => ({ valor, etiqueta }))}
                        />

                        <SelectorMenu
                            etiqueta="Tipo de elemento"
                            valor={hook.tipoElemento}
                            onChange={(v) => hook.setTipoElemento(v as TipoElemento)}
                            opciones={Object.entries(ETIQUETAS_TIPO_ELEMENTO).map(([valor, etiqueta]) => ({ valor, etiqueta }))}
                        />

                        {/* L7.7: YouTube URL para el video de referencia */}
                        <CampoTexto
                            etiqueta="YouTube URL (opcional)"
                            placeholder="https://youtube.com/watch?v=..."
                            value={hook.youtubeUrl}
                            onChange={(e) => hook.setYoutubeUrl((e.target as HTMLInputElement).value)}
                        />

                        {/* L7.7: Timings en segundos (separados por coma) */}
                        <CampoTexto
                            etiqueta="Timings fuente (seg, separados por coma)"
                            placeholder="ej: 12, 45, 120"
                            value={hook.timingsFuente}
                            onChange={(e) => hook.setTimingsFuente((e.target as HTMLInputElement).value)}
                        />
                        <CampoTexto
                            etiqueta="Timings destino (seg, separados por coma)"
                            placeholder="ej: 30, 88"
                            value={hook.timingsDestino}
                            onChange={(e) => hook.setTimingsDestino((e.target as HTMLInputElement).value)}
                        />

                        {/* L7.7: Checkbox verificada — solo visible para admins */}
                        {esAdmin && (
                            <Checkbox
                                checked={hook.verificada}
                                onChange={(e) => hook.setVerificada(e.target.checked)}
                                label="Marcar como verificada"
                                className="modalEdicionRelacionCheckbox"
                            />
                        )}

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
