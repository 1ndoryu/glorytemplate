/*
 * ModalCodigoExpirado — Kamples (183A-110)
 * Modal que aparece cuando un usuario intenta reclamar un codigo de descarga gratis
 * que ya venció (1 año de vida). El backend agrega 50 créditos de compensación.
 * Se muestra automáticamente al autenticarse si había un código pendiente expirado.
 *
 * Gotcha: sin título/cabecera intencionalmente (per spec 183A-110).
 * TODO: Un humano debe testear como se ve este modal en produccion antes de
 *   considerarlo finalizado — especialmente el botón de recomendaciones y el texto.
 * Gotcha: usa useNavigationStore para navegar sin recargar la página.
 */

import { useCodigoGratisStore } from '@app/stores/codigoGratisStore';
import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useNavigationStore } from '@/core/router/navigationStore';
import '../styles/componentes/modalCodigoExpirado.css';

export const ModalCodigoExpirado = (): JSX.Element | null => {
    const infoExpirado = useCodigoGratisStore((s) => s.infoExpirado);
    const limpiarExpirado = useCodigoGratisStore((s) => s.limpiarExpirado);
    const navegar = useNavigationStore((s) => s.navegar);

    if (!infoExpirado) return null;

    const manejarVerRecomendaciones = () => {
        limpiarExpirado();
        const busqueda = infoExpirado.nombreItem
            ? `?buscar=${encodeURIComponent(infoExpirado.nombreItem)}`
            : '';
        navegar(`/descubrir/${busqueda}`);
    };

    return (
        <Modal abierto onCerrar={limpiarExpirado} tamano="pequeno">
            <div className="modalCodigoExpiradoCuerpo">
                <p className="modalCodigoExpiradoTexto">
                    Lo siento, el contenido que intentas descargar es antiguo, y hace tiempo que se
                    eliminó por alguna extraña razón, pero <strong>recibiste 50 créditos gratis de
                    compensación</strong>.
                </p>
                {infoExpirado.nombreItem && (
                    <p className="modalCodigoExpiradoNombre">
                        Estabas buscando: <em>{infoExpirado.nombreItem}</em>
                    </p>
                )}
                <div className="modalCodigoExpiradoAcciones">
                    <BotonBase
                        variante="primario"
                        onClick={manejarVerRecomendaciones}
                    >
                        Ver recomendaciones
                    </BotonBase>
                    <BotonBase
                        variante="secundario"
                        onClick={limpiarExpirado}
                    >
                        Cerrar
                    </BotonBase>
                </div>
            </div>
        </Modal>
    );
};
