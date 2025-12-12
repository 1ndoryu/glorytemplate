/**
 * useGenerateForm - Hook para manejar el formulario de generacion de articulos
 *
 * Extrae la logica de estado del formulario para cumplir con SRP.
 * Maneja:
 * - Estados del formulario (title, topic, outline, tone)
 * - Generacion de articulos
 * - Generacion de ideas
 */

import {useState} from 'react';
import type {ArticleIdea} from '../../../hooks/useAdminAI';

interface GenerateFormState {
    title: string;
    topic: string;
    outline: string;
    tone: string;
}

interface GenerateFormActions {
    setTitle: (value: string) => void;
    setTopic: (value: string) => void;
    setOutline: (value: string) => void;
    setTone: (value: string) => void;
    resetForm: () => void;
    useIdea: (idea: ArticleIdea) => void;
}

interface GenerateFormReturn extends GenerateFormState, GenerateFormActions {
    generating: boolean;
    ideas: ArticleIdea[];
    loadingIdeas: boolean;
    handleGenerate: () => Promise<void>;
    handleGenerateIdeas: () => Promise<void>;
    clearIdeas: () => void;
}

interface UseGenerateFormOptions {
    generateArticle: (params: {title: string; topic: string; outline: string; tone: string}) => Promise<{success: boolean}>;
    generateIdeas: (count: number) => Promise<{success: boolean; ideas?: ArticleIdea[]}>;
}

export function useGenerateForm({generateArticle, generateIdeas}: UseGenerateFormOptions): GenerateFormReturn {
    const [title, setTitle] = useState('');
    const [topic, setTopic] = useState('');
    const [outline, setOutline] = useState('');
    const [tone, setTone] = useState('cercano');
    const [generating, setGenerating] = useState(false);
    const [ideas, setIdeas] = useState<ArticleIdea[]>([]);
    const [loadingIdeas, setLoadingIdeas] = useState(false);

    const resetForm = () => {
        setTitle('');
        setTopic('');
        setOutline('');
    };

    const handleGenerate = async () => {
        if (!title.trim()) return;

        setGenerating(true);
        try {
            const result = await generateArticle({
                title: title.trim(),
                topic: topic.trim() || title.trim(),
                outline: outline.trim(),
                tone
            });

            if (result.success) {
                resetForm();
            }
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerateIdeas = async () => {
        setLoadingIdeas(true);
        try {
            const result = await generateIdeas(5);
            if (result.success && result.ideas) {
                setIdeas(result.ideas);
            }
        } finally {
            setLoadingIdeas(false);
        }
    };

    const useIdea = (idea: ArticleIdea) => {
        setTitle(idea.title);
        setOutline(idea.outline.join('\n'));
        setIdeas([]);
    };

    const clearIdeas = () => setIdeas([]);

    return {
        title,
        topic,
        outline,
        tone,
        setTitle,
        setTopic,
        setOutline,
        setTone,
        resetForm,
        generating,
        ideas,
        loadingIdeas,
        handleGenerate,
        handleGenerateIdeas,
        useIdea,
        clearIdeas
    };
}
