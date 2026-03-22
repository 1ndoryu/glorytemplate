/* [223A-7] ColeccionCabecera — Extraído de ColeccionDetalleIsland para cumplir SRP/300 líneas.
 * Breadcrumbs + imagen + info + botones de acción (guardar, descargar, play/autoplay, menú, deshacer). */

import { ArrowLeft, BookmarkPlus, BookmarkCheck, Lock, Globe, Download, Play, Pause, MoreHorizontal, Loader2, Undo2, ChevronRight } from 'lucide-react';
import { ImgOptimizada } from '@app/components/ui/ImgOptimizada';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Badge } from '@app/components/ui/Badge';
import EnlaceCreador from '@app/components/social/EnlaceCreador';
import { obtenerImagenColorPorTexto } from '@app/services/imagenesColor';
import type { Coleccion, ColeccionResumen } from '@app/types';
import type { CombinacionPendiente } from '@app/services/apiColecciones';

interface ColeccionCabeceraProps {
    coleccion: Coleccion;
    coleccionPadre: Pick<ColeccionResumen, 'id' | 'nombre' | 'slug'> | null;
    navegar: (ruta: string) => void;
    usuarioId: number | undefined;
    metasComunes: string[];
    guardada: boolean;
    manejarGuardar: () => void;
    descargando: boolean;
    manejarDescargarZip: () => void;
    esPadre: boolean;
    modoAutoplayForzado: boolean;
    iniciarAutoplayForzado: () => void;
    detenerAutoplayForzado: () => void;
    cargandoAleatorio: boolean;
    esPreviewActiva: boolean;
    iniciarPreview: (id: number) => void;
    cargandoPreview: boolean;
    abrirMenuColeccion: (e: React.MouseEvent) => void;
    combinacionPendiente: CombinacionPendiente | null;
    manejarDeshacerCombinacion: () => void;
    deshaciendoCombinacion: boolean;
}

