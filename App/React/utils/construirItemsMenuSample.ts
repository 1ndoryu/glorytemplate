/*
 * Builder: construirItemsMenuSample — Kamples (QQ68)
 * Construye dinámicamente los items del menú contextual de samples.
 * Extraído de useMenuContextualSample para cumplir SRP.
 */

import type { SampleResumen } from '@app/types';
import type { MenuItemDef } from '@app/components/ui/MenuContextual';
import { eliminarSample, actualizarSample } from '@app/services/apiSamples';
import { desvincularSample } from '@app/services/apiRelaciones';
import { descargarSample } from '@app/services/apiDescargas';
import { toast } from '@app/stores/toastStore';
import { useReportarStore } from '@app/stores/reportarStore';
import { requiereAuth } from '@app/utils/requiereAuth';
import { EVENTO_SAMPLE_ELIMINADO, EVENTO_SAMPLE_RESTAURADO, EVENTO_SAMPLE_ACTUALIZADO } from '@app/hooks/useMenuContextualSample';

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
}

const emitirEvento = (nombre: string, detail: unknown) =>
    window.dispatchEvent(new CustomEvent(nombre, { detail }));

export const construirItemsMenuSample = (d: DepsMenuSample): MenuItemDef[] => {
    const s = d.sample;
    const items: MenuItemDef[] = [
        { id: 'reproducir', etiqueta: 'Reproducir', onClick: () => d.reproducir(s) },
        { id: 'detalle', etiqueta: 'Ver detalle', href: `/sample/${s.slug}/`, onClick: () => d.navegar(`/sample/${s.slug}/`), separadorDespues: true },
        { id: 'coleccion', etiqueta: 'Añadir a colección', onClick: () => { if (requiereAuth()) d.abrirColeccionPicker(s); } },
        { id: 'descargar', etiqueta: 'Descargar archivo', separadorDespues: true, onClick: async () => {
            if (!requiereAuth()) return;
            try {
                const resp = await descargarSample(s.id);
                if (resp.ok && resp.data?.url) {
                    const a = document.createElement('a');
                    a.href = resp.data.url;
                    a.download = resp.data.nombre || s.titulo || 'sample';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } else if (resp.status === 429 || resp.status === 403) {
                    toast.error(resp.error ?? 'Has alcanzado el límite de descargas');
                }
            } catch { toast.error('Error de red al descargar'); }
        }},
        { id: 'creador', etiqueta: `Ir a ${s.creador.nombreVisible || s.creador.username}`, href: `/perfil/${s.creador.username}/`, onClick: () => d.navegar(`/perfil/${s.creador.username}/`) },
        { id: 'compartir', etiqueta: 'Copiar enlace', separadorDespues: true, onClick: () => d.copiarAlPortapapeles(`${window.location.origin}/sample/${s.slug}/`) },
        { id: 'sugerencias', etiqueta: 'También te podría gustar', onClick: () => d.abrirSugerencias(s) },
        { id: 'abrir-panel', etiqueta: 'Abrir panel', separadorDespues: true, onClick: () => d.abrirDetalle(s) },
    ];

    const ytId = s.metadata?.youtube_id;
    if (typeof ytId === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(ytId))
        items.push({ id: 'youtube', etiqueta: 'Ver en YouTube', separadorDespues: true, onClick: () => window.open(`https://www.youtube.com/watch?v=${ytId}`, '_blank', 'noopener,noreferrer') });

    if (d.puedeEditar)
        items.push({ id: 'editar', etiqueta: 'Editar sample', onClick: () => d.abrirEditarSample(s) });

    if (d.esAdmin && s.metadata?.relacion_id)
        items.push({ id: 'corregir-ia', etiqueta: 'Corregir metadata IA', onClick: () => d.abrirCorregirIA(s) });

    if (d.esAdmin && s.metadata?.relacion_id)
        items.push({ id: 'extender-recorte', etiqueta: 'Extender recorte', onClick: () => d.abrirExtenderRecorte(s) });

    if (d.esAdmin)
        items.push({ id: 'verificar', etiqueta: s.verificado ? 'Quitar verificación' : 'Verificar sample', onClick: () => {
            const nv = !s.verificado;
            actualizarSample(s.id, { verificado: nv }).then((r) => {
                if (r.ok) { toast.exito(nv ? 'Sample verificado' : 'Verificación removida'); emitirEvento(EVENTO_SAMPLE_ACTUALIZADO, { sampleId: s.id, cambios: { verificado: nv } }); }
                else toast.error('Error al actualizar verificación');
            });
        }});

    if (d.puedeEditar && s.metadata?.relacion_id && s.metadata?.adjuncion_manual)
        items.push({ id: 'quitar-sampleo', etiqueta: 'Quitar de este sampleo', peligro: true, separadorDespues: true, onClick: () => {
            if (!s.metadata?.relacion_id || !s.metadata?.lado_extraccion) return;
            const rId = Number(s.metadata.relacion_id);
            const lado = String(s.metadata.lado_extraccion) as 'fuente' | 'destino';
            toast.confirmar(`¿Quitar "${s.titulo}" de esta relacion de sampleo?`, async () => {
                const resp = await desvincularSample(rId, lado);
                if (resp.ok) { toast.exito('Sample desvinculado'); emitirEvento(EVENTO_SAMPLE_ACTUALIZADO, { sampleId: s.id, cambios: { metadata: { ...s.metadata, relacion_id: null, lado_extraccion: null, adjuncion_manual: null } } }); }
                else toast.error(resp.error ?? 'Error al desvincular');
            });
        }});

    if (d.esAdmin)
        items.push({ id: 'inspeccionar', etiqueta: 'Inspeccionar datos', separadorDespues: true, onClick: () => d.setSampleInspeccion(s) });

    if (d.puedeEliminar)
        items.push({ id: 'eliminar', etiqueta: 'Eliminar sample', peligro: true, onClick: () => {
            toast.confirmar(`¿Eliminar "${s.titulo}"?`, async () => {
                emitirEvento(EVENTO_SAMPLE_ELIMINADO, { sampleId: s.id });
                const resp = await eliminarSample(s.id);
                if (resp.ok) toast.exito('Sample eliminado');
                else { emitirEvento(EVENTO_SAMPLE_RESTAURADO, { sample: s }); toast.error('Error al eliminar'); }
            });
        }});

    items.push({ id: 'reportar', etiqueta: 'Reportar', peligro: true, onClick: () => useReportarStore.getState().abrir('sample', s.id, s.titulo) });
    return items;
};
