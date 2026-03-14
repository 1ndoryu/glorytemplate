/*
 * Service: tagUtils — Kamples
 * Normalización y utilidades para tags de samples.
 * Maneja: singular/plural, inglés/español, case, deduplicación, blacklist.
 * Preparado para integración con algoritmo de descubrimiento.
 */

/*
 * Tags genéricos o meta que no aportan valor al usuario.
 * normalizarTag() retorna '' para estos, filtrándolos del display.
 */
const TAGS_BLACKLIST = new Set([
    'muestra', 'muestras', 'sample', 'samples',
    'extraido', 'extraído', 'extracted', 'extraction',
    'audio', 'sonido', 'sound',
    'musica', 'música', 'music',
    'track', 'pista',
    'archivo', 'file',
    'descarga', 'download',
    'original', 'remix',
    'unknown', 'desconocido', 'otro', 'other', 'none', 'n/a',
]);

/* Mapeo de sinónimos: variantes → forma canónica */
const SINONIMOS_TAGS: Record<string, string> = {
    /* Inglés ↔ Español — instrumentos */
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
    flauta: 'flute',
    violín: 'violin',
    violin: 'violin',
    trompeta: 'trumpet',
    saxofón: 'saxophone',
    saxofon: 'saxophone',
    arpa: 'harp',

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
    cumbia: 'cumbia',
    salsa: 'salsa',
    bachata: 'bachata',
    merengue: 'merengue',
    bossa: 'bossa nova',
    'bossa nova': 'bossa nova',

    /* Sentimientos / mood */
    oscuro: 'dark',
    brillante: 'bright',
    suave: 'soft',
    duro: 'hard',
    agresivo: 'aggressive',
    melancólico: 'melancholic',
    melancolico: 'melancholic',
    triste: 'sad',
    alegre: 'happy',
    feliz: 'happy',
    épico: 'epic',
    epico: 'epic',
    relajado: 'chill',
    relaxed: 'chill',
    tranquilo: 'chill',
    atmosférico: 'atmospheric',
    atmosferico: 'atmospheric',
    emotivo: 'emotional',
    cinematico: 'cinematic',
    cinemático: 'cinematic',
    enérgico: 'energetic',
    energico: 'energetic',
    energetico: 'energetic',
    misterioso: 'mysterious',
    romántico: 'romantic',
    romantico: 'romantic',
    nostálgico: 'nostalgic',
    nostalgico: 'nostalgic',
    soñador: 'dreamy',
    ethereal: 'ethereal',
    etéreo: 'ethereal',
    etereo: 'ethereal',
    tenso: 'tension',
    intenso: 'intense',

    /* BPM categorías ES → EN (para tags que vienen del metadata) */
    'muy lento': 'very slow',
    lento: 'slow',
    'rápido': 'fast',
    rapido: 'fast',
    'muy rápido': 'very fast',
    'muy rapido': 'very fast',
};

/*
 * Normaliza un tag individual: limpieza, lowercase, sinónimos, blacklist.
 * Devuelve la forma canónica del tag o '' si está en blacklist.
 */
export const normalizarTag = (tag: string): string => {
    /* Limpiar: quitar espacios extra, lowercase, quitar caracteres especiales excepto - */
    let limpio = tag
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^a-záéíóúñü0-9\s\-&]/g, '');

    /* Filtrar tags genéricos antes de buscar sinónimo */
    if (TAGS_BLACKLIST.has(limpio)) return '';

    /* Buscar sinónimo */
    if (SINONIMOS_TAGS[limpio]) {
        limpio = SINONIMOS_TAGS[limpio];
    }

    /* Filtrar también la forma canónica (ej: 'samples' → 'sample' → blacklisted) */
    if (TAGS_BLACKLIST.has(limpio)) return '';

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
 * C134: Extrae todos los tags relevantes del metadata IA de un sample.
 * Fuentes: metadata.tags, metadata.genero, metadata.instrumentos,
 *          metadata.emocion, metadata.artistaVibes, sample.tipo.
 * Normaliza, deduplica  y retorna array de strings único.
 */
