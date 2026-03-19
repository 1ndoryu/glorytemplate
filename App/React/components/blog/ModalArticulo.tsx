/*
 * Componente: ModalArticulo — Kamples (183A-109 Fase 3)
 * Editor de artículos del blog con rich text (contentEditable).
 * Toolbar con formato básico, selector de categoría, portada, extracto.
 * Usa articuloEditorStore para estado y useEditorArticulo para lógica.
 */

import {
    Bold, Italic, Heading2, Heading3, Image, Link, Code, Quote,
    List, ListOrdered, X, Upload, Eye, FileText, Check,
} from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Input } from '@app/components/ui/Input';
import { SelectorBase } from '@app/components/ui/SelectorBase';
import { Textarea } from '@app/components/ui/Textarea';
import { useArticuloEditorStore } from '@app/stores/articuloEditorStore';
import { useAuthStore } from '@app/stores/authStore';
import { useEditorArticulo } from '@app/hooks/useEditorArticulo';
import { obtenerEtiquetaCategoria } from '@app/components/blog/TarjetaArticulo';
import type { CategoriaArticulo } from '@app/types';
import '@app/styles/componentes/modalArticulo.css';

/* Grupos de categorías — mismos que BlogIsland */
const gruposCategorias: { grupo: string; categorias: CategoriaArticulo[] }[] = [
    {
        grupo: 'Tips',
        categorias: [
            'inspiracion', 'mastering', 'mezcla', 'promocion-musical',
            'teoria-musical', 'grabacion', 'sampling', 'diseno-sonoro', 'herramientas',
        ],
    },
    {
        grupo: 'DAWs',
        categorias: [
            'ableton-live', 'bitwig-studio', 'cubase', 'fl-studio',
            'garageband', 'logic-pro', 'pro-tools', 'studio-one',
        ],
    },
    {
        grupo: 'Gratis',
        categorias: [
            'drops-gratis', 'midi-gratis', 'plugins-gratis',
            'presets-gratis', 'proyectos-gratis', 'sonidos-gratis',
        ],
    },
    {
        grupo: 'Historias',
        categorias: ['entrevistas', 'destacados', 'noticias'],
    },
];

export const ModalArticulo = (): JSX.Element | null => {
    const abierto = useArticuloEditorStore(s => s.abierto);
    const cerrar = useArticuloEditorStore(s => s.cerrar);
    const autenticado = useAuthStore(s => s.autenticado);

    if (!abierto || !autenticado) return null;

    return (
        <Modal abierto={abierto} onCerrar={cerrar} titulo="Escribir artículo" tamano="grande">
            <ContenidoEditor />
        </Modal>
    );
};

