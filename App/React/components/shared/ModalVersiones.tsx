import React from 'react';
import {Modal} from './Modal';
import {HISTORIAL_VERSIONES, Version, Cambio} from '../../data/changelog';
import {Tag, Calendar, CheckCircle, PlusCircle, AlertCircle} from 'lucide-react';
import '../../styles/dashboard/shared/modalVersiones.css';

interface ModalVersionesProps {
    estaAbierto: boolean;
    onCerrar: () => void;
}

const IconoTipoCambio = ({tipo}: {tipo: Cambio['tipo']}) => {
    switch (tipo) {
        case 'nuevo':
            return <PlusCircle size={14} className="iconoCambio iconoNuevo" />;
        case 'mejora':
            return <CheckCircle size={14} className="iconoCambio iconoMejora" />;
        case 'arreglo':
            return <AlertCircle size={14} className="iconoCambio iconoArreglo" />;
        default:
            return <Tag size={14} className="iconoCambio" />;
    }
};

const ItemCambio = ({cambio}: {cambio: Cambio}) => (
    <li className={`itemCambio tipo-${cambio.tipo}`}>
        <IconoTipoCambio tipo={cambio.tipo} />
        <span className="textoCambio">{cambio.descripcion}</span>
    </li>
);

const GrupoVersion = ({version}: {version: Version}) => (
    <div className="grupoVersion">
        <div className="encabezadoVersion">
            <div className="infoVersion">
                <Tag size={16} className="iconoVersion" />
                <span className="numeroVersion">{version.version}</span>
            </div>
            <div className="fechaVersion">
                <Calendar size={14} className="iconoFecha" />
                <span>{version.fecha}</span>
            </div>
        </div>
        <ul className="listaCambios">
            {version.cambios.map((cambio, index) => (
                <ItemCambio key={index} cambio={cambio} />
            ))}
        </ul>
    </div>
);

export const ModalVersiones: React.FC<ModalVersionesProps> = ({estaAbierto, onCerrar}) => {
    return (
        <Modal estaAbierto={estaAbierto} onCerrar={onCerrar} titulo="Historial de Versiones">
            <div className="contenedorVersiones">
                {HISTORIAL_VERSIONES.map((version, index) => (
                    <GrupoVersion key={index} version={version} />
                ))}
            </div>
        </Modal>
    );
};
