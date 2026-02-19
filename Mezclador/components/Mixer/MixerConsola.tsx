/*
 * MixerConsola — Contenedor principal del Mixer.
 * Ventana flotante con scroll horizontal de InsertStrips + PanelDetalleInsert.
 * Conecta mixerStore con los componentes hijos.
 */

import { useCallback, useRef, useEffect } from 'react';
import { VentanaFlotante } from '../VentanaFlotante';
import { InsertStrip } from './InsertStrip';
import { PanelDetalleInsert } from './PanelDetalleInsert';
import { useMixerStore } from '../../stores/mixerStore';
import { useMixer } from '../../hooks/useMixer';
import type { BandaEQ } from '../../types/mezclador';

export const MixerConsola = (): JSX.Element => {
    const {
        inserts,
        sincronizarInsert,
        sincronizarEQ,
    } = useMixer();

    const insertSeleccionado = useMixerStore(s => s.insertSeleccionado);
    const seleccionarInsert = useMixerStore(s => s.seleccionarInsert);
    const setVolumenInsert = useMixerStore(s => s.setVolumenInsert);
    const setPanInsert = useMixerStore(s => s.setPanInsert);
    const toggleMuteInsert = useMixerStore(s => s.toggleMuteInsert);
    const toggleSoloInsert = useMixerStore(s => s.toggleSoloInsert);
    const setNombreInsert = useMixerStore(s => s.setNombreInsert);
    const setColorInsert = useMixerStore(s => s.setColorInsert);
    const toggleEQ = useMixerStore(s => s.toggleEQ);
    const setBandaEQ = useMixerStore(s => s.setBandaEQ);
    const toggleSlot = useMixerStore(s => s.toggleSlot);

    const insertActivo = inserts.find(i => i.id === insertSeleccionado) ?? null;
    const scrollRef = useRef<HTMLDivElement>(null);

    /* Scroll horizontal con rueda del mouse */
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const handler = (e: WheelEvent) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                el.scrollLeft += e.deltaY;
            }
        };
        el.addEventListener('wheel', handler, { passive: false });
        return () => el.removeEventListener('wheel', handler);
    }, []);

    /* Wrappers que sincronizan store + Web Audio */
    const alSetVolumen = useCallback((id: number, vol: number) => {
        setVolumenInsert(id, vol);
        sincronizarInsert(id);
    }, [setVolumenInsert, sincronizarInsert]);

    const alSetPan = useCallback((id: number, pan: number) => {
        setPanInsert(id, pan);
        sincronizarInsert(id);
    }, [setPanInsert, sincronizarInsert]);

    const alToggleMute = useCallback((id: number) => {
        toggleMuteInsert(id);
        sincronizarInsert(id);
    }, [toggleMuteInsert, sincronizarInsert]);

    const alToggleSolo = useCallback((id: number) => {
        toggleSoloInsert(id);
        sincronizarInsert(id);
    }, [toggleSoloInsert, sincronizarInsert]);

    const alToggleEQ = useCallback((id: number) => {
        toggleEQ(id);
        sincronizarEQ(id);
    }, [toggleEQ, sincronizarEQ]);

    const alCambioBandaEQ = useCallback((insertId: number, indice: number, cambios: Partial<BandaEQ>) => {
        setBandaEQ(insertId, indice, cambios);
        sincronizarEQ(insertId);
    }, [setBandaEQ, sincronizarEQ]);

    const alToggleSlot = useCallback((insertId: number, indice: number) => {
        toggleSlot(insertId, indice);
    }, [toggleSlot]);

    const alClickSlot = useCallback((_insertId: number, _indice: number) => {
        /* TO-DO: Abrir modal de configuración de efecto */
    }, []);

    return (
        <VentanaFlotante
            id="mixer"
            titulo="Mixer"
            ancho={900}
        >
            <div className="mixerConsola">
                {/* Área scrollable de strips */}
                <div className="mixerConsolaStrips" ref={scrollRef}>
                    {/* Master primero */}
                    <InsertStrip
                        key={0}
                        insert={inserts[0]}
                        seleccionado={insertSeleccionado === 0}
                        onSeleccionar={seleccionarInsert}
                        onSetVolumen={alSetVolumen}
                        onSetPan={alSetPan}
                        onToggleMute={alToggleMute}
                        onToggleSolo={alToggleSolo}
                    />

                    {/* Separador Master */}
                    <div className="mixerConsolaSeparador" />

                    {/* Inserts 1-16 */}
                    {inserts.slice(1).map(insert => (
                        <InsertStrip
                            key={insert.id}
                            insert={insert}
                            seleccionado={insertSeleccionado === insert.id}
                            onSeleccionar={seleccionarInsert}
                            onSetVolumen={alSetVolumen}
                            onSetPan={alSetPan}
                            onToggleMute={alToggleMute}
                            onToggleSolo={alToggleSolo}
                        />
                    ))}
                </div>

                {/* Panel detalle del insert seleccionado */}
                <PanelDetalleInsert
                    insert={insertActivo}
                    onToggleEQ={alToggleEQ}
                    onCambioBandaEQ={alCambioBandaEQ}
                    onToggleSlot={alToggleSlot}
                    onClickSlot={alClickSlot}
                    onCambioNombre={setNombreInsert}
                    onCambioColor={setColorInsert}
                />
            </div>
        </VentanaFlotante>
    );
};
