/*
 * Componente: NavPublico — Kamples (QQ82 + 183A-110-D)
 * Nav visible en todas las páginas para usuarios no autenticados.
 * Contiene: logo, enlaces públicos (Explorar, Colecciones, Música, Blog), botones de auth.
 * [193A-37] Buscador inline en rutas de contenido (colecciones, musica, descubrir)
 * para que el usuario pueda ver, editar y limpiar la búsqueda activa.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Input } from '@app/components/ui/Input';
import { LogoKamples } from '@app/components/ui/LogoKamples';
import { GloryLink } from '@/core/router';
import { useAuthModalStore } from '@app/stores/authModalStore';
import { useNavigationStore } from '@/core/router';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import '../../styles/componentes/navPublico.css';

/* [193A-37] Rutas donde se muestra el buscador inline */
const RUTAS_CON_BUSCADOR = ['/colecciones/', '/musica/', '/descubrir/'];

export const NavPublico = (): JSX.Element => {
    const abrirAuth = useAuthModalStore(s => s.abrir);
    const rutaActual = useNavigationStore(s => s.rutaActual);
    const busquedaGlobal = useFiltrosStore(s => s.busqueda);
    const setBusquedaGlobal = useFiltrosStore(s => s.setBusqueda);

    /* [193A-37] Mostrar buscador solo en rutas de contenido, no en home */
    const mostrarBuscador = RUTAS_CON_BUSCADOR.some(r => rutaActual.startsWith(r));

    const [busquedaLocal, setBusquedaLocal] = useState(busquedaGlobal);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    /* Sincronizar cuando cambia la búsqueda global externamente */
    useEffect(() => {
        setBusquedaLocal(busquedaGlobal);
    }, [busquedaGlobal]);

    const aplicar = useCallback((valor: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setBusquedaGlobal(valor);
        }, 300);
    }, [setBusquedaGlobal]);

    const manejarCambio = (valor: string) => {
        setBusquedaLocal(valor);
        aplicar(valor);
    };

    const limpiar = () => {
        setBusquedaLocal('');
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setBusquedaGlobal('');
    };

    /* Cleanup debounce */
    useEffect(() => {
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, []);

    return (
        <nav className="navPublico">
            <div className="navPublicoIzquierda">
                <GloryLink href="/" className="navPublicoLogo">
                    <LogoKamples tamano={22} />
                </GloryLink>
                <div className="navPublicoEnlaces">
                    <GloryLink href="/descubrir/" className="navPublicoEnlace">Explorar</GloryLink>
                    <GloryLink href="/colecciones/" className="navPublicoEnlace">Colecciones</GloryLink>
                    <GloryLink href="/musica/" className="navPublicoEnlace">Música</GloryLink>
                    <GloryLink href="/blog/" className="navPublicoEnlace">Blog</GloryLink>
                </div>
            </div>
            <div className="navPublicoDerecha">
                {/* [193A-37] Buscador inline en rutas de contenido */}
                {mostrarBuscador && (
                    <div className="navPublicoBuscador">
                        <Search size={14} className="navPublicoBuscadorIcono" />
                        <Input
                            type="text"
                            className="navPublicoBuscadorInput"
                            placeholder="Buscar..."
                            value={busquedaLocal}
                            onChange={e => manejarCambio(e.target.value)}
                            aria-label="Buscar"
                        />
                        {busquedaLocal && (
                            <BotonBase
                                variante="ghost"
                                tamano="sm"
                                className="navPublicoBuscadorLimpiar"
                                onClick={limpiar}
                                aria-label="Limpiar búsqueda"
                            >
                                <X size={12} />
                            </BotonBase>
                        )}
                    </div>
                )}
                <BotonBase variante="ghost" tamano="md" onClick={() => abrirAuth('login')}>
                    Iniciar sesión
                </BotonBase>
                <BotonBase variante="primario" tamano="md" onClick={() => abrirAuth('registro')}>
                    Crear cuenta
                </BotonBase>
            </div>
        </nav>
    );
};
