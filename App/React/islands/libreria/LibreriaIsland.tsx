/*
 * LibreriaIsland — Kamples
 * Librería personal: explorar colecciones públicas, mis colecciones y subidos.
 * Lógica extraída a useLibreriaIsland (SRP).
 */

import { FolderOpen, Upload, Music, Plus, Globe } from 'lucide-react';
import { BotonBase } from '@app/components/ui';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { TarjetaColeccion } from '@app/components/social/TarjetaColeccion';
import { ModalColeccion } from '@app/components/social/ModalColeccion';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import { useLibreriaIsland } from '@app/hooks/useLibreriaIsland';
import { useAuthStore } from '@app/stores/authStore';
import '../../styles/componentes/libreria.css';

const TABS_LIBRERIA = [
    { id: 'explorar', etiqueta: 'Explorar' },
    { id: 'colecciones', etiqueta: 'Mis Colecciones' },
    { id: 'subidos', etiqueta: 'Subidos' },
];

const ICONOS_TAB: Record<string, JSX.Element> = {
    explorar: <Globe size={16} />,
    colecciones: <FolderOpen size={16} />,
    subidos: <Upload size={16} />,
};

const mensajeVacio: Record<string, { titulo: string; texto: string }> = {
    colecciones: { titulo: 'Sin colecciones', texto: 'Crea tu primera colección para organizar samples.' },
    subidos: { titulo: 'Sin samples subidos', texto: 'Sube tu primer sample para compartirlo.' },
};

export const LibreriaIsland = (): JSX.Element => {
    const {
        samples, colecciones, coleccionesPublicas, cargando,
        modalColeccionAbierto, setModalColeccionAbierto, coleccionEditando,
        tabActiva, menu, navegar, abrirSubirModal,
        manejarClickTitulo, manejarComentar, manejarLike,
        abrirNuevaColeccion, manejarEditarColeccion, manejarEliminarColeccion, manejarGuardarColeccion,
    } = useLibreriaIsland();
    /* Necesario para mostrar opciones de editar/eliminar en colecciones propias del tab Explorar */
    const usuario = useAuthStore(s => s.usuario);

    useTabsIsla('LibreriaIsland', TABS_LIBRERIA, 'explorar');

    return (
        <div className="libreriaContenedor" id="seccionLibreria">

            {cargando ? (
                <div className="libreriaVacio">
                    <Music size={32} className="libreriaVacioIcono" />
                    <p>Cargando...</p>
                </div>
            ) : tabActiva === 'explorar' ? (
                coleccionesPublicas.length === 0 ? (
                    <div className="libreriaVacio">
                        <Globe size={32} />
                        <h3 className="libreriaVacioTitulo">Sin colecciones públicas</h3>
                        <p className="libreriaVacioTexto">Aún no hay colecciones compartidas por otros usuarios.</p>
                    </div>
                ) : (
                    <div className="libreriaGridColecciones">
                        {coleccionesPublicas.map(col => {
                            /* Mostrar editar/eliminar solo para colecciones propias del usuario */
                            const esPropia = usuario?.id !== undefined && String(col.usuarioId) === String(usuario.id);
                            return (
                                <TarjetaColeccion key={col.id} coleccion={col}
                                    onEditar={esPropia ? manejarEditarColeccion : undefined}
                                    onEliminar={esPropia ? manejarEliminarColeccion : undefined}
                                />
                            );
                        })}
                    </div>
                )
            ) : tabActiva === 'colecciones' ? (
                colecciones.length === 0 ? (
                    <div className="libreriaVacio">
                        <FolderOpen size={32} />
                        <h3 className="libreriaVacioTitulo">Sin colecciones</h3>
                        <p className="libreriaVacioTexto">Crea tu primera colección para organizar samples.</p>
                        <BotonBase variante="primario" tamano="sm" onClick={abrirNuevaColeccion}>
                            <Plus size={14} /> Nueva colección
                        </BotonBase>
                    </div>
                ) : (
                    <div className="libreriaGridColecciones">
                        {colecciones.map(col => (
                            <TarjetaColeccion key={col.id} coleccion={col}
                                onEditar={manejarEditarColeccion} onEliminar={manejarEliminarColeccion} />
                        ))}
                    </div>
                )
            ) : samples.length === 0 ? (
                <div className="libreriaVacio">
                    {ICONOS_TAB[tabActiva]}
                    <h3 className="libreriaVacioTitulo">{mensajeVacio[tabActiva]?.titulo}</h3>
                    <p className="libreriaVacioTexto">{mensajeVacio[tabActiva]?.texto}</p>
                    {tabActiva === 'subidos' && (
                        <BotonBase variante="primario" tamano="sm" onClick={abrirSubirModal}>Subir sample</BotonBase>
                    )}
                </div>
            ) : (
                <div className="listaDeSamples">
                    {samples.map(sample => (
                        <TarjetaSample key={sample.id} sample={sample} onLike={manejarLike} onMenu={menu.abrirMenu}
                            onClickCreador={u => navegar(`/perfil/${u}`)} onClickTitulo={manejarClickTitulo} onComentar={manejarComentar} />
                    ))}
                </div>
            )}

            <MenuContextual abierto={menu.estado.abierto} onCerrar={menu.cerrarMenu} items={menu.items} x={menu.estado.x} y={menu.estado.y} />
            <ModalColeccion abierto={modalColeccionAbierto} onCerrar={() => setModalColeccionAbierto(false)}
                onGuardar={manejarGuardarColeccion} coleccion={coleccionEditando} />
        </div>
    );
};

export default conAutenticacion(LibreriaIsland as React.ComponentType<Record<string, unknown>>);
