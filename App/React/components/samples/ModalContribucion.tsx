/*
 * Componente: ModalContribucion
 * Formulario para proponer una nueva relacion sample entre canciones.
 * Vista pura; toda la logica esta en useContribucion.
 */

import { Modal } from '../ui/Modal';
import { BotonBase } from '../ui/BotonBase';
import { CampoTexto } from '../ui/CampoTexto';
import { SelectorMenu } from '../ui/SelectorMenu';
import { Radio } from '../ui/Radio';
import { BuscadorCanciones } from './BuscadorCanciones';
import { useContribucion } from '../../hooks/useContribucion';
import type { TipoElemento } from '../../types/cancion';
import { ETIQUETAS_TIPO_ELEMENTO } from '../../types/cancion';
import '../../styles/componentes/modalContribucion.css';

const TIPOS_RELACION = [
    { valor: 'sample',        etiqueta: 'Sample directo' },
    { valor: 'cover',         etiqueta: 'Cover' },
    { valor: 'remix',         etiqueta: 'Remix' },
    { valor: 'interpolation', etiqueta: 'Interpolación' },
] as const;

interface ModalContribucionProps {
    abierto: boolean;
    cancionBaseId: number;
    cancionBaseTitulo: string;
    onCerrar: () => void;
    onExito?: () => void;
}

