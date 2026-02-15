/*
 * Service: tagUtils — Kamples
 * Normalización y utilidades para tags de samples.
 * Maneja: singular/plural, inglés/español, case, deduplicación.
 * Preparado para integración con algoritmo de descubrimiento.
 */

/* Mapeo de sinónimos: variantes → forma canónica */
const SINONIMOS_TAGS: Record<string, string> = {
    /* Inglés ↔ Español */
    guitarra: 'guitar',
    batería: 'drums',
    bajo: 'bass',
    piano: 'piano',
    voz: 'vocal',
    voces: 'vocal',
    vocals: 'vocal',
    cuerdas: 'strings',
    percusión: 'percussion',
    percusion: 'percussion',
    sintetizador: 'synth',
    synthesizer: 'synth',
    teclado: 'keys',
    keyboard: 'keys',
    efectos: 'fx',
    effects: 'fx',
    efecto: 'fx',

    /* Plural → singular */
    loops: 'loop',
    pads: 'pad',
    drums: 'drums',
    beats: 'beat',
    chops: 'chop',
    risers: 'riser',
    hits: 'hit',
    kicks: 'kick',
    snares: 'snare',
    claps: 'clap',
    hihats: 'hihat',
    'hi-hats': 'hihat',
    'hi-hat': 'hihat',
    samples: 'sample',
    oneshots: 'oneshot',
    'one-shot': 'oneshot',
    'one-shots': 'oneshot',
    stems: 'stem',

    /* Géneros — variantes comunes */
    'lo-fi': 'lofi',
    'lo fi': 'lofi',
    hiphop: 'hip-hop',
    'hip hop': 'hip-hop',
    dnb: 'drum-and-bass',
    'drum and bass': 'drum-and-bass',
    'drum & bass': 'drum-and-bass',
    edm: 'electronic',
    electronica: 'electronic',
    electrónica: 'electronic',
    'r&b': 'rnb',
    'r & b': 'rnb',
    reggaetón: 'reggaeton',

    /* Sentimientos */
    oscuro: 'dark',
    brillante: 'bright',
    suave: 'soft',
    agresivo: 'aggressive',
    melancólico: 'melancholic',
    melancolico: 'melancholic',
    épico: 'epic',
    epico: 'epic',
    relajado: 'chill',
    relaxed: 'chill',
    atmosférico: 'atmospheric',
    atmosferico: 'atmospheric',
    emotivo: 'emotional',
    cinematico: 'cinematic',
    cinemático: 'cinematic',
};

/*
 * Normaliza un tag individual: limpieza, lowercase, sinónimos.
 * Devuelve la forma canónica del tag.
 */
export const normalizarTag = (tag: string): string => {
    /* Limpiar: quitar espacios extra, lowercase, quitar caracteres especiales excepto - */
    let limpio = tag
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^a-záéíóúñü0-9\s\-&]/g, '');

    /* Buscar sinónimo */
    if (SINONIMOS_TAGS[limpio]) {
        limpio = SINONIMOS_TAGS[limpio];
    }

    return limpio;
};

/*
 * Normaliza un array de tags: limpia, deduplica y ordena.
 */
export const normalizarTags = (tags: string[]): string[] => {
    const normalizados = new Set<string>();
    for (const tag of tags) {
        const normalizado = normalizarTag(tag);
        if (normalizado.length > 0) {
            normalizados.add(normalizado);
        }
    }
    return Array.from(normalizados).sort();
};

/*
 * Categorías de tags para agrupación visual.
 * Útil para la vista expandida de tags en el feed.
 */
export type CategoriaTag = 'genero' | 'instrumento' | 'sentimiento' | 'tipo' | 'otro';

const TAGS_POR_CATEGORIA: Record<CategoriaTag, Set<string>> = {
    genero: new Set([
        'trap', 'lofi', 'hip-hop', 'house', 'drill', 'phonk', 'reggaeton',
        'rnb', 'pop', 'rock', 'jazz', 'electronic', 'ambient', 'synthwave',
        'drum-and-bass', 'dubstep', 'techno', 'latin', 'dembow', 'afrobeat',
        'future', 'deep',
    ]),
    instrumento: new Set([
        'guitar', 'piano', 'bass', 'drums', 'synth', 'vocal', 'strings',
        'percussion', 'keys', 'hihat', 'kick', 'snare', 'clap', 'cowbell',
        'pad', 'arp', 'flute', 'violin', 'brass',
    ]),
    sentimiento: new Set([
        'dark', 'bright', 'chill', 'aggressive', 'melancholic', 'epic',
        'emotional', 'atmospheric', 'cinematic', 'dreamy', 'hard', 'soft',
        'tension', 'ethereal',
    ]),
    tipo: new Set([
        'loop', 'oneshot', 'fx', 'vocal', 'stem', 'riser', 'hit',
        'chop', 'beat', 'sample',
    ]),
    otro: new Set(),
};

/*
 * Determina la categoría de un tag normalizado.
 */
export const categorizarTag = (tag: string): CategoriaTag => {
    const normalizado = normalizarTag(tag);
    for (const [categoria, tags] of Object.entries(TAGS_POR_CATEGORIA)) {
        if (tags.has(normalizado)) return categoria as CategoriaTag;
    }
    return 'otro';
};

/*
 * Agrupa tags por categoría. Útil para la vista expandida.
 */
export const agruparTagsPorCategoria = (tags: string[]): Record<CategoriaTag, string[]> => {
    const grupos: Record<CategoriaTag, string[]> = {
        genero: [],
        instrumento: [],
        sentimiento: [],
        tipo: [],
        otro: [],
    };

    for (const tag of tags) {
        const categoria = categorizarTag(tag);
        grupos[categoria].push(tag);
    }

    return grupos;
};

/*
 * Calcula similitud entre dos conjuntos de tags (Jaccard index).
 * Retorna un valor entre 0 (nada en común) y 1 (idénticos).
 * Útil para el algoritmo de recomendación.
 */
export const similitudTags = (tagsA: string[], tagsB: string[]): number => {
    const normA = new Set(normalizarTags(tagsA));
    const normB = new Set(normalizarTags(tagsB));

    if (normA.size === 0 && normB.size === 0) return 1;
    if (normA.size === 0 || normB.size === 0) return 0;

    let interseccion = 0;
    for (const tag of normA) {
        if (normB.has(tag)) interseccion++;
    }

    const union = normA.size + normB.size - interseccion;
    return union > 0 ? interseccion / union : 0;
};
