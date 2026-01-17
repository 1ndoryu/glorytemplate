/**
 * SeccionAlumnos
 *
 * Vista de gestión de alumnos.
 * Placeholder que se implementará en Fase 4.
 */

import {Boton, Tarjeta, TarjetaBody} from '../ui';
import {IconoUsuarios} from '../icons';

export function SeccionAlumnos() {
    return (
        <div className="capSeccion capAnimFadeIn">
            <div className="capSeccion__header">
                <h2 className="capTitulo capTitulo--lg">Alumnos</h2>
                <p className="capTexto capTexto--secundario">Gestiona los alumnos de tu autoescuela</p>
            </div>

            <Tarjeta className="capMt--lg">
                <TarjetaBody>
                    <div className="capPlaceholder">
                        <IconoUsuarios size={48} />
                        <h3 className="capTitulo capTitulo--sm capMt--md">Próximamente</h3>
                        <p className="capTexto capTexto--secundario capMt--sm">La gestión de alumnos estará disponible en la siguiente fase de desarrollo.</p>
                        <Boton variante="primario" className="capMt--lg" disabled>
                            Añadir Alumno
                        </Boton>
                    </div>
                </TarjetaBody>
            </Tarjeta>
        </div>
    );
}

export default SeccionAlumnos;
