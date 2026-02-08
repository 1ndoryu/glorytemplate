/**
 * Componente: SeccionSkillsServicio
 * Lista de habilidades/competencias del servicio.
 * Tipo Skill centralizado en types/contenido.ts (DRY).
 */
import React from 'react';
import {ArrowRight} from 'lucide-react';
import {SeccionHeader} from '../ui/SeccionHeader';
import {Skill} from '../../types/contenido';
import './SeccionSkillsServicio.css';

interface SeccionSkillsServicioProps {
    skills?: Skill[];
}

export const SeccionSkillsServicio: React.FC<SeccionSkillsServicioProps> = ({skills = []}) => {
    if (!skills || skills.length === 0) {
        return null; // O mostrar un fallback, pero mejor no mostrar nada si no hay data
    }

    return (
        <section className="seccionSkillsServicio">
            <div className="skillsContenedor">
                <SeccionHeader titulo="Capabilities" />
                <div className="skillsLista">
                    {skills.map(skill => (
                        <div key={skill.id} className="skillItem">
                            <div className="skillImagenWrapper">
                                <img src={skill.imagen} alt={skill.titulo} className="skillImagen" loading="lazy" />
                            </div>
                            <div className="skillContenido">
                                <h3 className="skillTitulo">{skill.titulo}</h3>
                                {/* Usamos un div en lugar de 'a' porque es informativo por ahora */}
                                <div className="skillIcono">
                                    <ArrowRight className="skillArrow" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
