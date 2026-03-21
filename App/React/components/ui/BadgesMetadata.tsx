/*
 * Componente: BadgesMetadata
 * Renderiza badges de metadata inteligente del sample (instrumento, género, emoción, BPM, tags).
 * C344: Si onFiltrar está presente, los badges son clickables para filtrar la vista.
 * [2103A-13] Extraído de TarjetaSample para mantener el límite de líneas.
 *            Admins pueden cambiar el tipo (loop/oneshot) del sample clickando el badge tipo.
 */

import { useState, useCallback, type MouseEvent } from 'react';
import type { SampleResumen } from '../../types';
import { Badge } from './Badge';
import { etiquetaBpm } from '../../services/bpmUtils';
import { normalizarTag } from '../../services/tagUtils';
import { formatearKey } from '@app/hooks/useTarjetaSample';
import { useAuthStore } from '@app/stores/authStore';
import type { EstadoAuth } from '@app/stores/authStore';
import { actualizarSample } from '@app/services/apiSamples';
import { toast } from '@app/stores/toastStore';
import { useT } from '@app/utils/i18n';

export interface BadgesMetadataProps {
    sample: SampleResumen;
    onFiltrar?: (texto: string) => void;
}

export const BadgesMetadata = ({ sample, onFiltrar }: BadgesMetadataProps): JSX.Element => {
    /* [2103A-13] Admins pueden cambiar el tipo del sample clickando el badge */
    const usuario = useAuthStore((s: EstadoAuth) => s.usuario);
    const esAdmin = usuario?.rol === 'admin';
    const [tipoLocal, setTipoLocal] = useState<string | null>(null);
    const { t } = useT();
    const tipoActual = tipoLocal ?? sample.tipo;

    const manejarCambiarTipo = useCallback(async (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!esAdmin) return;
        const nuevoTipo = tipoActual === 'loop' ? 'oneshot' : 'loop';
        setTipoLocal(nuevoTipo);
        const resp = await actualizarSample(sample.id, { tipo: nuevoTipo });
        if (resp.ok) {
            toast.exito(t('admin.tipoActualizado'));
        } else {
            setTipoLocal(null); /* rollback optimista */
            toast.error(t('admin.tipoError'));
        }
    }, [esAdmin, tipoActual, sample.id, t]);

    const meta = sample.metadata;
    const badges: { texto: string; clave: string }[] = [];
    const usados = new Set<string>();

    /* [213A-3] Tipo siempre como primer badge — orienta al usuario de un vistazo.
     * [2103A-13] tipoActual puede ser override local del admin (estado optimista). */
    const tipoBadgeTexto = tipoActual === 'loop' ? 'Loop' : 'One Shot';
    badges.push({ texto: tipoBadgeTexto, clave: 'tipo' });
    usados.add(tipoActual);     // 'loop' | 'oneshot'
    usados.add('one shot');     // variante textual habitual en tags

    /* [193A-34] agregarBadge aplica normalizarTag para consistencia
     * (vocals→vocal, guitarra→guitar, etc). Evita duplicados normalizados. */
    const agregarBadge = (valores: unknown, clave: string) => {
        const arr = Array.isArray(valores) ? valores : valores ? [valores] : [];
        for (const v of arr) {
            if (typeof v === 'string' && v.trim()) {
                const norm = normalizarTag(v);
                if (norm && !usados.has(norm)) {
                    usados.add(norm);
                    badges.push({ texto: norm, clave });
                    return;
                }
            }
        }
    };

    agregarBadge(meta?.instrumentos ?? meta?.['instrumentos'], 'inst');
    agregarBadge(meta?.genero ?? meta?.['genero'], 'gen');
    /* QQ21b: Preferir tags en inglés en el front; español se preserva para búsqueda */
    agregarBadge(meta?.emocion ?? meta?.emocion_es ?? meta?.emocionEs, 'emo');

    if (sample.bpm) {
        badges.push({ texto: etiquetaBpm(sample.bpm), clave: 'vel' });
    }

    agregarBadge(meta?.tags ?? meta?.tags_es ?? meta?.tagsEs ?? sample.tags, 'tag');

    /* Fallback si no hay metadata IA */
    if (badges.length === 0) {
        if (sample.bpm) badges.push({ texto: etiquetaBpm(sample.bpm), clave: 'bpm' });
        if (sample.key) badges.push({ texto: formatearKey(sample.key, sample.escala), clave: 'key' });
        badges.push({ texto: tipoActual, clave: 'tipo' });
    }

    return (
        <>
            {badges.map(({ texto, clave }) => {
                const esTipoBadge = clave === 'tipo';
                /* Tipo badge para admins: hace toggle Loop↔One Shot */
                const clickHandler = esTipoBadge && esAdmin
                    ? manejarCambiarTipo
                    : onFiltrar
                    ? (e: React.MouseEvent) => { e.stopPropagation(); onFiltrar(texto); }
                    : undefined;
                const claseExtra = esTipoBadge && esAdmin ? ' tarjetaMetaBadgeEditableTipo' : '';
                return (
                    <Badge
                        key={clave}
                        variante="neutro"
                        className={(onFiltrar || (esTipoBadge && esAdmin)) ? `tarjetaMetaBadgeClickable${claseExtra}` : undefined}
                        onClick={clickHandler}
                    >
                        {texto}
                    </Badge>
                );
            })}
        </>
    );
};

export default BadgesMetadata;
