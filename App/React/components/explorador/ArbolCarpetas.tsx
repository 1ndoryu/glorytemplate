/*
 * ArbolCarpetas — Panel lateral de carpetas para el explorador (C349).
 * Muestra el árbol completo de carpetas con drag-drop y creación inline.
 * Se muestra solo cuando el usuario activa el sidebar (oculto por defecto).
 */

import { type RefObject } from 'react';
import { FolderOpen, Folder, FolderClosed, ChevronDown, ChevronRight, FolderPlus } from 'lucide-react';
import { useT } from '@app/utils/i18n/useT';
import { BotonBase } from '@app/components/ui/BotonBase';
import { CampoTexto } from '@app/components/ui/CampoTexto';

interface CarpetaInfo {
    primaria: string;
    total: number;
    subcarpetas: { nombre: string; total: number }[];
}

interface ArbolCarpetasProps {
    todasCarpetas: CarpetaInfo[];
    carpetaActiva: string;
    subcarpetaActiva: string;
    carpetasDesplegadas: Set<string>;
    carpetaDragOver: string | null;
    cargando: boolean;
    crearCarpetaAbierto: boolean;
    nuevaCarpetaNombre: string;
    inputCrearRef: RefObject<HTMLInputElement | null>;
    totalGeneral: number;
    seleccionarCarpeta: (c: string) => void;
    seleccionarSubcarpeta: (c: string, s: string) => void;
    toggleDesplegada: (c: string) => void;
    setCrearCarpetaAbierto: (v: boolean | ((prev: boolean) => boolean)) => void;
    setNuevaCarpetaNombre: (v: string) => void;
    manejarCrearCarpeta: () => void;
    manejarDragOver: (e: React.DragEvent, carpetaId: string) => void;
    manejarDragLeave: () => void;
    manejarDropEnCarpeta: (e: React.DragEvent, primaria: string, subcarpeta?: string) => void;
}

export const ArbolCarpetas = ({
    todasCarpetas,
    carpetaActiva,
    subcarpetaActiva,
    carpetasDesplegadas,
    carpetaDragOver,
    cargando,
    crearCarpetaAbierto,
    nuevaCarpetaNombre,
    inputCrearRef,
    seleccionarCarpeta,
    seleccionarSubcarpeta,
    toggleDesplegada,
    setCrearCarpetaAbierto,
    setNuevaCarpetaNombre,
    manejarCrearCarpeta,
    manejarDragOver,
    manejarDragLeave,
    manejarDropEnCarpeta,
}: ArbolCarpetasProps): JSX.Element => {
    const { t } = useT();
    return (
    <div className="exploradorCarpetas">
        <div className="exploradorCarpetaCabecera">
            <h3 className="exploradorCarpetaTitulo">{t('sync.carpetas')}</h3>
            <BotonBase
                variante="ghost"
                tamano="sm"
                soloIcono
                className="exploradorCrearCarpetaBtn"
                onClick={() => setCrearCarpetaAbierto((prev: boolean) => !prev)}
                type="button"
                title={t('sync.crearCarpeta')}
            >
                <FolderPlus size={16} />
            </BotonBase>
        </div>

        {crearCarpetaAbierto && (
            <div className="exploradorCrearCarpetaDialog">
                <CampoTexto
                    ref={inputCrearRef as RefObject<HTMLInputElement>}
                    className="exploradorCrearCarpetaInput"
                    type="text"
                    placeholder={carpetaActiva ? t('sync.nombreSubcarpeta') : t('sync.nombreCarpeta')}
                    value={nuevaCarpetaNombre}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNuevaCarpetaNombre(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') manejarCrearCarpeta();
                        if (e.key === 'Escape') setCrearCarpetaAbierto(false);
                    }}
                    maxLength={100}
                />
                <BotonBase
                    variante="primario"
                    tamano="sm"
                    className="exploradorCrearCarpetaConfirmar"
                    onClick={manejarCrearCarpeta}
                    type="button"
                    disabled={!nuevaCarpetaNombre.trim()}
                >
                    {t('comun.crear')}
                </BotonBase>
            </div>
        )}

        {todasCarpetas.map((carpeta) => {
            const estaDesplegada = carpetasDesplegadas.has(carpeta.primaria);
            const tieneSubcarpetas = carpeta.subcarpetas.length > 0;
            const esDragOver = carpetaDragOver === carpeta.primaria;

            return (
                <div key={carpeta.primaria}>
                    <div
                        className={`exploradorCarpetaFila ${esDragOver ? 'exploradorCarpetaDragOver' : ''}`}
                        onDragOver={(e) => manejarDragOver(e, carpeta.primaria)}
                        onDragLeave={manejarDragLeave}
                        onDrop={(e) => manejarDropEnCarpeta(e, carpeta.primaria)}
                    >
                        {tieneSubcarpetas ? (
                            <BotonBase
                                variante="ghost"
                                tamano="sm"
                                soloIcono
                                className="exploradorCarpetaChevron"
                                onClick={() => toggleDesplegada(carpeta.primaria)}
                                type="button"
                                title={estaDesplegada ? 'Colapsar' : 'Expandir'}
                            >
                                {estaDesplegada
                                    ? <ChevronDown size={14} />
                                    : <ChevronRight size={14} />
                                }
                            </BotonBase>
                        ) : (
                            <span className="exploradorCarpetaChevronPlaceholder" />
                        )}
                        <BotonBase
                            variante="ghost"
                            className={`exploradorCarpetaItem ${carpetaActiva === carpeta.primaria && !subcarpetaActiva ? 'carpetaActiva' : ''}`}
                            onClick={() => seleccionarCarpeta(carpeta.primaria)}
                            type="button"
                        >
                            {estaDesplegada
                                ? <FolderOpen size={16} />
                                : <FolderClosed size={16} />
                            }
                            <span className="exploradorCarpetaNombre">{carpeta.primaria}</span>
                            <span className="exploradorCarpetaConteo">{carpeta.total}</span>
                        </BotonBase>
                    </div>

                    {estaDesplegada && tieneSubcarpetas && (
                        <div className="exploradorSubcarpetas">
                            {carpeta.subcarpetas.map((sub) => {
                                const subDragOver = carpetaDragOver === `${carpeta.primaria}/${sub.nombre}`;
                                return (
                                    <BotonBase
                                        key={sub.nombre}
                                        variante="ghost"
                                        tamano="sm"
                                        className={`exploradorSubcarpetaItem ${carpetaActiva === carpeta.primaria && subcarpetaActiva === sub.nombre ? 'subcarpetaActiva' : ''} ${subDragOver ? 'exploradorCarpetaDragOver' : ''}`}
                                        onClick={() => seleccionarSubcarpeta(carpeta.primaria, sub.nombre)}
                                        onDragOver={(e: React.DragEvent<HTMLButtonElement>) => manejarDragOver(e, `${carpeta.primaria}/${sub.nombre}`)}
                                        onDragLeave={manejarDragLeave}
                                        onDrop={(e: React.DragEvent<HTMLButtonElement>) => manejarDropEnCarpeta(e, carpeta.primaria, sub.nombre)}
                                        type="button"
                                        title={sub.nombre}
                                    >
                                        <Folder size={12} />
                                        <span>{sub.nombre}</span>
                                        <span className="exploradorCarpetaConteo">{sub.total}</span>
                                    </BotonBase>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        })}

        {todasCarpetas.length === 0 && !cargando && (
            <div className="exploradorCarpetaVacia">
                Sin carpetas aún. Descarga o sube samples para empezar.
            </div>
        )}
    </div>
    );
};
