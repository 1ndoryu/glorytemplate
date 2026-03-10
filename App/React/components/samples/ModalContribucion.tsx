/*
 * Componente: ModalContribucion
 * Formulario para proponer una nueva relacion sample entre canciones.
 * Vista pura; toda la logica esta en useContribucion.
 */

import { Modal } from '../ui/Modal';
import { BotonBase } from '../ui/BotonBase';
import { CampoTexto } from '../ui/CampoTexto';
import { BuscadorCanciones } from './BuscadorCanciones';
import { useContribucion } from '../../hooks/useContribucion';
import '../../styles/componentes/modalContribucion.css';

const TIPOS_RELACION = [
    { valor: 'sample',        etiqueta: 'Sample directo' },
    { valor: 'cover',         etiqueta: 'Cover' },
    { valor: 'remix',         etiqueta: 'Remix' },
    { valor: 'interpolation', etiqueta: 'Interpolacion' },
] as const;

const TIPOS_ELEMENTO = [
    { valor: 'hook_riff',         etiqueta: 'Hook / Riff' },
    { valor: 'vocals_lyrics',     etiqueta: 'Vocales / Letra' },
    { valor: 'drums',             etiqueta: 'Bateria' },
    { valor: 'bass',              etiqueta: 'Bajo' },
    { valor: 'keys_synth',        etiqueta: 'Teclados / Sintetizador' },
    { valor: 'sound_effect',      etiqueta: 'Efecto de sonido' },
    { valor: 'multiple_elements', etiqueta: 'Multiples elementos' },
    { valor: 'other',             etiqueta: 'Otro' },
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
    cancionBaseTitulo,
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
        estado,
        setModo,
        setTipoRelacion,
        setTipoElemento,
        seleccionarCancion,
        setNuevoTitulo,
        setNuevoArtista,
        setNuevoYoutubeUrl,
        setAgregarNueva,
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
            titulo="Proponer relacion de sample"
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
                            {estado.cargando ? 'Enviando...' : 'Enviar contribucion'}
                        </BotonBase>
                    </div>
                )
            }
        >
            {estado.exito ? (
                <div className="modalContribucionExito">
                    <p>Contribucion enviada. </p>
                    <p className="modalContribucionExitoSub">
                        Un moderador la revisara pronto. Gracias por contribuir.
                    </p>
                </div>
            ) : (
                <form id="formContribucion" onSubmit={manejarEnvio} className="modalContribucionForm">

                    {/* Modo de la relacion */}
                    <fieldset className="modalContribucionFieldset">
                        <legend className="modalContribucionLeyenda">
                            ¿Como se relaciona <strong>{cancionBaseTitulo}</strong>?
                        </legend>
                        <div className="modalContribucionModos">
                            <label className={`modalContribucionModo ${modo === 'esta_samplea' ? 'activo' : ''}`}>
                                <input
                                    type="radio"
                                    name="modo"
                                    value="esta_samplea"
                                    checked={modo === 'esta_samplea'}
                                    onChange={() => { setModo('esta_samplea'); seleccionarCancion(null); }}
                                />
                                <span>Esta cancion samplea a...</span>
                            </label>
                            <label className={`modalContribucionModo ${modo === 'fue_sampleada' ? 'activo' : ''}`}>
                                <input
                                    type="radio"
                                    name="modo"
                                    value="fue_sampleada"
                                    checked={modo === 'fue_sampleada'}
                                    onChange={() => { setModo('fue_sampleada'); seleccionarCancion(null); }}
                                />
                                <span>Esta cancion fue sampleada por...</span>
                            </label>
                        </div>
                    </fieldset>

                    {/* Buscar cancion relacionada */}
                    <div className="modalContribucionCampo">
                        <label className="modalContribucionLabel">
                            {modo === 'esta_samplea' ? 'Cancion fuente (la original)' : 'Cancion que la sampleo'}
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
                                <span>Nueva cancion</span>
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
                                etiqueta="Titulo de la cancion"
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
                        <label className="modalContribucionLabel">Tipo de relacion</label>
                        <div className="modalContribucionOpciones">
                            {TIPOS_RELACION.map((t) => (
                                <label
                                    key={t.valor}
                                    className={`modalContribucionOpcion ${tipoRelacion === t.valor ? 'activo' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="tipoRelacion"
                                        value={t.valor}
                                        checked={tipoRelacion === t.valor}
                                        onChange={() => setTipoRelacion(t.valor)}
                                    />
                                    {t.etiqueta}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Tipo de elemento */}
                    <div className="modalContribucionCampo">
                        <label className="modalContribucionLabel">Elemento sampleado</label>
                        <select
                            className="modalContribucionSelect"
                            value={tipoElemento}
                            onChange={(e) => setTipoElemento(e.target.value as typeof tipoElemento)}
                        >
                            {TIPOS_ELEMENTO.map((t) => (
                                <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                            ))}
                        </select>
                    </div>

                    {estado.error && (
                        <p className="modalContribucionError">{estado.error}</p>
                    )}
                </form>
            )}
        </Modal>
    );
}
