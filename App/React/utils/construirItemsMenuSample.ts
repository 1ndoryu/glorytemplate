/*
 * Builder: construirItemsMenuSample — Kamples (QQ68)
 * Construye dinámicamente los items del menú contextual de samples.
 * Extraído de useMenuContextualSample para cumplir SRP.
 */

import { createElement } from 'react';
import type { SampleResumen } from '@app/types';
import type { MenuItemDef } from '@app/components/ui/MenuContextual';
import { eliminarSample, actualizarSample } from '@app/services/apiSamples';
import { desvincularSample } from '@app/services/apiRelaciones';
import { descargarSample } from '@app/services/apiDescargas';
import { descargarArchivo } from '@app/utils/descargarArchivo';
import { toast } from '@app/stores/toastStore';
import { useReportarStore } from '@app/stores/reportarStore';
import { requiereAuth } from '@app/utils/requiereAuth';
import { EVENTO_SAMPLE_ELIMINADO, EVENTO_SAMPLE_RESTAURADO, EVENTO_SAMPLE_ACTUALIZADO } from '@app/hooks/useMenuContextualSample';
import {
    Play, Eye, FolderPlus, Download, User, Link, Sparkles, PanelRight,
    ExternalLink, Pencil, BrainCircuit, Scissors, BadgeCheck, Unlink2, FolderTree,
    Search, Trash2, Flag, Gift, ShieldOff, AudioLines,
} from 'lucide-react';
import { generarCodigo, invalidarCodigo } from '@app/services/apiCodigosGratis';
import { descargarWaveformSvg } from '@app/utils/descargarWaveformSvg';
import { getT } from '@app/utils/i18n';

export interface DepsMenuSample {
    sample: SampleResumen;
    navegar: (ruta: string) => void;
    reproducir: (sample: SampleResumen) => void;
    abrirColeccionPicker: (sample: SampleResumen) => void;
    abrirEditarSample: (sample: SampleResumen) => void;
    abrirCorregirIA: (sample: SampleResumen) => void;
    abrirExtenderRecorte: (sample: SampleResumen) => void;
    abrirSugerencias: (sample: SampleResumen) => void;
    abrirDetalle: (sample: SampleResumen) => void;
    copiarAlPortapapeles: (texto: string) => void;
    setSampleInspeccion: (sample: SampleResumen) => void;
    puedeEditar: boolean;
    puedeEliminar: boolean;
    esAdmin: boolean;
    /* [183A-106] Codigo de descarga gratis reclamado para este sample (si existe) */
    codigoGratis?: string | null;
}

const emitirEvento = (nombre: string, detail: unknown) =>
    window.dispatchEvent(new CustomEvent(nombre, { detail }));

/* QL52: Helper para crear icono de 16px sin JSX */
const ic = (componente: typeof Play) => createElement(componente, { size: 16 });

