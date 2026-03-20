/*
 * Componente: NavPublico — Kamples (QQ82 + 183A-110-D)
 * Nav visible en todas las páginas para usuarios no autenticados.
 * Contiene: logo, enlaces públicos (Explorar, Colecciones, Música, Blog), botones de auth.
 * [193A-37] Buscador inline en rutas de contenido (colecciones, musica, descubrir)
 * para que el usuario pueda ver, editar y limpiar la búsqueda activa.
 * [183A-111] i18n: strings via useT (es/en/ja). SelectorIdioma en barra derecha.
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
import { useT } from '@app/utils/i18n';
import { SelectorIdioma } from '@app/components/ui/SelectorIdioma';
import '../../styles/componentes/navPublico.css';

/* [193A-37] Rutas donde se muestra el buscador inline */
const RUTAS_CON_BUSCADOR = ['/colecciones/', '/musica/', '/descubrir/'];

export const NavPublico = (): JSX.Element => {
    const { t } = useT();
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
                    <GloryLink href="/descubrir/" className="navPublicoEnlace">{t('nav.explorar')}</GloryLink>
                    <GloryLink href="/colecciones/" className="navPublicoEnlace">{t('nav.colecciones')}</GloryLink>
                    <GloryLink href="/musica/" className="navPublicoEnlace">{t('nav.musica')}</GloryLink>
                    <GloryLink href="/blog/" className="navPublicoEnlace">{t('nav.blog')}</GloryLink>
                    {/* [2003A-7] Enlace precios oculto temporalmente (quedó mal, usuario lo arreglará) */}
                    {/* <GloryLink href="/precios/" className="navPublicoEnlace navPublicoEnlacePrecios">{t('nav.precios')}</GloryLink> */}
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
                            placeholder={t('nav.buscar')}
                            value={busquedaLocal}
                            onChange={e => manejarCambio(e.target.value)}
                            aria-label={t('nav.buscar')}
                        />
                        {busquedaLocal && (
                            <BotonBase
                                variante="ghost"
                                tamano="sm"
                                className="navPublicoBuscadorLimpiar"
                                onClick={limpiar}
                                aria-label={t('nav.limpiarBusqueda')}
                            >
                                <X size={12} />
                            </BotonBase>
                        )}
                    </div>
                )}
                {/* [193A-54] Select sin banderas en nav */}
                <SelectorIdioma variante="select" className="navPublicoIdioma" />
                <BotonBase variante="ghost" tamano="md" onClick={() => abrirAuth('login')}>
                    {t('nav.iniciarSesion')}
                </BotonBase>
                <BotonBase variante="primario" tamano="md" onClick={() => abrirAuth('registro')}>
                    {t('nav.crearCuenta')}
                </BotonBase>
            </div>
        </nav>
    );
};
