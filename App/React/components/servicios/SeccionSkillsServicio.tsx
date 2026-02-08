/**
 * Componente: SeccionSkillsServicio
 * Lista de habilidades/competencias del servicio.
 * Al hacer click en una skill se muestra un tooltip con la descripción.
 * Tipo Skill centralizado en types/contenido.ts (DRY).
 */
import React, {useState} from 'react';
import {ArrowRight} from 'lucide-react';
import {SeccionHeader} from '../ui/SeccionHeader';
import {Skill} from '../../types/contenido';
import './SeccionSkillsServicio.css';

interface SeccionSkillsServicioProps {
    skills?: Skill[];
}

export const SeccionSkillsServicio: React.FC<SeccionSkillsServicioProps> = ({skills = []}) => {
    const [skillActiva, setSkillActiva] = useState<string | number | null>(null);

    if (!skills || skills.length === 0) {
        return null;
    }

    const toggleSkill = (id: string | number) => {
        setSkillActiva(prev => prev === id ? null : id);
    };

    return (
        <section className="seccionSkillsServicio">
            <div className="skillsContenedor">
                <SeccionHeader titulo="Capabilities" />
                <div className="skillsLista">
                    {skills.map(skill => (
                        <div
                            key={skill.id}
                            className={`skillItem ${skillActiva === skill.id ? 'skillItemActivo' : ''}`}
                            onClick={() => toggleSkill(skill.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && toggleSkill(skill.id)}
                        >
                            <div className="skillContenido">
                                <h3 className="skillTitulo">{skill.titulo}</h3>
                                <div className="skillIcono">
                                    <ArrowRight className="skillArrow" />
                                </div>
                            </div>
                            {skill.descripcion && skillActiva === skill.id && (
                                <div className="skillDescripcion">
                                    <p>{skill.descripcion}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
