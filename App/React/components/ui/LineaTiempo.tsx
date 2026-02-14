import React from 'react';

export interface PasoTimeline {
    letra: string;
    titulo: string;
    subtitulo: string;
    descripcion: string;
    claseMarcador?: string;
}

interface LineaTiempoProps {
    pasos: PasoTimeline[];
    className?: string;
}

/*
 * Timeline vertical de la metodologia COSMO.
 * Replica la estructura exacta de about_method() en about.php.
 * Clases: about-timeline, method-step, step-content, step-title,
 * step-text-wrapper, step-name, step-desc, step-marker, step-marker-c/o/s/m
 */
export function LineaTiempo({
    pasos,
    className = '',
}: LineaTiempoProps): React.JSX.Element {
    return (
        <div className={`about-timeline ${className}`}>
            {pasos.map((paso, index) => (
                <div key={index} className="method-step">
                    <div className="step-content">
                        <h3 className="step-title">{paso.titulo}</h3>
                        <div className="step-text-wrapper">
                            <span className="step-name">{paso.subtitulo}</span>
                            <p className="step-desc">{paso.descripcion}</p>
                        </div>
                    </div>
                    <div className={`step-marker ${paso.claseMarcador || ''}`}>
                        {paso.letra}
                    </div>
                </div>
            ))}
        </div>
    );
}
