/*
 * Sección Showcase: Modal, MenuContextual y Toasts.
 * Componentes de overlay del design system.
 */

import { useState } from 'react';
import {
    BotonBase,
    Modal,
    CampoTexto,
    MenuContextual,
} from '@app/components/ui';
import type { MenuItemDef } from '@app/components/ui';
import {
    Download,
    Share2,
    Trash2,
    Edit3,
} from 'lucide-react';

const ITEMS_MENU_DEMO: MenuItemDef[] = [
    { id: 'editar', etiqueta: 'Editar', icono: <Edit3 size={14} />, onClick: () => {} },
    { id: 'descargar', etiqueta: 'Descargar', icono: <Download size={14} />, onClick: () => {} },
    { id: 'compartir', etiqueta: 'Compartir', icono: <Share2 size={14} />, separadorDespues: true, onClick: () => {} },
    { id: 'eliminar', etiqueta: 'Eliminar', icono: <Trash2 size={14} />, peligro: true, onClick: () => {} },
];

interface Props {
    onToast: (tipo: 'exito' | 'error' | 'advertencia' | 'info') => void;
}

export const ShowcaseOverlays = ({ onToast }: Props): JSX.Element => {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
    const [menuAbierto, setMenuAbierto] = useState(false);

    const abrirMenuContextual = (e: React.MouseEvent) => {
        e.preventDefault();
        setMenuPos({ x: e.clientX, y: e.clientY });
        setMenuAbierto(true);
    };

    return (
        <>
            {/* Modal */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">Modal</h2>
                <p className="showcaseSeccionDesc">Con portal, cierre por Escape y click overlay. 3 tamaños.</p>

                <div className="showcaseFila">
                    <BotonBase onClick={() => setModalAbierto(true)}>
                        Abrir Modal
                    </BotonBase>
                </div>

                <Modal
                    abierto={modalAbierto}
                    onCerrar={() => setModalAbierto(false)}
                    titulo="Modal de ejemplo"
                    pie={
                        <div className="showcaseFila">
                            <BotonBase variante="ghost" onClick={() => setModalAbierto(false)}>
                                Cancelar
                            </BotonBase>
                            <BotonBase onClick={() => setModalAbierto(false)}>
                                Confirmar
                            </BotonBase>
                        </div>
                    }
                >
                    <p className="showcaseTextoSecundario">
                        Este es el contenido del modal. Soporta cualquier JSX como hijos.
                        Presiona Escape o haz click fuera para cerrar.
                    </p>
                    <div className="showcaseMargenSuperior">
                        <CampoTexto etiqueta="Nombre del pack" placeholder="Mi pack de samples" />
                    </div>
                </Modal>
            </section>

            {/* Menu contextual */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">MenuContextual</h2>
                <p className="showcaseSeccionDesc">Menú posicionado por coordenadas. Click derecho para probar.</p>

                <div
                    className="showcaseModalPreview showcaseZonaMenuContextual"
                    onContextMenu={abrirMenuContextual}
                >
                    <p className="showcaseTextoSecundario">
                        Click derecho aquí para ver el menú contextual
                    </p>
                </div>

                <MenuContextual
                    abierto={menuAbierto}
                    onCerrar={() => setMenuAbierto(false)}
                    items={ITEMS_MENU_DEMO}
                    x={menuPos.x}
                    y={menuPos.y}
                />
            </section>

            {/* Toasts */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">Notificaciones (Toast)</h2>
                <p className="showcaseSeccionDesc">4 tipos de toast con auto-dismiss.</p>

                <div className="showcaseFila">
                    <BotonBase variante="primario" tamano="sm" onClick={() => onToast('exito')}>
                        Toast éxito
                    </BotonBase>
                    <BotonBase variante="peligro" tamano="sm" onClick={() => onToast('error')}>
                        Toast error
                    </BotonBase>
                    <BotonBase variante="secundario" tamano="sm" onClick={() => onToast('advertencia')}>
                        Toast advertencia
                    </BotonBase>
                    <BotonBase variante="ghost" tamano="sm" onClick={() => onToast('info')}>
                        Toast info
                    </BotonBase>
                </div>
            </section>
        </>
    );
};