export const construirItemsMenuSample = (d: DepsMenuSample): MenuItemDef[] => {
    const s = d.sample;
    const t = getT();
    const rutaColeccionOriginal = s.coleccionOriginal
        ? `/coleccion/${s.coleccionOriginal.slug ?? s.coleccionOriginal.id}/`
        : null;
    const items: MenuItemDef[] = [
        { id: 'reproducir', etiqueta: t('sample.reproducir'), icono: ic(Play), onClick: () => d.reproducir(s) },
        { id: 'detalle', etiqueta: t('sample.menu.verDetalle'), icono: ic(Eye), href: `/sample/${s.slug}/`, onClick: () => d.navegar(`/sample/${s.slug}/`), separadorDespues: true },
        ...(rutaColeccionOriginal && s.coleccionOriginal ? [{
            id: 'coleccion-original',
            etiqueta: t('sample.menu.irColeccionOriginal', { nombre: s.coleccionOriginal.nombre }),
            icono: ic(FolderTree),
            href: rutaColeccionOriginal,
            onClick: () => d.navegar(rutaColeccionOriginal),
        }] : []),
        { id: 'coleccion', etiqueta: t('sample.menu.anadirColeccion'), icono: ic(FolderPlus), onClick: () => { if (requiereAuth()) d.abrirColeccionPicker(s); } },
        /* [183A-73][183A-92][183A-106] Descarga cross-platform: web usa <a>, nativo guarda en Documentos.
         * Si hay codigo gratis reclamado, se incluye en el body para saltear limites del plan. */
        { id: 'descargar', etiqueta: t('sample.menu.descargarArchivo'), icono: ic(Download), onClick: async () => {
            if (!requiereAuth()) return;
            try {
                const resp = await descargarSample(s.id, d.codigoGratis ?? undefined);
                if (resp.ok && resp.data?.url) {
                    const uri = await descargarArchivo(resp.data.url, resp.data.nombre || s.titulo || 'sample');
                    if (uri) toast.exito(t('sample.toast.guardadoDocumentos'));
                } else if (resp.status === 429 || resp.status === 403) {
                    toast.error(resp.error ?? t('error.descargar'));
                }
            } catch { toast.error(t('error.descargar')); }
        }},
        /* [183A-94] Descargar waveform como SVG blanco */
        ...(s.rutaWaveform ? [{
            id: 'descargar-svg',
            etiqueta: t('sample.menu.descargarWaveformSvg'),
            icono: ic(AudioLines),
            onClick: async () => {
                const ok = await descargarWaveformSvg(s.rutaWaveform, s.titulo || 'waveform');
                if (!ok) toast.error(t('sample.toast.errorWaveformSvg'));
            },
        }] : []),
        { id: 'creador', etiqueta: t('sample.menu.irACreador', { nombre: s.creador.nombreVisible || s.creador.username }), icono: ic(User), href: `/perfil/${s.creador.username}/`, onClick: () => d.navegar(`/perfil/${s.creador.username}/`) },
        { id: 'compartir', etiqueta: t('sample.menu.copiarEnlace'), icono: ic(Link), onClick: () => d.copiarAlPortapapeles(`${window.location.origin}/sample/${s.slug}/`) },
        { id: 'sugerencias', etiqueta: t('sample.tambienTePodria'), icono: ic(Sparkles), onClick: () => d.abrirSugerencias(s) },
        { id: 'abrir-panel', etiqueta: t('sample.menu.abrirPanel'), icono: ic(PanelRight), separadorDespues: true, onClick: () => d.abrirDetalle(s) },
    ];

    const ytId = s.metadata?.youtube_id;
    if (typeof ytId === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(ytId))
        items.push({ id: 'youtube', etiqueta: t('sample.menu.verYouTube'), icono: ic(ExternalLink), onClick: () => window.open(`https://www.youtube.com/watch?v=${ytId}`, '_blank', 'noopener,noreferrer') });

    if (d.puedeEditar)
        items.push({ id: 'editar', etiqueta: t('sample.menu.editar'), icono: ic(Pencil), onClick: () => d.abrirEditarSample(s) });

    if (d.esAdmin)
        items.push({ id: 'corregir-ia', etiqueta: t('sample.menu.corregirIa'), icono: ic(BrainCircuit), onClick: () => d.abrirCorregirIA(s) });

    /* QK61: Extender recorte necesita audio completo guardado o youtubeId para re-descargar */
    if (d.esAdmin && s.extraccion && (s.extraccion.tieneAudioCompleto || s.extraccion.youtubeId))
        items.push({ id: 'extender-recorte', etiqueta: t('sample.menu.extenderRecorte'), icono: ic(Scissors), onClick: () => d.abrirExtenderRecorte(s) });

    if (d.esAdmin)
        items.push({ id: 'verificar', etiqueta: s.verificado ? t('sample.menu.quitarVerificacion') : t('sample.menu.verificar'), icono: ic(BadgeCheck), separadorDespues: true, onClick: () => {
            const nv = !s.verificado;
            actualizarSample(s.id, { verificado: nv }).then((r) => {
                if (r.ok) { toast.exito(nv ? t('sample.toast.verificado') : t('sample.toast.verificacionRemovida')); emitirEvento(EVENTO_SAMPLE_ACTUALIZADO, { sampleId: s.id, cambios: { verificado: nv } }); }
                else toast.error(t('sample.toast.errorVerificacion'));
            });
        }});

    if (d.puedeEditar && s.relacionSampleoId && s.metadata?.adjuncion_manual)
        items.push({ id: 'quitar-sampleo', etiqueta: t('sample.menu.quitarSampleo'), icono: ic(Unlink2), peligro: true, separadorDespues: true, onClick: () => {
            if (!s.metadata?.relacion_id || !s.metadata?.lado_extraccion) return;
            const rId = Number(s.metadata.relacion_id);
            const lado = String(s.metadata.lado_extraccion) as 'fuente' | 'destino';
            toast.confirmar(t('sample.confirm.quitarSampleo', { titulo: s.titulo }), async () => {
                const resp = await desvincularSample(rId, lado);
                if (resp.ok) { toast.exito(t('sample.toast.desvinculado')); emitirEvento(EVENTO_SAMPLE_ACTUALIZADO, { sampleId: s.id, cambios: { metadata: { ...s.metadata, relacion_id: null, lado_extraccion: null, adjuncion_manual: null } } }); }
                else toast.error(resp.error ?? t('sample.toast.errorDesvincular'));
            });
        }});

    if (d.esAdmin)
        items.push({ id: 'inspeccionar', etiqueta: t('sample.menu.inspeccionar'), icono: ic(Search), separadorDespues: true, onClick: () => d.setSampleInspeccion(s) });

    /* [183A-106] Admin: generar enlace de descarga gratis — copia URL al portapapeles */
    if (d.esAdmin)
        items.push({ id: 'compartir-gratis', etiqueta: t('sample.menu.compartirGratis'), icono: ic(Gift), onClick: async () => {
            const resp = await generarCodigo('sample', s.id);
            if (resp.ok && resp.data?.codigo) {
                const url = `${window.location.origin}/sample/${s.slug}/?codigoGratis=${resp.data.codigo}`;
                d.copiarAlPortapapeles(url);
                toast.exito(t('sample.toast.enlaceGratisCopiado'));
            } else {
                toast.error(t('error.enlaceDescargaGratis'));
            }
        }});

    /* [183A-110] Admin: invalidar todos los codigos activos de este sample */
    if (d.esAdmin)
        items.push({ id: 'invalidar-enlace', etiqueta: t('sample.menu.invalidarEnlaceGratis'), icono: ic(ShieldOff), separadorDespues: true, onClick: async () => {
            toast.confirmar(t('sample.confirm.invalidarEnlacesGratis'), async () => {
                const resp = await invalidarCodigo('sample', s.id);
                if (resp.ok) {
                    const n = resp.data?.invalidados ?? 0;
                    toast.exito(n > 0 ? t('sample.toast.enlacesInvalidados', { n }) : t('sample.toast.sinEnlacesActivos'));
                } else {
                    toast.error(t('error.invalidarEnlace'));
                }
            });
        }});

    if (d.puedeEliminar)
        items.push({ id: 'eliminar', etiqueta: t('sample.menu.eliminar'), icono: ic(Trash2), peligro: true, onClick: () => {
            toast.confirmar(t('sample.confirm.eliminar', { titulo: s.titulo }), async () => {
                emitirEvento(EVENTO_SAMPLE_ELIMINADO, { sampleId: s.id });
                const resp = await eliminarSample(s.id);
                if (resp.ok) toast.exito(t('sample.toast.eliminado'));
                else { emitirEvento(EVENTO_SAMPLE_RESTAURADO, { sample: s }); toast.error('Error al eliminar'); }
            });
        }});

    items.push({ id: 'reportar', etiqueta: t('seleccionMultiple.reportar'), icono: ic(Flag), peligro: true, onClick: () => useReportarStore.getState().abrir('sample', s.id, s.titulo) });
    return items;
};
