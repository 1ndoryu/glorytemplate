/*
 * Componente: ResultadosBusquedaRapida
 * Dropdown con resultados unificados por relevancia (sin agrupación por tipo).
 * QL31: Lista plana — el resultado que más coincide aparece primero, sin importar tipo.
 * Aparece debajo del InputBusqueda en la TopBar al escribir.
 */

import { Music, Disc3, ArrowRight, User, BadgeCheck, Loader2, FolderOpen } from 'lucide-react';
import { BotonBase } from './BotonBase';
import { Avatar } from './Avatar';
import { useResultadosBusquedaRapida } from '@app/hooks/useResultadosBusquedaRapida';
import { useT } from '@app/utils/i18n/useT';
import type {
    ResultadoCancion,
    ResultadoSample,
    ResultadoSampleo,
    ResultadoUsuario,
    ResultadoColeccion,
    ResultadoUnificado,
    ResultadosBusquedaRapida,
} from '@app/services/apiBusqueda';
import '../../styles/componentes/busquedaRapida.css';

interface ResultadosBusquedaRapidaProps {
    resultados: ResultadosBusquedaRapida;
    cargando: boolean;
    visible: boolean;
    onCerrar: () => void;
}

export const ResultadosBusquedaRapidaDropdown = ({
    resultados,
    cargando,
    visible,
    onCerrar,
}: ResultadosBusquedaRapidaProps): JSX.Element | null => {
    const { contenedorRef, irA } = useResultadosBusquedaRapida({ visible, onCerrar });

    const { t } = useT();

    if (!visible) return null;

    const { todos } = resultados;
    const sinResultados = todos.length === 0;

    return (
        <div className="busquedaRapidaDropdown" ref={contenedorRef} role="listbox">
            {cargando && (
                <div className="busquedaRapidaCargando">
                    <Loader2 size={16} className="busquedaRapidaSpinner" />
                </div>
            )}

            {sinResultados && !cargando && (
                <div className="busquedaRapidaVacio">{t('busqueda.sinResultados')}</div>
            )}

            {todos.map((item, idx) => (
                <ItemUnificado key={`${item.tipo}-${idx}`} item={item} onIr={irA} />
            ))}
        </div>
    );
};

/* Item unificado — delega renderizado según tipo */
const ItemUnificado = ({ item, onIr }: { item: ResultadoUnificado; onIr: (r: string) => void }) => {
    switch (item.tipo) {
        case 'cancion':
            return <ItemCancion datos={item.datos as ResultadoCancion} onIr={onIr} />;
        case 'sample':
            return <ItemSample datos={item.datos as ResultadoSample} onIr={onIr} />;
        case 'sampleo':
            return <ItemSampleo datos={item.datos as ResultadoSampleo} onIr={onIr} />;
        case 'usuario':
            return <ItemUsuario datos={item.datos as ResultadoUsuario} onIr={onIr} />;
        case 'coleccion':
            return <ItemColeccion datos={item.datos as ResultadoColeccion} onIr={onIr} />;
        default:
            return null;
    }
};

/* Items individuales por tipo */

const ItemCancion = ({ datos: c, onIr }: { datos: ResultadoCancion; onIr: (r: string) => void }) => (
    <BotonBase
        variante="ghost"
        tamano="ninguno"
        className="busquedaRapidaItem"
        onClick={() => onIr(`/cancion/${c.slug}`)}
        type="button"
    >
        <div className="busquedaRapidaImagen">
            {c.imagenUrl ? (
                <img src={c.imagenUrl} alt={c.titulo} loading="lazy" />
            ) : (
                <Music size={16} />
            )}
        </div>
        <div className="busquedaRapidaInfo">
            <span className="busquedaRapidaTitulo">{c.titulo}</span>
            {c.artistaNombre && (
                <span className="busquedaRapidaSubtexto">{c.artistaNombre}</span>
            )}
        </div>
        <span className="busquedaRapidaTipo">
            <Music size={10} />
        </span>
    </BotonBase>
);