export const ColeccionCabecera = ({
    coleccion, coleccionPadre, navegar, usuarioId, metasComunes,
    guardada, manejarGuardar, descargando, manejarDescargarZip,
    esPadre, modoAutoplayForzado, iniciarAutoplayForzado, detenerAutoplayForzado, cargandoAleatorio,
    esPreviewActiva, iniciarPreview, cargandoPreview,
    abrirMenuColeccion, combinacionPendiente, manejarDeshacerCombinacion, deshaciendoCombinacion,
}: ColeccionCabeceraProps): JSX.Element => {
    const imagenHeader = coleccion.imagenUrl || obtenerImagenColorPorTexto(coleccion.nombre);

    return (
        <>
            {/* QL114: Breadcrumbs para subcollecciones, botón volver para raíz */}
            {coleccion.parentId !== null && coleccionPadre ? (
                <nav className="coleccionMigas" aria-label="Navegación colección">
                    <BotonBase variante="ghost" tamano="ninguno" className="coleccionMigasEnlace" onClick={() => navegar('/libreria/')} type="button">
                        Librería
                    </BotonBase>
                    <ChevronRight size={14} className="coleccionMigasSeparador" />
                    <BotonBase variante="ghost" tamano="ninguno" className="coleccionMigasEnlace" onClick={() => navegar(`/coleccion/${coleccionPadre.slug ?? coleccionPadre.id}/`)} type="button">
                        {coleccionPadre.nombre}
                    </BotonBase>
                    <ChevronRight size={14} className="coleccionMigasSeparador" />
                    <span className="coleccionMigasActual">{coleccion.nombre}</span>
                </nav>
            ) : (
                <BotonBase variante="ghost" className="botonVolver" onClick={() => navegar('/libreria/')} type="button">
                    <ArrowLeft size={18} />
                    <span>Librería</span>
                </BotonBase>
            )}

            {/* Header de la colección */}
            <div className="coleccionHeader">
                <ImgOptimizada className="coleccionHeaderImg" src={imagenHeader} alt={coleccion.nombre} w={400} quality={80} />
                <div className="coleccionHeaderInfo">
                    <div className="coleccionHeaderTipo">
                        {coleccion.esPublica ? (
                            <Badge variante="acento"><Globe size={12} /> Pública</Badge>
                        ) : (
                            <Badge variante="neutro"><Lock size={12} /> Privada</Badge>
                        )}
                    </div>
                    <h1 className="coleccionNombre">{coleccion.nombre}</h1>
                    {coleccion.descripcion && (
                        <p className="coleccionDescripcion">{coleccion.descripcion}</p>
                    )}
                    <div className="coleccionMeta">
                        {coleccion.usuario && (
                            <EnlaceCreador
                                username={coleccion.usuario.username}
                                nombreVisible={coleccion.usuario.nombreVisible}
                                avatarUrl={coleccion.usuario.avatarUrl ?? undefined}
                                verificado={coleccion.usuario.verificado}
                                tamanoAvatar="xs"
                                className="coleccionCreador"
                            />
                        )}
                        <span className="coleccionStats">
                            {coleccion.totalSamples} samples
                        </span>
                        {/* C108: 5 metas más comunes separadas por • */}
                        {metasComunes.length > 0 && (
                            <span className="coleccionMetasComunes">
                                {metasComunes.join(' \u2022 ')}
                            </span>
                        )}
                    </div>
                    {/* C109+C125+C137: Botones con texto — guardar (solo ajena), descargar, preview */}
                    <div className="coleccionAcciones">
                        {/* C137: Ocultar guardar en colecciones propias */}
                        {coleccion.usuarioId !== usuarioId && (
                            <BotonBase variante="ghost"
                                className={`coleccionAccionBtn ${guardada ? 'coleccionAccionActivo' : ''}`}
                                onClick={manejarGuardar}
                                type="button"
                                title={guardada ? 'Guardada' : 'Guardar colección'}
                            >
                                {guardada ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
                                <span>{guardada ? 'Guardada' : 'Guardar'}</span>
                            </BotonBase>
                        )}
                        <BotonBase variante="ghost"
                            className="coleccionAccionBtn"
                            type="button"
                            title="Descargar colección"
                            onClick={manejarDescargarZip}
                            disabled={descargando}
                        >
                            <Download size={16} />
                            <span>{descargando ? 'Descargando...' : 'Descargar'}</span>
                        </BotonBase>
                        {/* [223A-8] Padre → autoplay forzado continuo; hija → preview normal */}
                        {esPadre ? (
                            <BotonBase variante="ghost"
                                className={`coleccionAccionBtn ${modoAutoplayForzado ? 'coleccionAccionActivo' : ''}`}
                                type="button"
                                title={modoAutoplayForzado ? 'Detener reproducción' : 'Aleatorio continuo'}
                                onClick={modoAutoplayForzado ? detenerAutoplayForzado : iniciarAutoplayForzado}
                                disabled={cargandoAleatorio}
                            >
                                {cargandoAleatorio ? <Loader2 size={16} className="tarjetaColeccionSpinner" /> : modoAutoplayForzado ? <Pause size={16} /> : <Play size={16} />}
                                <span>{cargandoAleatorio ? 'Cargando...' : modoAutoplayForzado ? 'Detener' : 'Aleatorio'}</span>
                            </BotonBase>
                        ) : (
                            <BotonBase variante="ghost"
                                className={`coleccionAccionBtn ${esPreviewActiva ? 'coleccionAccionActivo' : ''}`}
                                type="button"
                                title={esPreviewActiva ? 'Detener preview' : 'Preview'}
                                onClick={() => iniciarPreview(coleccion.id)}
                                disabled={cargandoPreview}
                            >
                                {cargandoPreview ? <Loader2 size={16} className="tarjetaColeccionSpinner" /> : esPreviewActiva ? <Pause size={16} /> : <Play size={16} />}
                                <span>{cargandoPreview ? 'Cargando...' : esPreviewActiva ? 'Detener' : 'Preview'}</span>
                            </BotonBase>
                        )}
                        {/* C127: Menú 3 puntos */}
                        <BotonBase variante="ghost"
                            className="coleccionAccionBtn"
                            type="button"
                            title="Más opciones"
                            onClick={abrirMenuColeccion}
                        >
                            <MoreHorizontal size={16} />
                        </BotonBase>
                        {/* QL115: Botón deshacer combinación (7 días) */}
                        {combinacionPendiente?.hayCombinacion && (
                            <BotonBase variante="ghost"
                                className="coleccionAccionBtn coleccionAccionUndo"
                                type="button"
                                title={`Deshacer combinación con "${combinacionPendiente.origenNombre}"`}
                                onClick={manejarDeshacerCombinacion}
                                disabled={deshaciendoCombinacion}
                            >
                                <Undo2 size={16} />
                                <span>{deshaciendoCombinacion ? 'Deshaciendo...' : 'Deshacer'}</span>
                            </BotonBase>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
