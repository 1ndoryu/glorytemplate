/*
 * Componente: ModalPublicar — Kamples
 * Modal para crear publicaciones sociales o compartir samples.
 * Modo dual: 'social' (texto + imágenes) o 'sample' (texto + samples adjuntos).
 * Nota: En ComunidadIsland y PerfilIsland se usa SeccionPublicar (inline) en su lugar (C89).
 * Este modal se mantiene para uso global desde LayoutPrincipal.
 */

import { Image, Music, X } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Avatar } from '@app/components/ui/Avatar';
import { Badge } from '@app/components/ui/Badge';
import { usePublicar, MAX_IMAGENES } from '@app/hooks/usePublicar';
import { usePublicarModalStore } from '@app/stores/publicarModalStore';
import { useAuthStore } from '@app/stores/authStore';
import '../../styles/componentes/modalPublicar.css';

export const ModalPublicar = (): JSX.Element | null => {
    const { abierto, modo, cerrar } = usePublicarModalStore();
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
        limpiar,
    } = usePublicar({ modo, alPublicar: cerrar });

    const manejarCerrar = () => {
        limpiar();
        cerrar();
    };

    if (!abierto) return null;

    return (
        <Modal abierto={abierto} onCerrar={manejarCerrar} titulo="Crear publicación" tamano="normal">
            <div className="publicarContenido">
                {!autenticado ? (
                    <div className="publicarAuthAviso">
                        <p>Inicia sesión para publicar</p>
                    </div>
                ) : (
                    <>
                        {/* Header con avatar */}
                        <div className="publicarCabecera">
                            <Avatar
                                src={usuario?.avatarUrl ?? null}
                                nombre={usuario?.nombreVisible ?? ''}
                                tamano="md"
                            />
                            <span className="publicarUsuarioNombre">{usuario?.nombreVisible ?? usuario?.username}</span>
                        </div>

                        {/* Textarea */}
                        <textarea
                            ref={textareaRef}
                            className="publicarTextarea"
                            placeholder={
                                modo === 'social'
                                    ? '¿Qué estás creando?'
                                    : 'Comparte tu sample con la comunidad...'
                            }
                            value={contenido}
                            onChange={manejarCambioTexto}
                            onKeyDown={manejarKeyDown}
                            rows={3}
                            autoFocus
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
                        <div className="publicarAcciones">
                            <div className="publicarAccionesIzquierda">
                                {modo === 'social' && (
                                    <BotonBase
                                        variante="ghost"
                                        tamano="sm"
                                        onClick={() => inputImagenRef.current?.click()}
                                        type="button"
                                        aria-label="Añadir imagen"
                                        disabled={imagenes.length >= MAX_IMAGENES}
                                    >
                                        <Image size={18} />
                                        {imagenes.length > 0 && (
                                            <Badge variante="neutro" tamano="xs">
                                                {imagenes.length}/{MAX_IMAGENES}
                                            </Badge>
                                        )}
                                    </BotonBase>
                                )}
                                {modo === 'sample' && (
                                    <BotonBase
                                        variante="ghost"
                                        tamano="sm"
                                        type="button"
                                        aria-label="Adjuntar sample"
                                    >
                                        <Music size={18} />
                                        Adjuntar sample
                                    </BotonBase>
                                )}
                            </div>

                            <div className="publicarAccionesDerecha">
                                <span
                                    className={`publicarContador ${caracteresPendientes < 50 ? 'publicarContadorAlerta' : ''}`}
                                >
                                    {caracteresPendientes}
                                </span>
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

                        {/* Input oculto para imágenes */}
                        <input
                            ref={inputImagenRef}
                            type="file"
                            accept="image/*"
                            multiple
                            hidden
                            onChange={manejarSeleccionImagenes}
                        />
                    </>
                )}
            </div>
        </Modal>
    );
};

export default ModalPublicar;
