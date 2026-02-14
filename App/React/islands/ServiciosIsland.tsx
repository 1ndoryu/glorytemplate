/*
 * ServiciosIsland - Pagina de servicios de Cosmo Revenue
 * Replica la estructura exacta de services.php de App1.
 * Clases: services-container, marketing-section, marketing-grid, etc.
 */

import React from 'react';
import '@app/styles/init.css';
import '@app/styles/servicios.css';

import { CosmoHeader } from '@app/components/layout/CosmoHeader';
import { PaginaHero } from '@app/components/layout/PaginaHero';
import { Marquee } from '@app/components/ui/Marquee';
import { TarjetaFeature } from '@app/components/ui/TarjetaFeature';
import {
    planesMarketing,
    planesConsultoria,
    planesRevenue,
} from '@app/components/cosmo/DatosPlanesServicio';

export function ServiciosIsland(): React.JSX.Element {
    const orbit = planesConsultoria[0];

    return (
        <div className="services-container">
            <CosmoHeader />

            <PaginaHero
                textoScript="Nuestros"
                textoPrincipal="SERVICIOS"
                subtitulo="Combinamos Revenue, Marketing y Consultoría para impulsar tus ingresos. Soluciones flexibles que crecen al ritmo de tu negocio."
            />

            {/* Marketing */}
            <section className="marketing-section">
                <div className="section-tag">
                    <svg viewBox="0 0 26.19 26.19" fill="currentColor"><path d="m13.09,0l1.37,8.33c.29,1.74,1.65,3.11,3.39,3.39l8.33,1.37-8.33,1.37c-1.74.29-3.11,1.65-3.39,3.39l-1.37,8.33-1.37-8.33c-.29-1.74-1.65-3.11-3.39-3.39L0,13.09l8.33-1.37c1.74-.29,3.11-1.65,3.39-3.39L13.09,0Z" /></svg>
                    <p className="section-tag-text">Estrategia digital</p>
                </div>

                <h2 className="section-title">Marketing y estrategia</h2>
                <p className="section-subtitle">Impulsa tu visibilidad y venta directa. Desde el lanzamiento hasta la consolidación de tu posicionamiento digital.</p>

                <div className="marketing-grid">
                    {planesMarketing.map((plan, i) => {
                        const posiciones = ['left', 'center', 'right'];
                        return (
                            <TarjetaFeature
                                key={plan.slug}
                                titulo={plan.nombre}
                                subtitulo={plan.subtitulo.toUpperCase()}
                                descripcion={plan.descripcion}
                                features={plan.features}
                                enlace={`/servicio-${plan.slug}/`}
                                textoEnlace="Solicitar info →"
                                posicion={posiciones[i]}
                            />
                        );
                    })}
                </div>
            </section>

            {/* Consultoría */}
            <section className="consulting-section">
                <div className="consulting-content">
                    <div className="consulting-left">
                        <div className="section-tag">
                            <svg viewBox="0 0 26.19 26.19" fill="currentColor"><path d="m13.09,0l1.37,8.33c.29,1.74,1.65,3.11,3.39,3.39l8.33,1.37-8.33,1.37c-1.74.29-3.11,1.65-3.39,3.39l-1.37,8.33-1.37-8.33c-.29-1.74-1.65-3.11-3.39-3.39L0,13.09l8.33-1.37c1.74-.29,3.11-1.65,3.39-3.39L13.09,0Z" /></svg>
                            <p className="section-tag-text">Auditoría y Tecnología</p>
                        </div>
                        <h2 className="section-title">Consultoría &amp; Mapeo</h2>
                        <p className="section-text">
                            Antes de correr, ordenamos el camino. Un servicio esencial para alojamientos que buscan diagnóstico, limpieza de datos y una hoja de ruta clara antes de la temporada.
                        </p>
                        <p className="section-text">
                            Auditamos y conectamos tu ecosistema tecnológico (PMS, Channel Manager, OTAs) para asegurar que la distribución funcione sin fisuras.
                        </p>
                    </div>

                    <div className="consulting-right">
                        <div className="orbit-card">
                            <div className="orbit-header">
                                <span className="rocket-icon-conl">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
                                </span>
                                <h3>Orbit</h3>
                            </div>
                            <p className="orbit-desc">Empieza con claridad</p>
                            <p className="orbit-subdesc">Auditoría inicial y puesta a punto. Ideal para diagnóstico y hoja de ruta antes de temporada.</p>

                            <div className="orbit-features">
                                <ul className="orbit-features-list">
                                    {orbit.features.slice(0, 3).map((f, i) => (
                                        <li key={i}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <ul className="orbit-features-list">
                                    {orbit.features.slice(3, 6).map((f, i) => (
                                        <li key={i}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <a href="/servicio-orbit/" className="btn-orbit">Solicitar diagnóstico +</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Revenue */}
            <section className="revenue-section">
                <div className="section-tag">
                    <svg viewBox="0 0 26.19 26.19" fill="currentColor"><path d="m13.09,0l1.37,8.33c.29,1.74,1.65,3.11,3.39,3.39l8.33,1.37-8.33,1.37c-1.74.29-3.11,1.65-3.39,3.39l-1.37,8.33-1.37-8.33c-.29-1.74-1.65-3.11-3.39-3.39L0,13.09l8.33-1.37c1.74-.29,3.11-1.65,3.39-3.39L13.09,0Z" /></svg>
                    <p className="section-tag-text">Gestión Mensual Recurrente</p>
                </div>
                <h2 className="section-title">Revenue Management</h2>
                <p className="section-subtitle">Programas adaptados a la madurez de tu alojamiento. Desde auditoría técnica hasta gestión 360.</p>

                <div className="services-revenue">
                    <div className="services-revenue-grid">
                        {planesRevenue.map((plan, i) => {
                            const posiciones = ['left', 'right-bottom'];
                            return (
                                <TarjetaFeature
                                    key={plan.slug}
                                    titulo={plan.nombre}
                                    subtitulo={plan.subtitulo}
                                    descripcion={plan.descripcion}
                                    features={plan.features}
                                    enlace={`/servicio-${plan.slug}/`}
                                    textoEnlace={i === 0 ? 'Consultar propuestas →' : 'Reunión estratégica →'}
                                    posicion={posiciones[i]}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="services-revenue-bottom">
                    <div className="services-revenue-bottom-content">
                        <h2 className="section-title-italic">¿Dudas sobre qué plan elegir?</h2>
                        <p className="revenue-bottom-text">Hablemos. Analizaremos tu situación y te recomendamos la órbita adecuada para tu despegue.</p>
                        <a href="/contacto/" className="btn-submit-revenue">Contactar</a>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default ServiciosIsland;
