/**
 * PageEditorIsland - Editor de pagina con Editor.js
 * Permite editar contenido de la pagina actual en modo bloques
 */

import {useState, useCallback} from 'react';
import {EditorJs, OutputData} from '../components/editor/EditorJs';
import {Save, Eye, EyeOff, X} from 'lucide-react';

interface PageEditorIslandProps {
    pageId?: number;
    initialData?: OutputData;
    apiEndpoint?: string;
}

export function PageEditorIsland({pageId, initialData, apiEndpoint = '/wp-json/glory/v1/page-content'}: PageEditorIslandProps): JSX.Element {
    const [editorData, setEditorData] = useState<OutputData | undefined>(initialData);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const manejarCambio = useCallback((data: OutputData) => {
        setEditorData(data);
        setSaveStatus('idle');
    }, []);

    const guardarContenido = useCallback(async () => {
        if (!editorData || !pageId) {
            console.warn('No hay datos o pageId para guardar');
            return;
        }

        setIsSaving(true);
        setSaveStatus('idle');

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pageId,
                    content: editorData
                })
            });

            if (response.ok) {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                setSaveStatus('error');
            }
        } catch (error) {
            console.error('Error guardando contenido:', error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    }, [editorData, pageId, apiEndpoint]);

    const renderizarPreview = useCallback(() => {
        if (!editorData?.blocks) return null;

        return editorData.blocks.map((block, index) => {
            switch (block.type) {
                case 'header':
                    const HeaderTag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
                    return <HeaderTag key={index} dangerouslySetInnerHTML={{__html: block.data.text}} />;

                case 'paragraph':
                    return <p key={index} dangerouslySetInnerHTML={{__html: block.data.text}} />;

                case 'list':
                    const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
                    return (
                        <ListTag key={index}>
                            {block.data.items.map((item: string, i: number) => (
                                <li key={i} dangerouslySetInnerHTML={{__html: item}} />
                            ))}
                        </ListTag>
                    );

                case 'quote':
                    return (
                        <blockquote key={index}>
                            <p dangerouslySetInnerHTML={{__html: block.data.text}} />
                            {block.data.caption && <cite>{block.data.caption}</cite>}
                        </blockquote>
                    );

                case 'delimiter':
                    return <hr key={index} />;

                default:
                    return null;
            }
        });
    }, [editorData]);

    return (
        <div id="page-editor-island" className="pagina-editor-contenedor">
            {/* Barra de herramientas */}
            <div id="editor-toolbar" className="editor-barra-herramientas">
                <div className="editor-barra-izquierda">
                    <span className="editor-titulo">Editor de Pagina</span>
                    {saveStatus === 'success' && <span className="editor-estado-exito">Guardado</span>}
                    {saveStatus === 'error' && <span className="editor-estado-error">Error al guardar</span>}
                </div>

                <div className="editor-barra-derecha">
                    <button type="button" onClick={() => setIsPreviewMode(!isPreviewMode)} className="editor-boton editor-boton-secundario" title={isPreviewMode ? 'Editar' : 'Vista previa'}>
                        {isPreviewMode ? <EyeOff size={18} /> : <Eye size={18} />}
                        <span>{isPreviewMode ? 'Editar' : 'Preview'}</span>
                    </button>

                    <button type="button" onClick={guardarContenido} disabled={isSaving} className="editor-boton editor-boton-primario">
                        <Save size={18} />
                        <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
                    </button>
                </div>
            </div>

            {/* Area de contenido */}
            <div id="editor-content-area" className="editor-area-contenido">
                {isPreviewMode ? (
                    <div id="editor-preview" className="editor-preview">
                        {renderizarPreview()}
                    </div>
                ) : (
                    <EditorJs id="glory-page-editor" data={editorData} onChange={manejarCambio} placeholder="Comienza a escribir tu contenido..." />
                )}
            </div>
        </div>
    );
}

export default PageEditorIsland;