export function ModalContribucion({
    abierto,
    cancionBaseId,
    onCerrar,
    onExito,
}: ModalContribucionProps): JSX.Element {
    const {
        modo,
        tipoRelacion,
        tipoElemento,
        cancionSeleccionada,
        nuevoTitulo,
        nuevoArtista,
        nuevoYoutubeUrl,
        agregarNueva,
        timingFuente,
        timingDestino,
        estado,
        setModo,
        setTipoRelacion,
        setTipoElemento,
        seleccionarCancion,
        setNuevoTitulo,
        setNuevoArtista,
        setNuevoYoutubeUrl,
        setAgregarNueva,
        setTimingFuente,
        setTimingDestino,
        enviar,
        resetear,
    } = useContribucion();

    const cerrar = () => {
        resetear();
        onCerrar();
    };

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await enviar(cancionBaseId);
        if (ok && onExito) {
            onExito();
            setTimeout(() => cerrar(), 1500);
        }
    };

    return (
        <Modal
            abierto={abierto}
            onCerrar={cerrar}
            tamano="normal"
            pie={
                !estado.exito && (
                    <div className="modalContribucionPie">
                        <BotonBase variante="ghost" onClick={cerrar} disabled={estado.cargando}>
                            Cancelar
                        </BotonBase>
                        <BotonBase
                            variante="primario"
                            type="submit"
                            form="formContribucion"
                            disabled={estado.cargando}
                        >
                            {estado.cargando ? 'Enviando...' : 'Enviar contribución'}
                        </BotonBase>
                    </div>
                )
            }
        >
            {estado.exito ? (
                <div className="modalContribucionExito">
                    <p>Contribución enviada. </p>
                    <p className="modalContribucionExitoSub">
                        Un moderador la revisará pronto. Gracias por contribuir.
                    </p>
                </div>
            ) : (
                <form id="formContribucion" onSubmit={manejarEnvio} className="modalContribucionForm">

                    {/* Modo de la relacion */}
                    <fieldset className="modalContribucionFieldset">
                        <div className="modalContribucionModos">
                            <Radio
                                name="modo"
                                value="esta_samplea"
                                checked={modo === 'esta_samplea'}
                                onChange={() => { setModo('esta_samplea'); seleccionarCancion(null); }}
                                label="Esta canción samplea a..."
                                className={`modalContribucionModo${modo === 'esta_samplea' ? ' activo' : ''}`}
                            />
                            <Radio
                                name="modo"
                                value="fue_sampleada"
                                checked={modo === 'fue_sampleada'}
                                onChange={() => { setModo('fue_sampleada'); seleccionarCancion(null); }}
                                label="Esta canción fue sampleada por..."
                                className={`modalContribucionModo${modo === 'fue_sampleada' ? ' activo' : ''}`}
                            />
                        </div>
                    </fieldset>

                    {/* Buscar cancion relacionada */}
                    <div className="modalContribucionCampo">
                        <label className="modalContribucionLabel">
                            {modo === 'esta_samplea' ? 'Canción fuente (la original)' : 'Canción que la sampleó'}
                        </label>
                        {!agregarNueva && (
                            <BuscadorCanciones
                                placeholder="Buscar en la base de datos..."
                                onSeleccionar={seleccionarCancion}
                                onAgregarNueva={() => setAgregarNueva(true)}
                                cancionActual={cancionSeleccionada}
                            />
                        )}
                    </div>

                    {/* Formulario de nueva cancion */}
                    {agregarNueva && (
                        <div className="modalContribucionNueva">
                            <div className="modalContribucionNuevaHeader">
                                <span>Nueva canción</span>
                                <BotonBase
                                    variante="ghost"
                                    tamano="sm"
                                    onClick={() => { setAgregarNueva(false); }}
                                    type="button"
                                >
                                    Volver a buscar
                                </BotonBase>
                            </div>
                            <CampoTexto
                                etiqueta="Título de la canción"
                                value={nuevoTitulo}
                                onChange={(e) => setNuevoTitulo(e.target.value)}
                                required
                                placeholder="Ej: Stan"
                            />
                            <CampoTexto
                                etiqueta="Artista"
                                value={nuevoArtista}
                                onChange={(e) => setNuevoArtista(e.target.value)}
                                required
                                placeholder="Ej: Eminem"
                            />
                            <CampoTexto
                                etiqueta="URL de YouTube (opcional)"
                                value={nuevoYoutubeUrl}
                                onChange={(e) => setNuevoYoutubeUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                        </div>
                    )}

                    {/* Tipo de relacion */}
                    <div className="modalContribucionCampo">
                        <label className="modalContribucionLabel">Tipo de relación</label>
                        <div className="modalContribucionOpciones">
                            {TIPOS_RELACION.map((t) => (
                                <Radio
                                    key={t.valor}
                                    name="tipoRelacion"
                                    value={t.valor}
                                    checked={tipoRelacion === t.valor}
                                    onChange={() => setTipoRelacion(t.valor)}
                                    label={t.etiqueta}
                                    className={`modalContribucionOpcion${tipoRelacion === t.valor ? ' activo' : ''}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Tipo de elemento */}
                    <SelectorMenu
                        etiqueta="Elemento sampleado"
                        valor={tipoElemento}
                        onChange={(v) => setTipoElemento(v as TipoElemento)}
                        opciones={Object.entries(ETIQUETAS_TIPO_ELEMENTO).map(([valor, etiqueta]) => ({ valor, etiqueta }))}
                    />

                    {/* Timings: momento exacto del sample en cada cancion */}
                    <div className="modalContribucionTimings">
                        <CampoTexto
                            etiqueta={modo === 'esta_samplea'
                                ? 'Timing en la cancion actual (destino)'
                                : 'Timing en la cancion actual (fuente)'}
                            value={modo === 'esta_samplea' ? timingDestino : timingFuente}
                            onChange={(e) => modo === 'esta_samplea'
                                ? setTimingDestino(e.target.value)
                                : setTimingFuente(e.target.value)}
                            placeholder="ej: 1:23"
                            required
                        />
                        <CampoTexto
                            etiqueta={modo === 'esta_samplea'
                                ? 'Timing en la cancion fuente (original)'
                                : 'Timing en la cancion que la sampleo'}
                            value={modo === 'esta_samplea' ? timingFuente : timingDestino}
                            onChange={(e) => modo === 'esta_samplea'
                                ? setTimingFuente(e.target.value)
                                : setTimingDestino(e.target.value)}
                            placeholder="ej: 0:45"
                            required
                        />
                    </div>

                    {estado.error && (
                        <p className="modalContribucionError">{estado.error}</p>
                    )}
                </form>
            )}
        </Modal>
    );
}
