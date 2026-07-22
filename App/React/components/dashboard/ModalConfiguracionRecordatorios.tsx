/*
 * ModalConfiguracionRecordatorios
 * Modal para ajustar opciones del panel de Recordatorios.
 * Replica el patrón de ModalConfiguracionScratchpad.
 */

import {Modal} from '../shared/Modal';
import {Select} from '../ui';
import type {ConfigRecordatorios, TamanoFuenteRecordatorio} from '../../types/recordatorios';

/* Opciones de intervalo predefinidas */
const OPCIONES_INTERVALO = [
    {valor: 30_000, etiqueta: '30 segundos'},
    {valor: 60_000, etiqueta: '1 minuto'},
    {valor: 300_000, etiqueta: '5 minutos'},
    {valor: 900_000, etiqueta: '15 minutos'},
    {valor: 1_800_000, etiqueta: '30 minutos'},
    {valor: 3_600_000, etiqueta: '1 hora'},
    {valor: 10_800_000, etiqueta: '3 horas'},
    {valor: 21_600_000, etiqueta: '6 horas'},
    {valor: 43_200_000, etiqueta: '12 horas'},
    {valor: 86_400_000, etiqueta: '1 día'}
];

interface ModalConfiguracionRecordatoriosProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    configuracion: ConfigRecordatorios;
    onCambiarIntervaloMs: (ms: number) => void;
    onCambiarTamanoFuente: (tamano: TamanoFuenteRecordatorio) => void;
}

export function ModalConfiguracionRecordatorios({
    estaAbierto, onCerrar, configuracion,
    onCambiarIntervaloMs, onCambiarTamanoFuente
}: ModalConfiguracionRecordatoriosProps): JSX.Element {
    return (
        <Modal estaAbierto={estaAbierto} onCerrar={onCerrar} titulo="Configuración Recordatorios">
            <div className="contenedorOpcionesConfig">
                {/* Tamaño de fuente */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Tamaño de fuente</span>
                        <span className="descripcionOpcionConfig">Ajustar legibilidad del texto del recordatorio</span>
                    </div>
                    <Select
                        claseAdicional="selectOpcionConfig"
                        value={configuracion.tamanoFuente}
                        onChange={e => onCambiarTamanoFuente(e.target.value as TamanoFuenteRecordatorio)}
                        opciones={[
                            {valor: 'pequeno', etiqueta: 'Pequeño'},
                            {valor: 'normal', etiqueta: 'Normal'},
                            {valor: 'grande', etiqueta: 'Grande'}
                        ]}
                    />
                </div>

                <div className="separadorOpcionesConfig" />

                {/* Intervalo de rotación */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Intervalo de rotación</span>
                        <span className="descripcionOpcionConfig">Cada cuánto tiempo se muestra un recordatorio diferente</span>
                    </div>
                    <Select
                        claseAdicional="selectOpcionConfig"
                        value={configuracion.intervaloMs}
                        onChange={e => {
                            const ms = Number(e.target.value);
                            onCambiarIntervaloMs(ms);
                        }}
                        opciones={OPCIONES_INTERVALO}
                    />
                </div>
            </div>
        </Modal>
    );
}
