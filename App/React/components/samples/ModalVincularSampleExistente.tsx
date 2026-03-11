/*
 * Componente: ModalVincularSampleExistente — L7.4
 * Modal para buscar entre samples propios y vincular uno a una relacion de sampleo.
 * Si no se especifica lado, muestra paso previo de seleccion (fuente/destino).
 * Separacion vista-logica: toda la logica de busqueda en useVincularSample.
 */

import { useState } from 'react';
import { Search, Music, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { InputBusqueda } from '@app/components/ui/InputBusqueda';
import { useVincularSample } from '@app/hooks/useVincularSample';
import type { LadoRelacion } from '@app/services/apiRelaciones';
import '@app/styles/componentes/modalVincularSample.css';

interface InfoLado {
    cancionId: number;
    titulo: string;
    artista?: string;
}

interface ModalVincularSampleExistenteProps {
    abierto: boolean;
    relacionId: number;
    ladoInicial?: LadoRelacion | null;
    ladoFuente?: InfoLado;
    ladoDestino?: InfoLado;
    onCerrar: () => void;
    onExito?: () => void;
}

/* Paso de seleccion de lado */
const SelectorLadoVincular = ({
    ladoFuente, ladoDestino, onSeleccionar,
}: {
    ladoFuente?: InfoLado;
    ladoDestino?: InfoLado;
    onSeleccionar: (lado: LadoRelacion) => void;
}) => (
    <div className="vincularSampleSelector">
        <p className="vincularSampleDescripcion">
            ¿A qué lado de la relación quieres vincular tu sample?
        </p>
        <div className="vincularSampleSelectorOpciones">
            <BotonBase
                variante="ghost"
                className="vincularSampleSelectorBtn"
                onClick={() => onSeleccionar('fuente')}
                type="button"
            >
                <ArrowLeft size={16} />
                <div className="vincularSampleSelectorInfo">
                    <strong>Fuente (sampleada)</strong>
                    {ladoFuente && <span>{ladoFuente.artista ? `${ladoFuente.artista} — ` : ''}{ladoFuente.titulo}</span>}
                </div>
            </BotonBase>
            <BotonBase
                variante="ghost"
                className="vincularSampleSelectorBtn"
                onClick={() => onSeleccionar('destino')}
                type="button"
            >
                <ArrowRight size={16} />
                <div className="vincularSampleSelectorInfo">
                    <strong>Destino (samplea)</strong>
                    {ladoDestino && <span>{ladoDestino.artista ? `${ladoDestino.artista} — ` : ''}{ladoDestino.titulo}</span>}
                </div>
            </BotonBase>
        </div>
    </div>
);

export const ModalVincularSampleExistente = ({
    abierto,
    relacionId,
    ladoInicial = null,
    ladoFuente,
    ladoDestino,
    onCerrar,
    onExito,
}: ModalVincularSampleExistenteProps): JSX.Element | null => {
    const [ladoSeleccionado, setLadoSeleccionado] = useState<LadoRelacion | null>(ladoInicial);
    const ladoEfectivo = ladoSeleccionado ?? ladoInicial;
    /* Permite volver al selector de lado (solo si no hay ladoInicial fijo) */
    const puedeVolverASelector = !ladoInicial;

    const {
        query, buscar, resultados, cargando, vinculando,
        seleccionado, setSeleccionado, confirmar,
    } = useVincularSample({
        relacionId,
        lado: ladoEfectivo ?? 'fuente',
        onExito,
    });

    if (!abierto) return null;

    const mostrarSelector = !ladoEfectivo;

    const volverASelector = () => {
        setLadoSeleccionado(null);
        setSeleccionado(null);
    };

    return (
        <Modal
            abierto={abierto}
            onCerrar={onCerrar}
            tamano="normal"
            pie={
                mostrarSelector ? undefined : (
                    <div className="vincularSamplePie">
                        {puedeVolverASelector && (
                            <BotonBase variante="ghost" onClick={volverASelector} type="button">
                                <ArrowLeft size={14} />
                                Cambiar lado
                            </BotonBase>
                        )}
                        <BotonBase variante="ghost" onClick={onCerrar} type="button">
                            Cancelar
                        </BotonBase>
                        <BotonBase
                            variante="primario"
                            onClick={confirmar}
                            disabled={!seleccionado || vinculando}
                            type="button"
                        >
                            {vinculando ? 'Vinculando...' : 'Vincular'}
                        </BotonBase>
                    </div>
                )
            }
        >
            {mostrarSelector ? (
                <SelectorLadoVincular
                    ladoFuente={ladoFuente}
                    ladoDestino={ladoDestino}
                    onSeleccionar={setLadoSeleccionado}
                />
            ) : (
                <div className="vincularSampleContenido">

                    <InputBusqueda
                        placeholder="Buscar entre tus samples..."
                        valor={query}
                        onChange={buscar}
                        debounceMs={0}
                    />

                    {cargando && (
                        <div className="vincularSampleCargando">
                            <Search size={16} className="vincularSampleSpinner" />
                            <span>Buscando...</span>
                        </div>
                    )}

                    {!cargando && resultados.length === 0 && (
                        <div className="vincularSampleVacio">
                            <Music size={24} />
                            <span>No se encontraron samples</span>
                        </div>
                    )}

                    {resultados.length > 0 && (
                        <ul className="vincularSampleLista">
                            {resultados.map(sample => {
                                const activo = seleccionado?.id === sample.id;
                                return (
                                    <li key={sample.id}>
                                        <BotonBase
                                            variante="ghost"
                                            type="button"
                                            className={`vincularSampleItem ${activo ? 'vincularSampleItemActivo' : ''}`}
                                            onClick={() => setSeleccionado(activo ? null : sample)}
                                        >
                                            {sample.imagenUrl ? (
                                                <img
                                                    src={sample.imagenUrl}
                                                    alt=""
                                                    className="vincularSampleItemImagen"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="vincularSampleItemImagenVacia">
                                                    <Music size={16} />
                                                </div>
                                            )}
                                            <div className="vincularSampleItemInfo">
                                                <span className="vincularSampleItemTitulo">{sample.titulo}</span>
                                                <span className="vincularSampleItemMeta">
                                                    {sample.tags.slice(0, 3).map(t => `#${t}`).join(' ')}
                                                    {sample.duracion > 0 && ` — ${Math.round(sample.duracion)}s`}
                                                </span>
                                            </div>
                                            {activo && <Check size={16} className="vincularSampleCheck" />}
                                        </BotonBase>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </Modal>
    );
};
