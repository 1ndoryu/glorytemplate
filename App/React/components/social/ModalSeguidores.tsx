/*
 * Componente: ModalSeguidores — Kamples (QQ32)
 * Modal con lista paginada de seguidores de un perfil.
 * Scroll infinito + botón seguir/dejar de seguir inline.
 */

import { useCallback, useRef } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { Avatar } from '@app/components/ui/Avatar';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useModalSeguidores } from '@app/hooks/useModalSeguidores';
import { useNavigationStore } from '@/core/router';
import { useAuthStore } from '@app/stores/authStore';
import { useT } from '@app/utils/i18n/useT';
import '../../styles/componentes/modalSeguidores.css';

export const ModalSeguidores = (): JSX.Element | null => {
    const { abierto, seguidores, total, cargando, hayMas, cargarMas, toggleFollow, cerrar } = useModalSeguidores();
    const navegar = useNavigationStore(s => s.navegar);
    const miId = useAuthStore(s => s.usuario?.id);
    const listaRef = useRef<HTMLDivElement>(null);
    const { t } = useT();

    const onScroll = useCallback(() => {
        const el = listaRef.current;
        if (!el || cargando || !hayMas) return;
        /* Cargar mas al llegar a 100px del final */
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
            void cargarMas();
        }
    }, [cargando, hayMas, cargarMas]);

    if (!abierto) return null;

    return (
        <Modal abierto={abierto} onCerrar={cerrar} titulo={t('seguidores.titulo').replace('{total}', String(total))} tamano="pequeno" className="modalSeguidores">
            <div className="seguidoresLista" ref={listaRef} onScroll={onScroll}>
                {seguidores.length === 0 && !cargando && (
                    <div className="seguidoresVacio">
                        <Users size={32} />
                        <p>{t('seguidores.sinSeguidores')}</p>
                    </div>
                )}

                {seguidores.map(s => (
                    <div key={s.id} className="seguidoresItem">
                        <div
                            className="seguidoresItemInfo"
                            onClick={() => { cerrar(); navegar(`/perfil/${s.username}/`); }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') { cerrar(); navegar(`/perfil/${s.username}/`); } }}
                        >
                            <Avatar src={s.avatarUrl} nombre={s.nombreVisible} tamano="md" />
                            <div className="seguidoresItemTexto">
                                <span className="seguidoresItemNombre">{s.nombreVisible}</span>
                                <span className="seguidoresItemUsername">@{s.username}</span>
                            </div>
                        </div>

                        {miId !== s.id && (
                            <BotonBase
                                variante={s.siguiendo ? 'secundario' : 'primario'}
                                tamano="sm"
                                onClick={() => toggleFollow(s.id)}
                            >
                                {s.siguiendo ? t('seguidores.siguiendo') : t('seguidores.seguir')}
                            </BotonBase>
                        )}
                    </div>
                ))}

                {cargando && (
                    <div className="seguidoresCargando">
                        <Loader2 size={20} className="adminSpinner" />
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ModalSeguidores;
