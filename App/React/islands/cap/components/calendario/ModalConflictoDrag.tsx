/**
 * ModalConflictoDrag
 *
 * Modal que aparece cuando el usuario intenta mover una clase (Drag & Drop)
 * a un horario que ya está ocupado por otra clase.
 *
 * Ofrece la opción de desplazar las clases afectadas hacia abajo.
 */

import React from 'react';
import {Modal, Boton} from '../ui';
import type {Clase} from '../../types';
import {getAsignatura} from '../../constants';
import './ModalConflictoDrag.css';

interface ConflictoData {
    claseMoviendo: Clase;
    claseExistente: Clase;
    nuevaHoraInicio: string;
    nuevaHoraFin: string;
}

interface ModalConflictoDragProps {
    abierto: boolean;
    conflicto: ConflictoData | null;
    onCancelar: () => void;
    onDesplazar: () => void;
    onMoverCercano?: () => void;
}

export function ModalConflictoDrag({abierto, conflicto, onCancelar, onDesplazar, onMoverCercano}: ModalConflictoDragProps) {
    if (!conflicto) return null;

    const asigMoviendo = getAsignatura(conflicto.claseMoviendo.asignaturaId);
    const asigExistente = getAsignatura(conflicto.claseExistente.asignaturaId);

    return (
        <Modal abierto={abierto} onCerrar={onCancelar} titulo="Conflicto de Horario" tamano="md">
            <div className="conflictoDrag">
                <p className="conflictoDrag__mensaje">
                    Estás intentando mover la clase <strong>{asigMoviendo?.nombre}</strong> a las <strong>{conflicto.nuevaHoraInicio}</strong>, pero ese horario ya está ocupado por <strong>{asigExistente?.nombre}</strong>.
                </p>

                <div className="conflictoDrag__comparacion">
                    <div className="conflictoDrag__clase" style={{borderLeftColor: asigMoviendo?.color}}>
                        <div className="conflictoDrag__tituloClase">Moviendo: {asigMoviendo?.nombre}</div>
                        <div className="conflictoDrag__horaClase">
                            {conflicto.nuevaHoraInicio} - {conflicto.nuevaHoraFin}
                        </div>
                    </div>

                    <div className="conflictoDrag__flecha">💥</div>

                    <div className="conflictoDrag__clase conflictoDrag__clase--existente" style={{borderLeftColor: asigExistente?.color}}>
                        <div className="conflictoDrag__tituloClase">Choca con: {asigExistente?.nombre}</div>
                        <div className="conflictoDrag__horaClase">
                            {conflicto.claseExistente.horaInicio} - {conflicto.claseExistente.horaFin}
                        </div>
                    </div>
                </div>

                <div className="conflictoDrag__acciones">
                    <Boton variante="ghost" onClick={onCancelar}>
                        Cancelar
                    </Boton>
                    {onMoverCercano && (
                        <Boton variante="secundario" onClick={onMoverCercano}>
                            Mover al más cercano
                        </Boton>
                    )}
                    <Boton variante="peligro" onClick={onDesplazar}>
                        Desplazar clases
                    </Boton>
                </div>
            </div>
        </Modal>
    );
}

export default ModalConflictoDrag;
