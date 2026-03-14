/*
 * Componente: ResultadosBusquedaRapida
 * Dropdown con resultados agrupados por tipo: canciones, samples, sampleos, usuarios.
 * Aparece debajo del InputBusqueda en la TopBar al escribir.
 * Lógica extraída a useResultadosBusquedaRapida hook (SRP).
 */

import { Music, Disc3, ArrowRight, User, BadgeCheck, Loader2 } from 'lucide-react';
import { BotonBase } from './BotonBase';
import { Avatar } from './Avatar';
import { useResultadosBusquedaRapida } from '@app/hooks/useResultadosBusquedaRapida';
import type {
    ResultadoCancion,
    ResultadoSample,
    ResultadoSampleo,
    ResultadoUsuario,
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

    if (!visible) return null;

    const { canciones, samples, sampleos, usuarios } = resultados;
    const sinResultados = canciones.length === 0 && samples.length === 0
        && sampleos.length === 0 && usuarios.length === 0;

    return (
        <div className="busquedaRapidaDropdown" ref={contenedorRef} role="listbox">
            {cargando && (
                <div className="busquedaRapidaCargando">
                    <Loader2 size={16} className="busquedaRapidaSpinner" />
                </div>
            )}

            {sinResultados && !cargando && (
                <div className="busquedaRapidaVacio">Sin resultados</div>
            )}

            {/* QK91: Maximo 3 resultados visibles por seccion */}
            {canciones.length > 0 && (
                <SeccionCancion items={canciones.slice(0, 3)} onIr={irA} />
            )}

            {samples.length > 0 && (
                <SeccionSample items={samples.slice(0, 3)} onIr={irA} />
            )}

            {sampleos.length > 0 && (
                <SeccionSampleo items={sampleos.slice(0, 3)} onIr={irA} />
            )}

            {usuarios.length > 0 && (
                <SeccionUsuario items={usuarios.slice(0, 3)} onIr={irA} />
            )}
        </div>
    );
};

/* Secciones internas — cada una renderiza su grupo de resultados */

const SeccionCancion = ({ items, onIr }: { items: ResultadoCancion[]; onIr: (r: string) => void }) => (
    <div className="busquedaRapidaSeccion">
        <div className="busquedaRapidaCabecera">
            <Music size={12} />
            <span>Canciones</span>
        </div>
        {items.map((c) => (
            <BotonBase
                key={`cancion-${c.id}`}
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
                {c.totalSampleada > 0 && (
                    <span className="busquedaRapidaMeta">{c.totalSampleada} sampleos</span>
                )}
            </BotonBase>
        ))}
    </div>
);

const SeccionSample = ({ items, onIr }: { items: ResultadoSample[]; onIr: (r: string) => void }) => (
    <div className="busquedaRapidaSeccion">
        <div className="busquedaRapidaCabecera">
            <Disc3 size={12} />
            <span>Samples</span>
        </div>
        {items.map((s) => (
            <BotonBase
                key={`sample-${s.id}`}
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
            </BotonBase>
        ))}
    </div>
);

const SeccionSampleo = ({ items, onIr }: { items: ResultadoSampleo[]; onIr: (r: string) => void }) => (
    <div className="busquedaRapidaSeccion">
        <div className="busquedaRapidaCabecera">
            <ArrowRight size={12} />
            <span>Sampleos</span>
        </div>
        {items.map((rel) => (
            <BotonBase
                key={`sampleo-${rel.id}`}
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
            </BotonBase>
        ))}
    </div>
);

const SeccionUsuario = ({ items, onIr }: { items: ResultadoUsuario[]; onIr: (r: string) => void }) => (
    <div className="busquedaRapidaSeccion">
        <div className="busquedaRapidaCabecera">
            <User size={12} />
            <span>Usuarios</span>
        </div>
        {items.map((u) => (
            <BotonBase
                key={`usuario-${u.id}`}
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
                {u.totalSeguidores > 0 && (
                    <span className="busquedaRapidaMeta">
                        {u.totalSeguidores} {u.totalSeguidores === 1 ? 'seguidor' : 'seguidores'}
                    </span>
                )}
            </BotonBase>
        ))}
    </div>
);

export default ResultadosBusquedaRapidaDropdown;
