/*
 * Componente: ModalPublicar — Kamples
 * Modal para crear publicaciones sociales o compartir samples.
 * Modo dual: 'social' (texto + imágenes) o 'sample' (texto + samples adjuntos).
 */

import { useState, useCallback, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { Image, Music, X } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Avatar } from '@app/components/ui/Avatar';
import { Badge } from '@app/components/ui/Badge';
import { usePublicarModalStore } from '@app/stores/publicarModalStore';
import { useAuthStore } from '@app/stores/authStore';
import { crearPublicacion } from '@app/services/apiSocial';
import { crearLogger } from '@app/services/logger';
import '../../styles/componentes/modalPublicar.css';

const log = crearLogger('ModalPublicar');

const MAX_CARACTERES = 500;
const MAX_IMAGENES = 4;

interface ImagenPreview {
    archivo: File;
    url: string;
}

export const ModalPublicar = (): JSX.Element | null => {
    const { abierto, modo, cerrar } = usePublicarModalStore();
    const { usuario, autenticado } = useAuthStore();

    const [contenido, setContenido] = useState('');
    const [imagenes, setImagenes] = useState<ImagenPreview[]>([]);
    const [publicando, setPublicando] = useState(false);
    const inputImagenRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    /* Limpiar estado al cerrar */
    const manejarCerrar = useCallback(() => {
        setContenido('');
        setImagenes([]);
        setPublicando(false);
        cerrar();
    }, [cerrar]);

    /* Auto-resize del textarea */
    const manejarCambioTexto = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
        const valor = e.target.value;
        if (valor.length <= MAX_CARACTERES) {
            setContenido(valor);
        }
        /* Auto-resize */
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, []);

    /* Detectar Ctrl+Enter para publicar */
    const manejarKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            manejarPublicar();
        }
    }, [contenido]);

    /* Seleccionar imágenes */
    const manejarSeleccionImagenes = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const archivos = Array.from(e.target.files ?? []);
        const disponibles = MAX_IMAGENES - imagenes.length;
        const nuevas: ImagenPreview[] = archivos.slice(0, disponibles).map((archivo) => ({
            archivo,
            url: URL.createObjectURL(archivo),
        }));

        setImagenes((prev) => [...prev, ...nuevas]);

        /* Resetear input para permitir seleccionar la misma imagen */
        if (inputImagenRef.current) {
            inputImagenRef.current.value = '';
        }
    }, [imagenes.length]);

    /* Quitar imagen */
    const quitarImagen = useCallback((indice: number) => {
        setImagenes((prev) => {
            const copia = [...prev];
            URL.revokeObjectURL(copia[indice].url);
            copia.splice(indice, 1);
            return copia;
        });
    }, []);

    /* Publicar */
    const manejarPublicar = useCallback(async () => {
        if (!contenido.trim() || publicando) return;

        setPublicando(true);
        try {
            await crearPublicacion({
                tipo: modo,
                contenido: contenido.trim(),
                imagenes: imagenes.map((img) => img.url),
            });
            log.info('Publicación creada', { modo, largo: contenido.length });
            manejarCerrar();
        } catch (err) {
            log.error('Error al publicar', err);
        } finally {
            setPublicando(false);
        }
    }, [contenido, modo, imagenes, publicando, manejarCerrar]);

    if (!abierto) return null;

    const caracteresPendientes = MAX_CARACTERES - contenido.length;
    const puedePublicar = contenido.trim().length > 0 && !publicando;

    return (
        <Modal abierto={abierto} onCerrar={manejarCerrar} titulo="Crear publicación" tamano="normal">
            <div className="publicarContenido">
                {!autenticado ? (
                    <div className="publicarAuthAviso">
                        <p>Inicia sesión para publicar</p>
                    </div>
                ) : (
                    <>
                        {/* Header con avatar y selector de modo */}
                        <div className="publicarCabecera">
                            <Avatar
                                src={usuario?.avatarUrl ?? null}
                                nombre={usuario?.nombreVisible ?? ''}
                                tamano="md"
                            />
                            <div className="publicarModos">
                                <Badge
                                    variante={modo === 'social' ? 'acento' : 'neutro'}
                                >
                                    Social
                                </Badge>
                                <Badge
                                    variante={modo === 'sample' ? 'acento' : 'neutro'}
                                >
                                    Sample
                                </Badge>
                            </div>
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
                                    <button
                                        className="publicarAccionBtn"
                                        onClick={() => inputImagenRef.current?.click()}
                                        type="button"
                                        aria-label="Añadir imagen"
                                        disabled={imagenes.length >= MAX_IMAGENES}
                                    >
                                        <Image size={18} />
                                        {imagenes.length > 0 && (
                                            <span className="publicarAccionContador">
                                                {imagenes.length}/{MAX_IMAGENES}
                                            </span>
                                        )}
                                    </button>
                                )}
                                {modo === 'sample' && (
                                    <button
                                        className="publicarAccionBtn"
                                        type="button"
                                        aria-label="Adjuntar sample"
                                    >
                                        <Music size={18} />
                                        <span className="publicarAccionLabel">Adjuntar sample</span>
                                    </button>
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
                                    onClick={manejarPublicar}
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
