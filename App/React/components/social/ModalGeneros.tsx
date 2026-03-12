/*
 * Componente: ModalGeneros — Kamples (QQ45)
 * Modal de seleccion de generos favoritos.
 * Se muestra en onboarding para usuarios nuevos y desde configuracion.
 */

import { useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { BotonBase } from '../ui/BotonBase';
import { useModalGeneros, GENEROS_DISPONIBLES } from '@app/hooks/useModalGeneros';
import '../../styles/componentes/modalGeneros.css';

export const ModalGeneros = (): JSX.Element => {
    const {
        abierto,
        seleccionados,
        guardando,
        puedeGuardar,
        toggleGenero,
        guardar,
        cerrar,
        sincronizar,
    } = useModalGeneros();

    /* Sincronizar seleccion al abrir el modal */
    useEffect(() => {
        if (abierto) sincronizar();
    }, [abierto, sincronizar]);

    return (
        <Modal abierto={abierto} onCerrar={cerrar} tamano="grande">
            <div className="generosContenido">
                <h2 className="generosTitulo">
                    Cuales son tus generos favoritos?
                </h2>
                <p className="generosSubtitulo">
                    Elige al menos 1 genero para personalizar tu feed. Puedes cambiarlo despues.
                </p>

                <div className="generosGrid">
                    {GENEROS_DISPONIBLES.map((genero) => {
                        const activo = seleccionados.includes(genero.toLowerCase());
                        return (
                            <button
                                key={genero}
                                type="button"
                                className={`generosBadge ${activo ? 'generosBadgeActivo' : ''}`}
                                onClick={() => toggleGenero(genero)}
                            >
                                {genero}
                            </button>
                        );
                    })}
                </div>

                <div className="generosAcciones">
                    <span className="generosContador">
                        {seleccionados.length} seleccionado{seleccionados.length !== 1 ? 's' : ''}
                    </span>
                    <BotonBase
                        variante="primario"
                        onClick={guardar}
                        disabled={!puedeGuardar}
                        cargando={guardando}
                    >
                        Guardar
                    </BotonBase>
                </div>
            </div>
        </Modal>
    );
};
