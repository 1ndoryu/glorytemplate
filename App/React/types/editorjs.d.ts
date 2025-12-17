/*
 * Declaraciones de tipos para Editor.js y sus plugins
 * Editor.js no tiene tipos oficiales de TypeScript
 */

declare module '@editorjs/editorjs' {
    export interface OutputBlockData {
        type: string;
        data: Record<string, unknown>;
    }

    export interface OutputData {
        time?: number;
        blocks: OutputBlockData[];
        version?: string;
    }

    export interface API {
        saver: {
            save(): Promise<OutputData>;
        };
        blocks: {
            getBlocksCount(): number;
            insert(type?: string, data?: Record<string, unknown>): void;
            delete(index?: number): void;
        };
    }

    export interface EditorConfig {
        holder: string | HTMLElement;
        data?: OutputData;
        placeholder?: string;
        readOnly?: boolean;
        minHeight?: number;
        tools?: Record<string, unknown>;
        onChange?: (api: API) => void;
        onReady?: () => void;
    }

    export default class EditorJS {
        constructor(config: EditorConfig);
        isReady: Promise<void>;
        save(): Promise<OutputData>;
        render(data: OutputData): Promise<void>;
        clear(): Promise<void>;
        destroy(): Promise<void>;
    }
}

declare module '@editorjs/header' {
    const Header: unknown;
    export default Header;
}

declare module '@editorjs/paragraph' {
    const Paragraph: unknown;
    export default Paragraph;
}

declare module '@editorjs/list' {
    const List: unknown;
    export default List;
}

declare module '@editorjs/quote' {
    const Quote: unknown;
    export default Quote;
}

declare module '@editorjs/delimiter' {
    const Delimiter: unknown;
    export default Delimiter;
}

declare module '@editorjs/image' {
    const Image: unknown;
    export default Image;
}

declare module '@editorjs/embed' {
    const Embed: unknown;
    export default Embed;
}
