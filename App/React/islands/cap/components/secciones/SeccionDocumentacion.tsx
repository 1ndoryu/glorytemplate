/**
 * SeccionDocumentacion
 *
 * [2003A-11] Documentación interna del sistema CAP, solo para administradores.
 * Explica cómo funciona el algoritmo de generación, la gestión de perfiles,
 * la configuración de Stripe y los reportes.
 */

import {useState} from 'react';
import {Badge} from '../ui';
import {IconoCalendario, IconoUsuarios, IconoConfiguracion, IconoTarjeta, IconoReportes, IconoFlechaDerecha} from '../icons';
import type {ReactNode} from 'react';
import './seccionDocumentacion.css';

interface SeccionDocProps {
    id: string;
    titulo: string;
    icono: ReactNode;
    abierta: boolean;
    onToggle: () => void;
    children: ReactNode;
}

function SeccionDoc({id, titulo, icono, abierta, onToggle, children}: SeccionDocProps) {
    return (
        <div className="capDocumentacion__seccion" id={id}>
            <button
                type="button"
                className="capDocumentacion__seccionHeader"
                onClick={onToggle}
                aria-expanded={abierta}
                aria-controls={`${id}-contenido`}
            >
                <span className="capDocumentacion__seccionIcono">{icono}</span>
                <span className="capDocumentacion__seccionTitulo">{titulo}</span>
                <span className={`capDocumentacion__seccionFlecha ${abierta ? 'capDocumentacion__seccionFlecha--abierto' : ''}`}>
                    <IconoFlechaDerecha size={16} />
                </span>
            </button>
            {abierta && (
                <div className="capDocumentacion__seccionContenido" id={`${id}-contenido`}>
                    {children}
                </div>
            )}
        </div>
    );
}

