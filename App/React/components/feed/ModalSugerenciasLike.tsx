/*
 * ModalSugerenciasLike — Kamples
 * Modal "También te podría gustar": aparece después de dar like a un sample.
 * Muestra 3-5 samples similares por tags/BPM/key.
 * Diseño: overlay suave, tarjetas compactas, cierre por click fuera o botón.
 */

import { useCallback } from 'react';
import { X, Sparkles } from 'lucide-react';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { Modal } from '@app/components/ui/Modal';
import { useSugerenciasLikeStore } from '@app/stores/sugerenciasLikeStore';
import { useNavigationStore } from '@/core/router';
import { darLike } from '@app/services/apiSocial';
import type { TipoReaccion } from '@app/types';
import '../../styles/componentes/modalSugerenciasLike.css';
import { BotonBase } from '../ui/BotonBase';
import { useT } from '@app/utils/i18n/useT';

export const ModalSugerenciasLike = (): JSX.Element | null => {
    const abierto = useSugerenciasLikeStore(s => s.abierto);
    const sampleOrigen = useSugerenciasLikeStore(s => s.sampleOrigen);
    const sugerencias = useSugerenciasLikeStore(s => s.sugerencias);
    const cargando = useSugerenciasLikeStore(s => s.cargando);
    const cerrar = useSugerenciasLikeStore(s => s.cerrar);
    const navegar = useNavigationStore(s => s.navegar);

    const manejarLikeSugerencia = useCallback(async (sampleId: number, reaccion?: TipoReaccion) => {
        await darLike('sample', sampleId, reaccion ?? 'like');
    }, []);

    const { t } = useT();

    if (!abierto) return null;

    return (
        <Modal abierto={abierto} onCerrar={cerrar} titulo="" tamano="pequeno">
            <div className="sugerenciasLikeContenedor">
                <div className="sugerenciasLikeHeader">
                    <div className="sugerenciasLikeIcono">
                        <Sparkles size={20} />
                    </div>
                    <h3 className="sugerenciasLikeTitulo">{t('sugerencias.titulo')}</h3>
                    {sampleOrigen && (
                        <p className="sugerenciasLikeSubtitulo">
                            Basado en tu like a &ldquo;{sampleOrigen.titulo}&rdquo;
                        </p>
                    )}
                    <BotonBase variante="ghost"
                        className="sugerenciasLikeCerrar"
                        onClick={cerrar}
                        type="button"
                        aria-label={t('sugerencias.cerrar')}
                    >
                        <X size={16} />
                    </BotonBase>
                </div>

                <div className="sugerenciasLikeLista">
                    {cargando ? (
                        <div className="sugerenciasLikeCargando">
                            <p>{t('sugerencias.cargandoSimilares')}</p>
                        </div>
                    ) : sugerencias.length === 0 ? (
                        <div className="sugerenciasLikeVacio">
                            <p>{t('sugerencias.sinSimilares')}</p>
                        </div>
                    ) : (
                        sugerencias.map((s) => (
                            <TarjetaSample
                                key={s.id}
                                sample={s}
                                contexto={sugerencias}
                                onLike={manejarLikeSugerencia}
                                onClickCreador={(u) => { cerrar(); navegar(`/perfil/${u}`); }}
                                className="sugerenciasLikeTarjeta"
                            />
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ModalSugerenciasLike;