export const extraerTagsMetadata = (sample: {
    tags?: string[];
    tipo?: string;
    metadata?: Record<string, unknown> | null;
}): string[] => {
    const resultado = new Set<string>();
    const meta = sample.metadata;

    if (!meta) {
        /* Fallback a tags del usuario si no hay metadata */
        sample.tags?.forEach((t) => {
            const n = normalizarTag(t);
            if (n) resultado.add(n);
        });
        return Array.from(resultado);
    }

    /* QQ21b: Incluir tags de AMBOS idiomas para enriquecer búsqueda */
    const fuentesTags = [meta.tags, meta.tags_es, meta.tagsEs];
    for (const fuente of fuentesTags) {
        if (Array.isArray(fuente)) {
            fuente.forEach((t) => {
                if (typeof t === 'string') {
                    const n = normalizarTag(t);
                    if (n) resultado.add(n);
                }
            });
        }
    }

    /* Género */
    const genero = meta.genero;
    if (genero) {
        const arr = Array.isArray(genero) ? genero : [genero];
        arr.forEach((g) => {
            if (typeof g === 'string') {
                const n = normalizarTag(g);
                if (n) resultado.add(n);
            }
        });
    }

    /* Instrumentos */
    const instr = meta.instrumentos;
    if (instr) {
        const arr = Array.isArray(instr) ? instr : [instr];
        arr.forEach((i) => {
            if (typeof i === 'string') {
                const n = normalizarTag(i);
                if (n) resultado.add(n);
            }
        });
    }

    /* Emoción — ambos idiomas para enriquecer búsqueda */
    for (const campo of [meta.emocion, meta.emocion_es, meta.emocionEs]) {
        if (typeof campo === 'string') {
            const n = normalizarTag(campo);
            if (n) resultado.add(n);
        }
    }

    /* Artista vibes */
    const vibes = meta.artista_vibes ?? meta.artistaVibes;
    if (vibes) {
        const arr = Array.isArray(vibes) ? vibes : [vibes];
        arr.forEach((v) => {
            if (typeof v === 'string') {
                const n = normalizarTag(v);
                if (n) resultado.add(n);
            }
        });
    }

    /* Tipo del sample */
    if (sample.tipo) {
        const n = normalizarTag(sample.tipo);
        if (n) resultado.add(n);
    }

    return Array.from(resultado);
};

/*
 * C134: Extrae tags agrupados por categoría directamente del metadata IA.
 * Retorna un map de categoría → tags[], con datos directos del metadata
 * (sin depender de la categorización de sets hardcodeados).
 */
export const extraerTagsAgrupadosMetadata = (samples: Array<{
    tags?: string[];
    tipo?: string;
    metadata?: Record<string, unknown> | null;
}>): Record<CategoriaTag, string[]> => {
    const conteo: Record<CategoriaTag, Map<string, number>> = {
        genero: new Map(),
        instrumento: new Map(),
        sentimiento: new Map(),
        tipo: new Map(),
        otro: new Map(),
    };

    for (const sample of samples) {
        const meta = sample.metadata;
        if (!meta) continue;

        /* Género → directo a categoría genero */
        const genero = meta.genero;
        if (genero) {
            const arr = Array.isArray(genero) ? genero : [genero];
            arr.forEach((g) => {
                if (typeof g === 'string') {
                    const n = normalizarTag(g);
                    if (n) conteo.genero.set(n, (conteo.genero.get(n) ?? 0) + 1);
                }
            });
        }

        /* Instrumentos → directo a categoría instrumento */
        const instr = meta.instrumentos;
        if (instr) {
            const arr = Array.isArray(instr) ? instr : [instr];
            arr.forEach((i) => {
                if (typeof i === 'string') {
                    const n = normalizarTag(i);
                    if (n) conteo.instrumento.set(n, (conteo.instrumento.get(n) ?? 0) + 1);
                }
            });
        }

        /* Emoción → directo a categoría sentimiento */
        const emocion = meta.emocion;
        if (typeof emocion === 'string') {
            const n = normalizarTag(emocion);
            if (n) conteo.sentimiento.set(n, (conteo.sentimiento.get(n) ?? 0) + 1);
        }

        /* Tipo del sample */
        if (sample.tipo) {
            const n = normalizarTag(sample.tipo);
            if (n) conteo.tipo.set(n, (conteo.tipo.get(n) ?? 0) + 1);
        }

        /* Tags IA → categorizados por sets */
        const metaTags = meta.tags;
        if (Array.isArray(metaTags)) {
            metaTags.forEach((t) => {
                if (typeof t === 'string') {
                    const n = normalizarTag(t);
                    if (!n) return;
                    /* Evitar duplicar si ya está en otra categoría */
                    const yaExiste = Object.values(conteo).some((m) => m.has(n));
                    if (!yaExiste) {
                        const cat = categorizarTag(n);
                        conteo[cat].set(n, (conteo[cat].get(n) ?? 0) + 1);
                    }
                }
            });
        }
    }

    /* Convertir Maps a arrays ordenados por frecuencia */
    const resultado: Record<CategoriaTag, string[]> = {
        genero: [],
        instrumento: [],
        sentimiento: [],
        tipo: [],
        otro: [],
    };
    for (const [cat, mapa] of Object.entries(conteo)) {
        resultado[cat as CategoriaTag] = Array.from(mapa.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([tag]) => tag);
    }
    return resultado;
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
        'chop', 'beat',
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
