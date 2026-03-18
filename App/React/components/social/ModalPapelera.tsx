/*
 * Componente: ModalPapelera — Kamples (QQ57)
 * Modal grande que lista los items eliminados del usuario (samples + publicaciones).
 * Cada item muestra días restantes antes de la purga definitiva y botón de restaurar.
 */

import { Trash2, Music, FileText, RotateCcw, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { BotonBase } from '../ui/BotonBase';
import { usePapelera } from '@app/hooks/usePapelera';
import type { ItemPapelera } from '@app/stores/papeleraStore';
import '../../styles/componentes/modalPapelera.css';

/* Determina la clase CSS según urgencia de días restantes */
const claseDias = (dias: number): string => {
    if (dias <= 3) return 'papeleraDias papeleraDiasCritico';
    if (dias <= 7) return 'papeleraDias papeleraDiasAdvertencia';
    return 'papeleraDias papeleraDiasNormal';
};

/* Icono según tipo de item */
const iconoTipo = (tipo: ItemPapelera['tipo']): JSX.Element => {
    if (tipo === 'sample') return <Music size={20} className="papeleraItemIcono" />;
    return <FileText size={20} className="papeleraItemIcono" />;
};

/* Skeleton de carga */
const SkeletonPapelera = (): JSX.Element => (
    <div className="papeleraLista">
        {[1, 2, 3].map(i => (
            <div key={i} className="papeleraSkeletonItem">
                <div className="papeleraSkeletonThumb" />
                <div className="papeleraSkeletonInfo">
                    <div className="papeleraSkeletonLinea papeleraSkeletonLineaCorta" />
                    <div className="papeleraSkeletonLinea papeleraSkeletonLineaLarga" />
                </div>
            </div>
        ))}
    </div>
);

/* Fila individual de item en papelera */
const FilaPapelera = ({
    item,
    restaurando,
    onRestaurar,
}: {
    item: ItemPapelera;
    restaurando: boolean;
    onRestaurar: () => void;
}): JSX.Element => (
    <div className="papeleraItem">
        <div className="papeleraItemImagen">
            {item.imagenUrl ? (
                <img src={item.imagenUrl} alt={item.titulo} />
            ) : (
                iconoTipo(item.tipo)
            )}
        </div>

        <div className="papeleraItemInfo">
            <p className="papeleraItemTitulo">{item.titulo}</p>
            <div className="papeleraItemMeta">
                <span className="papeleraItemTipo">{item.tipo}</span>
                <span className={claseDias(item.diasRestantes)}>
                    {item.diasRestantes} {item.diasRestantes === 1 ? 'día' : 'días'}
                </span>
            </div>
        </div>

        <div className="papeleraItemAccion">
            <BotonBase
                variante="secundario"
                onClick={onRestaurar}
                disabled={restaurando}
                aria-label={`Restaurar ${item.titulo}`}
            >
                {restaurando ? (
                    <Loader2 size={14} style={{ animation: 'girar 1s linear infinite' }} />
                ) : (
                    <RotateCcw size={14} />
                )}
                Restaurar
            </BotonBase>
        </div>
    </div>
);

export const ModalPapelera = (): JSX.Element | null => {
    const { abierto, items, cargando, restaurandoIds, cerrar, restaurar } = usePapelera();

    if (!abierto) return null;

    return (
        <Modal
            abierto={abierto}
            onCerrar={cerrar}
            tamano="grande"
        >
            <div className="papeleraContenido">
                <p className="papeleraInfo">
                    Los items eliminados se conservan por 30 días. Después se eliminan permanentemente.
                </p>

                {cargando ? (
                    <SkeletonPapelera />
                ) : items.length === 0 ? (
                    <div className="papeleraVacio">
                        <Trash2 size={48} className="papeleraVacioIcono" />
                        <p className="papeleraVacioTexto">Tu papelera está vacía</p>
                    </div>
                ) : (
                    <div className="papeleraLista">
                        {items.map((item) => (
                            <FilaPapelera
                                key={`${item.tipo}-${item.id}`}
                                item={item}
                                restaurando={restaurandoIds.has(item.id)}
                                onRestaurar={() => restaurar(item.tipo, item.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ModalPapelera;