/* Componente interno para aislar hooks del contenido editable */
const ContenidoEditor = (): JSX.Element => {
    const {
        titulo, contenido, extracto, categoria, portadaPreviewUrl,
        descargaPublica, vistaHtml, publicando, editandoId,
        setTitulo, setContenido, setExtracto, setCategoria,
        toggleDescargaPublica, toggleVistaHtml,
        editorRef, inputPortadaRef,
        publicar, seleccionarPortada, manejarPortada, formatear, insertarImagen,
        setPortada,
    } = useEditorArticulo();

    return (
        <div className="editorArticuloContenedor">
            {/* Título */}
            <Input
                className="editorArticuloTitulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título del artículo"
                maxLength={200}
            />

            {/* Selector de categoría */}
            <SelectorBase
                className="editorArticuloCategoriaSelect"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaArticulo)}
            >
                {gruposCategorias.map(g => (
                    <optgroup key={g.grupo} label={g.grupo}>
                        {g.categorias.map(cat => (
                            <option key={cat} value={cat}>
                                {obtenerEtiquetaCategoria(cat)}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </SelectorBase>

            {/* Portada */}
            <div className="editorArticuloPortada" onClick={seleccionarPortada}>
                {portadaPreviewUrl ? (
                    <>
                        <img
                            className="editorArticuloPortadaPreview"
                            src={portadaPreviewUrl}
                            alt="Portada del artículo"
                        />
                        <BotonBase
                            variante="ghost"
                            tamano="sm"
                            soloIcono
                            className="editorArticuloPortadaQuitar"
                            onClick={(e) => {
                                e.stopPropagation();
                                setPortada(null);
                            }}
                            aria-label="Quitar portada"
                        >
                            <X size={16} />
                        </BotonBase>
                    </>
                ) : (
                    <div className="editorArticuloPortadaVacia">
                        <Upload size={24} />
                        <span>Agregar portada (16:9)</span>
                    </div>
                )}
            </div>

            {/* Input oculto para portada */}
            {/* sentinel-disable-next-line html-nativo-en-vez-de-componente — Input file oculto, no visible en UI */}
            <input
                ref={inputPortadaRef}
                type="file"
                accept="image/*"
                onChange={manejarPortada}
                style={{ display: 'none' }}
            />

            {/* Toolbar */}
            <div className="editorArticuloToolbar">
                <BotonBase variante="ghost" tamano="sm" soloIcono onClick={() => formatear('bold')} aria-label="Negrita">
                    <Bold size={16} />
                </BotonBase>
                <BotonBase variante="ghost" tamano="sm" soloIcono onClick={() => formatear('italic')} aria-label="Cursiva">
                    <Italic size={16} />
                </BotonBase>
                <div className="editorArticuloToolbarSeparador" />
                <BotonBase variante="ghost" tamano="sm" soloIcono onClick={() => formatear('formatBlock', 'h2')} aria-label="Título H2">
                    <Heading2 size={16} />
                </BotonBase>
                <BotonBase variante="ghost" tamano="sm" soloIcono onClick={() => formatear('formatBlock', 'h3')} aria-label="Título H3">
                    <Heading3 size={16} />
                </BotonBase>
                <div className="editorArticuloToolbarSeparador" />
                <BotonBase variante="ghost" tamano="sm" soloIcono onClick={() => formatear('insertUnorderedList')} aria-label="Lista">
                    <List size={16} />
                </BotonBase>
                <BotonBase variante="ghost" tamano="sm" soloIcono onClick={() => formatear('insertOrderedList')} aria-label="Lista numerada">
                    <ListOrdered size={16} />
                </BotonBase>
                <BotonBase variante="ghost" tamano="sm" soloIcono onClick={() => formatear('formatBlock', 'blockquote')} aria-label="Cita">
                    <Quote size={16} />
                </BotonBase>
                <div className="editorArticuloToolbarSeparador" />
                <BotonBase variante="ghost" tamano="sm" soloIcono onClick={insertarImagen} aria-label="Insertar imagen">
                    <Image size={16} />
                </BotonBase>
                <BotonBase
                    variante="ghost" tamano="sm" soloIcono
                    onClick={() => {
                        const url = prompt('URL del enlace:');
                        if (url) formatear('createLink', url);
                    }}
                    aria-label="Insertar enlace"
                >
                    <Link size={16} />
                </BotonBase>
                <BotonBase variante="ghost" tamano="sm" soloIcono onClick={() => formatear('formatBlock', 'pre')} aria-label="Código">
                    <Code size={16} />
                </BotonBase>
                <div className="editorArticuloToolbarSeparador" />
                <BotonBase
                    variante={vistaHtml ? 'secundario' : 'ghost'}
                    tamano="sm"
                    soloIcono
                    onClick={toggleVistaHtml}
                    aria-label="Vista HTML"
                >
                    {vistaHtml ? <Eye size={16} /> : <FileText size={16} />}
                </BotonBase>
            </div>

            {/* Área de contenido */}
            {vistaHtml ? (
                <Textarea
                    className="editorArticuloHtml"
                    value={editorRef.current?.innerHTML ?? contenido}
                    onChange={(e) => setContenido(e.target.value)}
                    placeholder="<p>Escribe HTML aquí...</p>"
                />
            ) : (
                <div
                    ref={editorRef}
                    className="editorArticuloContenido"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => {
                        if (editorRef.current) {
                            setContenido(editorRef.current.innerHTML);
                        }
                    }}
                    dangerouslySetInnerHTML={{ __html: contenido }}
                />
            )}

            {/* Extracto */}
            <Textarea
                className="editorArticuloExtracto"
                value={extracto}
                onChange={(e) => setExtracto(e.target.value)}
                placeholder="Extracto breve (máx. 300 caracteres)"
                maxLength={300}
            />
            <div className={`editorArticuloCharCount ${extracto.length > 280 ? 'editorArticuloCharCountLimite' : ''}`}>
                {extracto.length}/300
            </div>

            {/* Opciones */}
            <div className="editorArticuloOpciones">
                <div className="editorArticuloToggle" onClick={toggleDescargaPublica}>
                    <div className={`editorArticuloToggleCheck ${descargaPublica ? 'editorArticuloToggleActivo' : ''}`}>
                        {descargaPublica && <Check size={12} />}
                    </div>
                    <span>Permitir descarga pública del contenido</span>
                </div>
            </div>

            {/* Footer con botón de publicar */}
            <div className="editorArticuloFooter">
                <div className="editorArticuloFooterIzq" />
                <BotonBase
                    variante="primario"
                    tamano="md"
                    onClick={publicar}
                    cargando={publicando}
                >
                    {editandoId ? 'Actualizar artículo' : 'Publicar artículo'}
                </BotonBase>
            </div>
        </div>
    );
};

export default ModalArticulo;
