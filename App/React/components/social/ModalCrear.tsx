/*
 * Componente: ModalCrear — Kamples (C124)
 * Modal unificado para crear publicaciones y subir samples.
 * Cuando el contexto tiene relacionId sin ladoRelacion (L7.1), muestra un
 * paso previo de seleccion de lado antes de renderizar ContenidoCrear.
 */

import { Music } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { ContenidoCrear } from '@app/components/social/ContenidoCrear';
import { useCrearModalStore } from '@app/stores/crearModalStore';
import { useAuthStore } from '@app/stores/authStore';
import { useT } from '@app/utils/i18n/useT';
import type { LadoRelacion } from '@app/stores/crearModalStore';

/* Paso de seleccion de lado cuando el modal se abre sin lado pre-definido */
const SelectorLado = (): JSX.Element => {
    const ctx = useCrearModalStore(s => s.contextoAdjuntar);
    const seleccionarLado = useCrearModalStore(s => s.seleccionarLado);
    const { t } = useT();

    const elegir = (cancionId: number, lado: LadoRelacion) => {
        seleccionarLado(cancionId, lado);
    };

    return (
        <div className="selectorLadoModal">
            <div className="selectorLadoIcono"><Music size={20} /></div>
            <h3 className="selectorLadoTitulo">{t('crear.selectorLado.titulo')}</h3>
            <p className="selectorLadoDesc">{t('crear.selectorLado.desc')}</p>
            <div className="selectorLadoOpciones">
                {ctx?.ladoDestino && (
                    <BotonBase
                        variante="secundario"
                        className="selectorLadoBtn"
                        onClick={() => elegir(ctx.ladoDestino!.cancionId, 'destino')}
                    >
                        <strong className="selectorLadoBtnTitulo">{ctx.ladoDestino.titulo}</strong>
                        {ctx.ladoDestino.artista && (
                            <span className="selectorLadoBtnArtista">{ctx.ladoDestino.artista}</span>
                        )}
                    </BotonBase>
                )}
                {ctx?.ladoFuente && (
                    <BotonBase
                        variante="secundario"
                        className="selectorLadoBtn"
                        onClick={() => elegir(ctx.ladoFuente!.cancionId, 'fuente')}
                    >
                        <strong className="selectorLadoBtnTitulo">{ctx.ladoFuente.titulo}</strong>
                        {ctx.ladoFuente.artista && (
                            <span className="selectorLadoBtnArtista">{ctx.ladoFuente.artista}</span>
                        )}
                    </BotonBase>
                )}
            </div>
        </div>
    );
};

export const ModalCrear = (): JSX.Element | null => {
    const abierto = useCrearModalStore(s => s.abierto);
    const cerrar = useCrearModalStore(s => s.cerrar);
    const contexto = useCrearModalStore(s => s.contextoAdjuntar);
    const autenticado = useAuthStore(s => s.autenticado);

    if (!abierto || !autenticado) return null;

    /* Necesita seleccion de lado: hay relacionId pero aun no se eligio el lado */
    const necesitaLado = !!contexto?.relacionId && !contexto?.ladoRelacion;

    return (
        <Modal abierto={abierto} onCerrar={cerrar}>
            {necesitaLado ? <SelectorLado /> : <ContenidoCrear autoFocus alCompletarPublicacion={cerrar} />}
        </Modal>
    );
};

export default ModalCrear;
