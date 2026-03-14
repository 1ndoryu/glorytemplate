/*
 * ExplorarCancionesIsland — QK18/QK22 (reescrito de C812)
 * Pagina de musica estilo Spotify con secciones horizontales.
 * Sin tabs: secciones reemplazan los modos de ordenamiento.
 * Busqueda mantiene diseno de lista larga (TarjetaCancionFeed).
 */

import { useFiltrosStore } from '@app/stores/filtrosStore';
import { SeccionesMusica } from '@app/components/canciones/SeccionesMusica';
import { BusquedaCanciones } from '@app/components/canciones/BusquedaCanciones';

export const ExplorarCancionesIsland = (): JSX.Element => {
    const busqueda = useFiltrosStore(s => s.busqueda);

    if (busqueda.trim()) {
        return <BusquedaCanciones busqueda={busqueda} />;
    }

    return <SeccionesMusica />;
};
