/*
 * Componente: ModalCompra — Kamples (QQ60)
 * Modal minimalista de confirmacion de compra de sample.
 * Muestra portada, titulo, creador, precio y boton para ir a Stripe Checkout.
 */

import { Music, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { BotonBase } from '../ui/BotonBase';
import { useModalCompra } from '@app/hooks/useModalCompra';
import '../../styles/componentes/modalCompra.css';

export const ModalCompra = (): JSX.Element | null => {
    const { abierto, sample, procesando, confirmarCompra, cerrar } = useModalCompra();

    if (!abierto || !sample) return null;

    const precio = sample.precio ?? 0;

    return (
        <Modal
            abierto={abierto}
            onCerrar={cerrar}
            tamano="pequeno"
        >
            <div className="compraContenido">
                <div className="compraPortada">
                    {sample.imagenUrl ? (
                        <img src={sample.imagenUrl} alt={sample.titulo} />
                    ) : (
                        <Music size={40} className="compraPortadaIcono" />
                    )}
                </div>

                <div className="compraInfo">
                    <h3 className="compraTitulo">{sample.titulo}</h3>
                    {sample.creador && (
                        <span className="compraCreador">
                            por {sample.creador.nombreVisible ?? sample.creador.username}
                        </span>
                    )}
                    <span className="compraPrecio">${precio.toFixed(2)}</span>
                </div>

                <p className="compraDetalle">
                    Al confirmar serás redirigido a Stripe para completar el pago de forma segura.
                    Una vez completado, el sample estará disponible en tus descargas.
                </p>

                <div className="compraAcciones">
                    <BotonBase
                        variante="secundario"
                        onClick={cerrar}
                        disabled={procesando}
                    >
                        Cancelar
                    </BotonBase>
                    <BotonBase
                        variante="primario"
                        className="compraBotonConfirmar"
                        onClick={confirmarCompra}
                        disabled={procesando}
                    >
                        {procesando ? (
                            <><Loader2 size={16} style={{ animation: 'girar 1s linear infinite' }} /> Procesando...</>
                        ) : (
                            `Comprar $${precio.toFixed(2)}`
                        )}
                    </BotonBase>
                </div>
            </div>
        </Modal>
    );
};
