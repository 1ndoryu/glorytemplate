/**
 * MainAppIsland - Aplicacion principal con router SPA
 *
 * Esta island reemplaza a las islands individuales cuando se quiere
 * navegacion sin recarga de pagina. En lugar de renderizar una island
 * especifica por pagina, se renderiza esta unica island que contiene
 * el router y maneja la navegacion internamente.
 *
 * Uso en PHP:
 * echo ReactIslands::render('MainAppIsland');
 *
 * El router detecta automaticamente la ruta actual y renderiza
 * el componente correspondiente (Home, Services, etc.)
 */

import {AppRouter} from '../components/router';

export function MainAppIsland(): JSX.Element {
    // El path inicial se obtiene de la URL actual
    // El router se encarga de todo lo demas
    return <AppRouter />;
}
