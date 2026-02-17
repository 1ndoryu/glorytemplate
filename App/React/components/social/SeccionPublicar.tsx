/*
 * Componente: SeccionPublicar — Kamples (C89)
 * Sección inline para crear publicaciones, estilo red social.
 * Reemplaza ModalPublicar en ComunidadIsland y PerfilIsland.
 * Usa usePublicar para la lógica, este componente es solo vista.
 */

import { Image, X } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { usePublicar, MAX_IMAGENES } from '@app/hooks/usePublicar';
import { useAuthStore } from '@app/stores/authStore';
import '@app/styles/componentes/seccionPublicar.css';

interface SeccionPublicarProps {
    alPublicar?: () => void;
    placeholder?: string;
}

export const SeccionPublicar = ({ alPublicar, placeholder }: SeccionPublicarProps): JSX.Element | null => {
    const { usuario, autenticado } = useAuthStore();

    const {
        contenido,
        imagenes,
        publicando,
        caracteresPendientes,
        puedePublicar,
        inputImagenRef,
        textareaRef,
        manejarCambioTexto,
        manejarKeyDown,
        manejarSeleccionImagenes,
        quitarImagen,
        publicar,
    } = usePublicar({ modo: 'social', alPublicar });

    if (!autenticado) return null;

    return (
        <div className="seccionPublicar">
            <div className="seccionPublicarInterna">
                {/* Avatar del usuario */}
                <div className="seccionPublicarAvatar">
                    <Avatar
                        src={usuario?.avatarUrl ?? null}
                        nombre={usuario?.nombreVisible ?? ''}
                        tamano="md"
                    />
                </div>

                {/* Área de contenido */}
                <div className="seccionPublicarCuerpo">
                    <textarea
                        ref={textareaRef}
                        className="seccionPublicarTextarea"
                        placeholder={placeholder ?? '¿Qué estás creando?'}
                        value={contenido}
                        onChange={manejarCambioTexto}
                        onKeyDown={manejarKeyDown}
                        rows={1}
                    />

                    {/* Preview de imágenes */}
                    {imagenes.length > 0 && (
                        <div className={`publicarImagenes publicarImagenes${imagenes.length}`}>
                            {imagenes.map((img, i) => (
                                <div className="publicarImagenItem" key={img.url}>
                                    <img src={img.url} alt={`Imagen ${i + 1}`} />
                                    <button
                                        className="publicarImagenQuitar"
                                        onClick={() => quitarImagen(i)}
                                        type="button"
                                        aria-label="Quitar imagen"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Barra de acciones */}
                    <div className="seccionPublicarAcciones">
                        <div className="seccionPublicarAccionesIzq">
                            <BotonBase
                                variante="ghost"
                                tamano="sm"
                                onClick={() => inputImagenRef.current?.click()}
                                type="button"
                                aria-label="Añadir imagen"
                                disabled={imagenes.length >= MAX_IMAGENES}
                            >
                                <Image size={16} />
                                {imagenes.length > 0 && (
                                    <Badge variante="neutro" tamano="xs">
                                        {imagenes.length}/{MAX_IMAGENES}
                                    </Badge>
                                )}
                            </BotonBase>
                        </div>

                        <div className="seccionPublicarAccionesDer">
                            {contenido.length > 0 && (
                                <span className={`publicarContador ${caracteresPendientes < 50 ? 'publicarContadorAlerta' : ''}`}>
                                    {caracteresPendientes}
                                </span>
                            )}
                            <BotonBase
                                variante="primario"
                                tamano="sm"
                                onClick={publicar}
                                disabled={!puedePublicar}
                            >
                                {publicando ? 'Publicando...' : 'Publicar'}
                            </BotonBase>
                        </div>
                    </div>
                </div>
            </div>

            {/* Input oculto para imágenes */}
            <input
                ref={inputImagenRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={manejarSeleccionImagenes}
            />
        </div>
    );
};

export default SeccionPublicar;
