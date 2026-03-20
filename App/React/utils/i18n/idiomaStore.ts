/* [183A-111] idiomaStore — Zustand store para el idioma activo.
 * Auto-detecta desde navigator.language, persiste en localStorage.
 * Al cambiar idioma actualiza document.documentElement.lang para SEO. */
import { create } from 'zustand';

export type Idioma = 'es' | 'en' | 'ja';

const CLAVE_STORAGE = 'kamples_idioma';

function detectarIdiomaInicial(): Idioma {
    if (typeof window === 'undefined') return 'es';
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    if (guardado === 'es' || guardado === 'en' || guardado === 'ja') return guardado;
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('ja')) return 'ja';
    if (lang.startsWith('en')) return 'en';
    return 'es';
}

interface IdiomaState {
    idioma: Idioma;
    setIdioma: (idioma: Idioma) => void;
}

export const useIdiomaStore = create<IdiomaState>((set) => ({
    idioma: detectarIdiomaInicial(),
    setIdioma: (idioma) => {
        if (typeof localStorage !== 'undefined') localStorage.setItem(CLAVE_STORAGE, idioma);
        if (typeof document !== 'undefined') document.documentElement.lang = idioma;
        set({ idioma });
    },
}));
