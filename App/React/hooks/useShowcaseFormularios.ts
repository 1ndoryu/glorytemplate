/*
 * Hook: useShowcaseFormularios
 * Estado del showcase de formularios (dev): campos de texto, búsqueda, tabs.
 * Extraído de ShowcaseFormularios.tsx para consistencia SRP.
 */

import { useState } from 'react';

export const useShowcaseFormularios = () => {
    const [busqueda, setBusqueda] = useState('');
    const [tabActiva, setTabActiva] = useState('samples');
    const [campoTexto, setCampoTexto] = useState('');
    const [campoArea, setCampoArea] = useState('');

    return {
        busqueda,
        setBusqueda,
        tabActiva,
        setTabActiva,
        campoTexto,
        setCampoTexto,
        campoArea,
        setCampoArea,
    };
};
