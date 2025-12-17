/**
 * EditorJs - Wrapper de Editor.js para React
 *
 * IMPORTANTE: Este componente usa refs para callbacks para evitar
 * reinicializaciones del editor. Editor.js no es un controlled component,
 * se inicializa una vez y luego maneja su propio estado interno.
 */

import {useEffect, useRef} from 'react';
import EditorJS, {OutputData, API} from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Delimiter from '@editorjs/delimiter';

interface EditorJsProps {
    id?: string;
    data?: OutputData;
    onChange?: (data: OutputData) => void;
    onReady?: (editor: EditorJS) => void;
    placeholder?: string;
    readOnly?: boolean;
    minHeight?: number;
}

export function EditorJs({id = 'editorjs-container', data, onChange, onReady, placeholder = 'Escribe aqui o presiona Tab para ver los bloques...', readOnly = false, minHeight = 300}: EditorJsProps): JSX.Element {
    const editorRef = useRef<EditorJS | null>(null);
    const holderRef = useRef<HTMLDivElement>(null);

    /*
     * Refs para callbacks - evita que el editor se reinicialice
     * cuando el padre re-renderiza y pasa nuevas funciones
     */
    const onChangeRef = useRef(onChange);
    const onReadyRef = useRef(onReady);

    // Actualizar refs cuando cambien las props (sin reinicializar editor)
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        onReadyRef.current = onReady;
    }, [onReady]);

    /*
     * Inicializar Editor.js UNA SOLA VEZ
     * El array de dependencias esta vacio para evitar reinicializaciones
     */
    useEffect(() => {
        // Evitar inicializar si ya existe
        if (editorRef.current) {
            return;
        }

        // Verificar que el holder existe
        if (!holderRef.current) {
            console.error('[EditorJs] Holder element not found');
            return;
        }

        const editor = new EditorJS({
            holder: holderRef.current,
            placeholder,
            readOnly,
            minHeight,
            data: data || undefined,
            tools: {
                header: {
                    class: Header,
                    config: {
                        placeholder: 'Titulo...',
                        levels: [1, 2, 3, 4],
                        defaultLevel: 2
                    }
                },
                paragraph: {
                    class: Paragraph,
                    inlineToolbar: true
                },
                list: {
                    class: List,
                    inlineToolbar: true,
                    config: {
                        defaultStyle: 'unordered'
                    }
                },
                quote: {
                    class: Quote,
                    inlineToolbar: true,
                    config: {
                        quotePlaceholder: 'Escribe una cita...',
                        captionPlaceholder: 'Autor'
                    }
                },
                delimiter: Delimiter
            },
            onChange: async (api: API) => {
                // Usar ref para obtener la version mas reciente del callback
                if (onChangeRef.current) {
                    const outputData = await api.saver.save();
                    onChangeRef.current(outputData);
                }
            },
            onReady: () => {
                if (onReadyRef.current && editorRef.current) {
                    onReadyRef.current(editorRef.current);
                }
            }
        });

        editorRef.current = editor;

        // Cleanup: destruir editor cuando el componente se desmonte
        return () => {
            if (editorRef.current && typeof editorRef.current.destroy === 'function') {
                editorRef.current.destroy();
                editorRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Dependencias vacias - solo inicializar una vez

    return (
        <div id="editorjs-wrapper" className="editorjs-contenedor">
            <div id={id} ref={holderRef} />
        </div>
    );
}

export default EditorJs;
export type {OutputData};