export function SeccionDocumentacion() {
    const [abiertas, setAbiertas] = useState<Record<string, boolean>>({});

    const toggle = (id: string) => {
        setAbiertas(prev => ({...prev, [id]: !prev[id]}));
    };

    return (
        <div className="capSeccion capAnimFadeIn">
            <div className="capSeccion__header">
                <h2 className="capTitulo capTitulo--lg">Documentación</h2>
                <p className="capTexto capTexto--secundario">
                    <Badge variante="info" tamano="sm">Solo admin</Badge>
                    {' '}Guía completa del funcionamiento del sistema CAP
                </p>
            </div>

            <div className="capDocumentacion__grid capMt--lg">

                {/* 1. Generación de calendario */}
                <SeccionDoc
                    id="doc-calendario"
                    titulo="Generación de Clases y Calendario"
                    icono={<IconoCalendario size={20} />}
                    abierta={!!abiertas['doc-calendario']}
                    onToggle={() => toggle('doc-calendario')}
                >
                    <h4>¿Cómo funciona el algoritmo?</h4>
                    <p>El motor de generación crea automáticamente el calendario semanal de clases CAP siguiendo estos pasos:</p>
                    <ol>
                        <li><strong>Crear slots disponibles:</strong> según los horarios configurados del centro (mañana/tarde o flexibles), se generan bloques de tiempo (slots) para cada día de la semana (lunes a viernes).</li>
                        <li><strong>Cruzar con disponibilidad:</strong> para cada slot, el sistema verifica qué alumnos están disponibles en ese horario según su matriz de disponibilidad individual.</li>
                        <li><strong>Detectar conflictos de aforo:</strong> si más alumnos disponibles que la capacidad máxima de la clase caben en un slot, se genera un aviso de conflicto para que el admin lo resuelva.</li>
                        <li><strong>Distribuir asignaturas:</strong> el algoritmo asigna la asignatura óptima a cada slot, priorizando las que los alumnos más necesitan (más horas pendientes).</li>
                        <li><strong>Guardar en base de datos:</strong> las clases se crean como registros con fecha, hora, asignatura y lista de alumnos asistentes.</li>
                    </ol>

                    <h4>Reglas legales del curso CAP</h4>
                    <table className="capDocumentacion__tabla">
                        <thead>
                            <tr>
                                <th>Regla</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>Horas totales del curso</td><td>35 horas</td></tr>
                            <tr><td>Mínimo de días</td><td>4 días</td></tr>
                            <tr><td>Máximo horas por día/alumno</td><td>9 horas</td></tr>
                        </tbody>
                    </table>

                    <h4>Asignaturas del CAP</h4>
                    <p>El curso incluye 8 asignaturas obligatorias. Cada una tiene un número de horas asignado. El algoritmo distribuye las horas proporcionalmente entre los slots disponibles, priorizando las asignaturas en las que cada alumno tiene más horas pendientes.</p>

                    <h4>Clases bloqueadas</h4>
                    <p>Los administradores pueden <strong>bloquear</strong> clases individuales. Las clases bloqueadas no se eliminan cuando se regenera el calendario. Esto es útil para fijar clases cuando ya están confirmados los asistentes o el horario.</p>

                    <h4>Regeneración parcial</h4>
                    <p>Se puede regenerar el calendario desde una fecha específica (no desde el lunes). Esto permite mantener las clases anteriores intactas y solo regenerar la parte restante de la semana.</p>

                    <h4>Avisos de cobertura</h4>
                    <p>Después de generar, el sistema muestra avisos de <strong>horas no cubiertas</strong>: slots donde ningún alumno está disponible. Esto ayuda a identificar si hay que ajustar horarios o disponibilidades.</p>
                </SeccionDoc>

                {/* 2. Gestión de alumnos */}
                <SeccionDoc
                    id="doc-alumnos"
                    titulo="Gestión de Alumnos y Disponibilidad"
                    icono={<IconoUsuarios size={20} />}
                    abierta={!!abiertas['doc-alumnos']}
                    onToggle={() => toggle('doc-alumnos')}
                >
                    <h4>Registro de alumnos</h4>
                    <p>Desde la pestaña <strong>Alumnos</strong> se crean, editan y eliminan alumnos del centro. Cada alumno tiene:</p>
                    <ul>
                        <li><strong>Nombre</strong> (obligatorio)</li>
                        <li><strong>Email y teléfono</strong> (opcionales, para contacto)</li>
                        <li><strong>DNI</strong> (para identificación)</li>
                        <li><strong>Estado</strong>: activo, pendiente o completado</li>
                    </ul>

                    <h4>Matriz de disponibilidad</h4>
                    <p>Cada alumno tiene una <strong>matriz de disponibilidad</strong> que indica en qué franjas horarias puede asistir a clase (lunes a viernes). El algoritmo de generación cruza esta información con los slots del centro para determinar qué alumnos asisten a cada clase.</p>

                    <h4>Progreso del alumno</h4>
                    <p>El sistema calcula automáticamente las horas completadas y asignadas de cada alumno, desglosadas por asignatura. Se puede ver el detalle desde el botón de <strong>progreso</strong> en la tabla de alumnos.</p>

                    <h4>Plan de formación (PDF)</h4>
                    <p>Se puede descargar el <strong>plan de formación individual</strong> de cada alumno en formato PDF. El documento incluye el calendario de clases asignadas, las horas por asignatura y el estado de progreso.</p>
                </SeccionDoc>

                {/* 3. Configuración del centro */}
                <SeccionDoc
                    id="doc-configuracion"
                    titulo="Configuración del Centro"
                    icono={<IconoConfiguracion size={20} />}
                    abierta={!!abiertas['doc-configuracion']}
                    onToggle={() => toggle('doc-configuracion')}
                >
                    <h4>Datos del centro</h4>
                    <p>En la pestaña <strong>Configuración</strong> se gestionan los datos del centro de formación:</p>
                    <ul>
                        <li><strong>Nombre del centro</strong></li>
                        <li><strong>Email y teléfono</strong> de contacto</li>
                        <li><strong>Zona horaria</strong> (afecta la generación de calendario)</li>
                    </ul>

                    <h4>Horarios del centro</h4>
                    <p>Se configuran las franjas horarias de mañana y tarde. Hay dos modos:</p>
                    <ul>
                        <li><strong>Horario estándar:</strong> mis horas de inicio y fin para mañana y tarde, con opción de viernes especial (horario reducido).</li>
                        <li><strong>Horario flexible:</strong> rangos de horas personalizados por día de la semana. Permite configurar diferentes horarios cada día.</li>
                    </ul>

                    <h4>Capacidad</h4>
                    <ul>
                        <li><strong>Alumnos máximo por clase:</strong> límite de aforo. Si más alumnos están disponibles en un slot que este límite, se genera un conflicto de aforo.</li>
                        <li><strong>Duración de clase:</strong> en minutos (ej: 60, 90, 120). Determina el tamaño de los slots del calendario.</li>
                    </ul>

                    <h4>Modo demo</h4>
                    <p>El <strong>modo demo</strong> permite generar datos de ejemplo (alumnos, disponibilidades y clases) para probar el sistema sin datos reales. Solo está disponible si <code>WP_DEBUG</code> está activado o si <code>CAP_ALLOW_DEMO_MODE</code> está definido.</p>
                </SeccionDoc>

                {/* 4. Stripe y pagos */}
                <SeccionDoc
                    id="doc-stripe"
                    titulo="Configuración de Stripe y Pagos"
                    icono={<IconoTarjeta size={20} />}
                    abierta={!!abiertas['doc-stripe']}
                    onToggle={() => toggle('doc-stripe')}
                >
                    <h4>¿Qué es Stripe?</h4>
                    <p>Stripe es la pasarela de pago que gestiona las suscripciones de los centros de formación. Cada centro paga una suscripción mensual para usar el sistema.</p>

                    <h4>Configurar Stripe (paso a paso)</h4>
                    <ol>
                        <li>Crear una cuenta en <strong>dashboard.stripe.com</strong>.</li>
                        <li>En Stripe Dashboard, ir a <strong>Developers → API Keys</strong>. Copiar las claves <code>pk_test_</code> y <code>sk_test_</code> (modo test) o <code>pk_live_</code> y <code>sk_live_</code> (modo producción).</li>
                        <li>En la pestaña <strong>Configuración → Stripe</strong> del panel CAP, pegar las claves en los campos correspondientes.</li>
                        <li>En Stripe Dashboard, ir a <strong>Products</strong> y crear un producto (ej: &quot;Suscripción CAP&quot;) con un precio recurrente mensual (ej: 75€/mes). Copiar el <code>price_</code> ID.</li>
                        <li>Pegar el Price ID en el campo correspondiente del panel.</li>
                        <li>Configurar el <strong>Webhook</strong>: en Stripe Dashboard → Webhooks, crear un endpoint apuntando a la URL de webhook que muestra el panel. Copiar el <code>whsec_</code> secret y pegarlo en la configuración.</li>
                    </ol>

                    <h4>Modo test vs producción</h4>
                    <p>En <strong>modo test</strong>, se usan las claves de test y no se realizan cobros reales. Ideal para probar que todo funciona antes de activar pagos. Para activar pagos reales, desmarcar &quot;Modo Test&quot; y configurar las claves live.</p>

                    <h4>Trial gratuito</h4>
                    <p>Si se activa el <strong>trial</strong>, los nuevos centros registrados reciben 14 días de acceso gratuito antes de requerir pago. Si se desactiva, deben pagar inmediatamente.</p>

                    <h4>Gestión de clientes</h4>
                    <p>Desde la pestaña <strong>Clientes</strong> (solo admin) se puede ver el estado de todas las suscripciones. Desde allí hay enlaces directos al Stripe Dashboard para gestionar cada cliente.</p>

                    <h4>Importante</h4>
                    <ul>
                        <li>El <strong>precio no se puede cambiar</strong> desde el panel CAP — solo desde Stripe Dashboard (Products → editar precio).</li>
                        <li>Las <strong>claves se almacenan encriptadas</strong> (AES-256-CBC) en la base de datos de WordPress.</li>
                        <li>Los webhooks de Stripe actualizan automáticamente el estado de las suscripciones cuando hay pagos, cancelaciones o fallos.</li>
                    </ul>
                </SeccionDoc>

                {/* 5. Reportes */}
                <SeccionDoc
                    id="doc-reportes"
                    titulo="Reportes y Documentación PDF"
                    icono={<IconoReportes size={20} />}
                    abierta={!!abiertas['doc-reportes']}
                    onToggle={() => toggle('doc-reportes')}
                >
                    <h4>Control de horas</h4>
                    <p>Desde la pestaña <strong>Reportes</strong> se puede generar y descargar el <strong>Control de Horas</strong>, un documento que muestra las horas asignadas y completadas de todos los alumnos, útil para cumplimiento normativo.</p>

                    <h4>Plan de formación individual</h4>
                    <p>Cada alumno tiene su <strong>plan de formación</strong> descargable en PDF. Incluye calendario de clases, distribución de asignaturas y horas completadas vs pendientes.</p>

                    <h4>Formato</h4>
                    <p>Los reportes se generan como PDF en el servidor y se descargan directamente al navegador. El formato incluye logotipo del centro, datos del alumno y tabla de clases con código de color por asignatura.</p>
                </SeccionDoc>

            </div>
        </div>
    );
}

export default SeccionDocumentacion;
