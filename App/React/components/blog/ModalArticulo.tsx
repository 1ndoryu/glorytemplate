/*
 * Componente: ModalArticulo — Kamples (183A-109 Fase 3 + 183A-110-C)
 * Editor de artículos del blog con rich text (contentEditable).
 * [183A-110-C] Sin cabecera, modal más ancho, categoría tipo editarGrupo,
 * botón adjuntar sample/colección, descarga pública por adjunto,
 * adjuntos se renderizan como tarjeta sample / coleccionHeader.
 */

import {
    Bold, Italic, Heading2, Heading3, Image, Link, Code, Quote,
    List, ListOrdered, X, Upload, Eye, FileText, Paperclip,
} from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Input } from '@app/components/ui/Input';
import { SelectorMenu, type OpcionSelector } from '@app/components/ui/SelectorMenu';
import { Textarea } from '@app/components/ui/Textarea';
import { ModalAdjuntarContenido } from '@app/components/blog/ModalAdjuntarContenido';
import { ListaAdjuntos } from '@app/components/blog/ListaAdjuntos';
import { useArticuloEditorStore } from '@app/stores/articuloEditorStore';
import { useAuthStore } from '@app/stores/authStore';
import { useEditorArticulo } from '@app/hooks/useEditorArticulo';
import { obtenerEtiquetaCategoria } from '@app/components/blog/TarjetaArticulo';
import type { CategoriaArticulo } from '@app/types';
import '@app/styles/componentes/modalArticulo.css';

/* Opciones planas para SelectorMenu — mismas categorías que BlogIsland */
const OPCIONES_CATEGORIA: OpcionSelector[] = [
    'inspiracion', 'mastering', 'mezcla', 'promocion-musical',
    'teoria-musical', 'grabacion', 'sampling', 'diseno-sonoro', 'herramientas',
    'ableton-live', 'bitwig-studio', 'cubase', 'fl-studio',
    'garageband', 'logic-pro', 'pro-tools', 'studio-one',
    'drops-gratis', 'midi-gratis', 'plugins-gratis',
    'presets-gratis', 'proyectos-gratis', 'sonidos-gratis',
    'entrevistas', 'destacados', 'noticias',
].map(cat => ({ valor: cat, etiqueta: obtenerEtiquetaCategoria(cat as CategoriaArticulo) }));

const OPCIONES_ESTADO: OpcionSelector[] = [
    { valor: 'publicado', etiqueta: 'Publicar' },
    { valor: 'borrador', etiqueta: 'Guardar borrador' },
];

export const ModalArticulo = (): JSX.Element | null => {
    const abierto = useArticuloEditorStore(s => s.abierto);
    const cerrar = useArticuloEditorStore(s => s.cerrar);
    const autenticado = useAuthStore(s => s.autenticado);

    if (!abierto || !autenticado) return null;

    /* [183A-110-C] Sin titulo (sin cabecera), modal más ancho */
    return (
        <Modal abierto={abierto} onCerrar={cerrar} tamano="grande" className="editorArticuloModal">
            <ContenidoEditor />
        </Modal>
    );
};

/* Componente interno para aislar hooks del contenido editable */
const ContenidoEditor = (): JSX.Element => {
    const {
        titulo, contenido, extracto, categoria, estado, portadaPreviewUrl,
        vistaHtml, publicando, editandoId, adjuntos,
        modalAdjuntarAbierto,
        setTitulo, setContenido, setExtracto, setCategoria, setEstado,
        toggleVistaHtml, agregarAdjunto, quitarAdjunto,
        toggleDescargaAdjunto, setModalAdjuntar,
        editorRef, inputPortadaRef,
        publicar, seleccionarPortada, manejarPortada, formatear, insertarImagen,
        setPortada,
    } = useEditorArticulo();

    return (
        <div className="editorArticuloContenedor">
            {/* [183A-110-D] Sin botón X — el modal se cierra con click fuera o Escape */}

            {/* Título */}
            <Input
                className="editorArticuloTitulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título del artículo"
                maxLength={200}
            />

            {/* [193A-corrección] Ambos selectores usan SelectorMenu (igual que edición de samples) */}
            <div className="editorArticuloCamposGrupo">
                <SelectorMenu
                    etiqueta="Categoría"
                    opciones={OPCIONES_CATEGORIA}
                    valor={categoria}
                    onChange={(v) => setCategoria(v as CategoriaArticulo)}
                />
                <SelectorMenu
                    etiqueta="Estado"
                    opciones={OPCIONES_ESTADO}
                    valor={estado}
                    onChange={(v) => setEstado(v as 'borrador' | 'publicado')}
                />
            </div>

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

            {/* Toolbar — [183A-110-C] Botón adjuntar sample/colección añadido */}
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
                <div className="editorArticuloToolbarSeparador" />
                <BotonBase
                    variante="ghost" tamano="sm" soloIcono
                    onClick={() => setModalAdjuntar(true)}
                    aria-label="Adjuntar sample o colección"
                >
                    <Paperclip size={16} />
                </BotonBase>
            </div>

            {/* Área de contenido */}
            {/* [193A-8] dangerouslySetInnerHTML eliminado para evitar reset del cursor.
             * El contenido se inicializa via ref en useEditorArticulo. */}
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

            {/* [183A-110-C] Adjuntos — samples como tarjeta, colecciones como header */}
            <ListaAdjuntos
                adjuntos={adjuntos}
                onQuitar={quitarAdjunto}
                onToggleDescarga={toggleDescargaAdjunto}
            />

            {/* Footer con botón de publicar */}
            <div className="editorArticuloFooter">
                <div className="editorArticuloFooterIzq" />
                <BotonBase
                    variante="primario"
                    tamano="md"
                    onClick={publicar}
                    cargando={publicando}
                >
                    {editandoId
                        ? 'Actualizar artículo'
                        : estado === 'borrador' ? 'Guardar borrador' : 'Publicar artículo'}
                </BotonBase>
            </div>

            {/* [183A-110-C] Modal de adjuntar contenido (samples/colecciones) */}
            <ModalAdjuntarContenido
                abierto={modalAdjuntarAbierto}
                onCerrar={() => setModalAdjuntar(false)}
                adjuntosActuales={adjuntos}
                onAdjuntar={agregarAdjunto}
            />
        </div>
    );
};

export default ModalArticulo;
