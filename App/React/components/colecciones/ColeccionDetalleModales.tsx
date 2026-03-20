import { ModalColeccion } from '@app/components/social/ModalColeccion';
import { ModalCombinarColeccion } from '@app/components/social/ModalCombinarColeccion';
import { ModalCrearVolumenColeccion } from '@app/components/social/ModalCrearVolumenColeccion';
import { ModalEliminarColeccion } from '@app/components/social/ModalEliminarColeccion';
import type { Coleccion } from '@app/types';

interface ColeccionDetalleModalesProps {
    coleccion: Coleccion | null;
    esAdmin: boolean;
    modalEditarAbierto: boolean;
    setModalEditarAbierto: (v: boolean) => void;
    manejarGuardarEdicion: (coleccionActualizada: Coleccion) => void;
    modalCombinarAbierto: boolean;
    setModalCombinarAbierto: (v: boolean) => void;
    manejarCombinado: (destinoId: number) => void;
    modalVolumenAbierto: boolean;
    setModalVolumenAbierto: (v: boolean) => void;
    recargarColeccionActual: () => void | Promise<void>;
    modalEliminarAbierto: boolean;
    setModalEliminarAbierto: (v: boolean) => void;
    manejarEliminado: () => void;
}

export const ColeccionDetalleModales = ({
    coleccion,
    esAdmin,
    modalEditarAbierto,
    setModalEditarAbierto,
    manejarGuardarEdicion,
    modalCombinarAbierto,
    setModalCombinarAbierto,
    manejarCombinado,
    modalVolumenAbierto,
    setModalVolumenAbierto,
    recargarColeccionActual,
    modalEliminarAbierto,
    setModalEliminarAbierto,
    manejarEliminado,
}: ColeccionDetalleModalesProps): JSX.Element | null => {
    if (!coleccion) return null;

    return (
        <>
            <ModalColeccion
                abierto={modalEditarAbierto}
                onCerrar={() => setModalEditarAbierto(false)}
                onGuardar={manejarGuardarEdicion}
                coleccion={coleccion}
            />
            <ModalCombinarColeccion
                abierto={modalCombinarAbierto}
                onCerrar={() => setModalCombinarAbierto(false)}
                onCombinado={manejarCombinado}
                coleccion={coleccion}
                esAdmin={esAdmin}
            />
            <ModalCrearVolumenColeccion
                abierto={modalVolumenAbierto}
                onCerrar={() => setModalVolumenAbierto(false)}
                onCreado={recargarColeccionActual}
                coleccion={coleccion}
            />
            <ModalEliminarColeccion
                abierto={modalEliminarAbierto}
                onCerrar={() => setModalEliminarAbierto(false)}
                onEliminado={manejarEliminado}
                coleccion={coleccion}
            />
        </>
    );
};

export default ColeccionDetalleModales;