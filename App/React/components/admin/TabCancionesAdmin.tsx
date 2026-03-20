/*
 * Componente: TabCancionesAdmin — QL21
 * Tabla paginada de todas las canciones en el admin panel.
 * Columnas: ID, Titulo, Artista, Genero, Año, BPM, Sampleada/Samplea, Fecha.
 * Solo vista — lógica en useTabCancionesAdmin.
 */

import { RefreshCw, Search, ChevronLeft, ChevronRight, Loader2, Music } from 'lucide-react';
import { BotonBase } from '../ui/BotonBase';
import { CampoTexto } from '../ui/CampoTexto';
import { EstadoVacio } from '../ui/EstadoVacio';
import { useTabCancionesAdmin } from '@app/hooks/useTabCancionesAdmin';
import { useT } from '@app/utils/i18n/useT';
import '../../styles/componentes/cancionesAdmin.css';

/* Formatear fecha ISO a formato corto legible */
const formatearFecha = (iso: string): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const TabCancionesAdmin = (): JSX.Element => {
    const {
        canciones,
        total,
        pagina,
        porPagina,
        busqueda,
        cargando,
        setBusqueda,
        setPagina,
        recargar,
    } = useTabCancionesAdmin();

    const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
    const esBusqueda = busqueda.trim().length >= 2;
    const { t } = useT();

    return (
        <div className="tabCancionesAdmin">
            {/* Barra de controles */}
            <div className="cancionesAdminAcciones">
                <div className="adminBusquedaContenedor">
                    <Search size={14} className="adminBusquedaIcono" />
                    <CampoTexto
                        className="adminUsuariosBusqueda"
                        variante="bordado"
                        placeholder={t('admin.buscar.canciones')}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                <div className="cancionesAdminBotones">
                    <span className="cancionesAdminTotal">{t('admin.canciones', { total: String(total) })}</span>
                    <BotonBase onClick={recargar} variante="secundario" disabled={cargando}>
                        <RefreshCw size={14} /> {t('admin.recargar')}
                    </BotonBase>
                </div>
            </div>

            {/* Estado de carga */}
            {cargando && (
                <div className="cancionesAdminCargando">
                    <Loader2 size={20} className="adminSpinner" />
                </div>
            )}

            {/* Sin resultados */}
            {!cargando && canciones.length === 0 && (
                <EstadoVacio
                    mensaje={esBusqueda ? 'No se encontraron canciones con esa búsqueda.' : 'No hay canciones registradas.'}
                    icono={<Music size={24} />}
                />
            )}

            {/* Tabla */}
            {!cargando && canciones.length > 0 && (
                <div className="adminTablaContenedor">
                    <table className="adminTabla">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Titulo</th>
                                <th>Artista</th>
                                <th>Genero</th>
                                <th>Año</th>
                                <th>BPM</th>
                                <th>Sampleada</th>
                                <th>Samplea</th>
                                <th>Creada</th>
                            </tr>
                        </thead>
                        <tbody>
                            {canciones.map((c) => (
                                <tr key={c.id}>
                                    <td className="cancionesAdminId">{c.id}</td>
                                    <td className="cancionesAdminTitulo" title={c.titulo}>
                                        <a href={`/musica/cancion/${c.slug}`} target="_blank" rel="noopener noreferrer">
                                            {c.titulo}
                                        </a>
                                    </td>
                                    <td className="cancionesAdminArtista" title={c.artistaNombre ?? ''}>
                                        {c.artistaNombre ?? '—'}
                                    </td>
                                    <td>{c.genero ?? '—'}</td>
                                    <td>{c.anio ?? '—'}</td>
                                    <td>{c.bpm ?? '—'}</td>
                                    <td className="cancionesAdminNumero">{c.totalSampleada}</td>
                                    <td className="cancionesAdminNumero">{c.totalSamplea}</td>
                                    <td className="cancionesAdminFecha">{formatearFecha(c.creadoAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Paginación — solo cuando no hay búsqueda activa (buscar no soporta paginación server-side) */}
            {!esBusqueda && totalPaginas > 1 && (
                <div className="cancionesAdminPaginacion">
                    <BotonBase
                        variante="secundario"
                        tamano="sm"
                        disabled={pagina <= 1}
                        onClick={() => setPagina(pagina - 1)}
                    >
                        <ChevronLeft size={14} />
                    </BotonBase>
                    <span className="cancionesAdminPaginaInfo">
                        Página {pagina} de {totalPaginas}
                    </span>
                    <BotonBase
                        variante="secundario"
                        tamano="sm"
                        disabled={pagina >= totalPaginas}
                        onClick={() => setPagina(pagina + 1)}
                    >
                        <ChevronRight size={14} />
                    </BotonBase>
                </div>
            )}
        </div>
    );
};
