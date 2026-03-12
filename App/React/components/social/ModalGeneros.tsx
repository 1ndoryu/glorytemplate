/*
 * Componente: ModalGeneros — Kamples (QQ45)
 * Modal de seleccion de generos favoritos.
 * Se muestra en onboarding para usuarios nuevos y desde configuracion.
 * Permite seleccionar generos predefinidos y agregar tags personalizados.
 */

import { useEffect, type KeyboardEvent } from 'react';
import { Modal } from '../ui/Modal';
import { BotonBase } from '../ui/BotonBase';
import { Plus } from 'lucide-react';
import { useModalGeneros, GENEROS_DISPONIBLES } from '@app/hooks/useModalGeneros';
import '../../styles/componentes/modalGeneros.css';

export const ModalGeneros = (): JSX.Element => {
    const {
        abierto,
        seleccionados,
        guardando,
        puedeGuardar,
        toggleGenero,
        agregarPersonalizado,
        tagPersonalizado,
        setTagPersonalizado,
        guardar,
        cerrar,
        sincronizar,
        limiteAlcanzado,
    } = useModalGeneros();

    /* Sincronizar seleccion al abrir el modal */
    useEffect(() => {
        if (abierto) sincronizar();
    }, [abierto, sincronizar]);

    const manejarKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            agregarPersonalizado();
        }
    };

    /* Tags personalizados: los que están seleccionados pero no son predefinidos */
    const generosDisponiblesLower = GENEROS_DISPONIBLES.map((g) => g.toLowerCase());
    const tagsPersonalizados = seleccionados.filter(
        (s) => !generosDisponiblesLower.includes(s)
    );

    return (
        <Modal abierto={abierto} onCerrar={cerrar} tamano="grande">
            <div className="generosContenido">
                <h2 className="generosTitulo">
                    ¿Cuáles son tus géneros favoritos?
                </h2>
                <p className="generosSubtitulo">
                    Elige al menos 1 género para personalizar tu feed. Puedes cambiarlo después.
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

                    {/* Tags personalizados ya agregados */}
                    {tagsPersonalizados.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            className="generosBadge generosBadgeActivo generosBadgeCustom"
                            onClick={() => toggleGenero(tag)}
                        >
                            {tag}
                        </button>
                    ))}

                    {/* Input inline para agregar tag personalizado */}
                    {!limiteAlcanzado && (
                        <span className="generosInputInline">
                            <Plus size={14} />
                            <input
                                type="text"
                                className="generosInputCustom"
                                placeholder="Agregar personalizado"
                                value={tagPersonalizado}
                                onChange={(e) => setTagPersonalizado(e.target.value)}
                                onKeyDown={manejarKeyDown}
                                maxLength={30}
                            />
                        </span>
                    )}
                </div>

                <div className="generosAcciones">
                    <span className="generosContador">
                        {seleccionados.length}/10 seleccionado{seleccionados.length !== 1 ? 's' : ''}
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
