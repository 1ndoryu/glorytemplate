/*
 * ExplorarCancionesIsland — QK18/QK22 (reescrito de C812)
 * Pagina de musica estilo Spotify con secciones horizontales.
 * QK105: Tab registrada en TopBar para evitar bug de tabs vacias.
 * Busqueda mantiene diseno de lista larga (TarjetaCancionFeed).
 */

import { useEffect } from 'react';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { SeccionesMusica } from '@app/components/canciones/SeccionesMusica';
import { BusquedaCanciones } from '@app/components/canciones/BusquedaCanciones';

export const ExplorarCancionesIsland = (): JSX.Element => {
    const busqueda = useFiltrosStore(s => s.busqueda);
    const setTabs = useTabsTopBarStore(s => s.setTabs);

    /* QK105: Registrar tab "Música" en TopBar */
    useEffect(() => {
        setTabs([{ id: 'musica', etiqueta: 'Música' }], 'musica');
        return () => { setTabs([]); };
    }, [setTabs]);

    if (busqueda.trim()) {
        return <BusquedaCanciones busqueda={busqueda} />;
    }

    return <SeccionesMusica />;
};