const ItemSample = ({ datos: s, onIr }: { datos: ResultadoSample; onIr: (r: string) => void }) => (
    <BotonBase
        variante="ghost"
        tamano="ninguno"
        className="busquedaRapidaItem"
        onClick={() => onIr(`/sample/${s.slug}/`)}
        type="button"
    >
        <div className="busquedaRapidaImagen">
            {s.imagenUrl ? (
                <img src={s.imagenUrl} alt={s.titulo} loading="lazy" />
            ) : (
                <Disc3 size={16} />
            )}
        </div>
        <div className="busquedaRapidaInfo">
            <span className="busquedaRapidaTitulo">{s.titulo}</span>
            <span className="busquedaRapidaSubtexto">
                por {s.creador.nombreVisible}
            </span>
        </div>
        <span className="busquedaRapidaTipo">
            <Disc3 size={10} />
        </span>
    </BotonBase>
);

const ItemSampleo = ({ datos: rel, onIr }: { datos: ResultadoSampleo; onIr: (r: string) => void }) => (
    <BotonBase
        variante="ghost"
        tamano="ninguno"
        className="busquedaRapidaItem busquedaRapidaItemSampleo"
        onClick={() => onIr(`/cancion/${rel.destino.slug}`)}
        type="button"
    >
        <div className="busquedaRapidaImagen">
            {rel.fuente.imagenUrl ? (
                <img src={rel.fuente.imagenUrl} alt={rel.fuente.titulo} loading="lazy" />
            ) : (
                <Music size={14} />
            )}
        </div>
        <div className="busquedaRapidaInfo busquedaRapidaInfoSampleo">
            <span className="busquedaRapidaTitulo busquedaRapidaSampleoTexto">
                {rel.fuente.artista} — {rel.fuente.titulo}
            </span>
            <span className="busquedaRapidaSampleoFlecha">
                <ArrowRight size={10} />
            </span>
            <span className="busquedaRapidaTitulo busquedaRapidaSampleoTexto">
                {rel.destino.artista} — {rel.destino.titulo}
            </span>
        </div>
        <span className="busquedaRapidaTipo">
            <ArrowRight size={10} />
        </span>
    </BotonBase>
);

const ItemUsuario = ({ datos: u, onIr }: { datos: ResultadoUsuario; onIr: (r: string) => void }) => (
    <BotonBase
        variante="ghost"
        tamano="ninguno"
        className="busquedaRapidaItem"
        onClick={() => onIr(`/perfil/${u.username}/`)}
        type="button"
    >
        <Avatar
            src={u.avatarUrl}
            nombre={u.nombreVisible}
            tamano="xs"
        />
        <div className="busquedaRapidaInfo">
            <span className="busquedaRapidaTitulo">
                {u.nombreVisible}
                {u.verificado && <BadgeCheck size={12} className="busquedaRapidaVerificado" />}
            </span>
            <span className="busquedaRapidaSubtexto">@{u.username}</span>
        </div>
        <span className="busquedaRapidaTipo">
            <User size={10} />
        </span>
    </BotonBase>
);

const ItemColeccion = ({ datos: col, onIr }: { datos: ResultadoColeccion; onIr: (r: string) => void }) => (
    <BotonBase
        variante="ghost"
        tamano="ninguno"
        className="busquedaRapidaItem"
        onClick={() => onIr(`/coleccion/${col.slug}/`)}
        type="button"
    >
        <div className="busquedaRapidaImagen">
            {col.portadaUrl ? (
                <img src={col.portadaUrl} alt={col.nombre} loading="lazy" />
            ) : (
                <FolderOpen size={16} />
            )}
        </div>
        <div className="busquedaRapidaInfo">
            <span className="busquedaRapidaTitulo">{col.nombre}</span>
            <span className="busquedaRapidaSubtexto">
                {col.creador} · {col.totalSamples} samples
            </span>
        </div>
        <span className="busquedaRapidaTipo">
            <FolderOpen size={10} />
        </span>
    </BotonBase>
);

export default ResultadosBusquedaRapidaDropdown;
