<?php

namespace App\Helpers;

/**
 * ContactForm - Helper para generar formularios de contacto reutilizables
 * 
 * Los estilos estan definidos globalmente en init.css con clases genericas
 * que no dependen del contenedor de pagina.
 */
class ContactForm
{
    /**
     * Renderiza el formulario de contacto completo
     * 
     * @param string $formId ID unico del formulario para tracking
     * @param string $title Titulo de la seccion (opcional, vacio para no mostrar)
     * @param bool $showHabitaciones Mostrar campos de habitaciones y PMS
     * @return void
     */
    public static function render(
        string $formId = 'contacto',
        string $title = 'Contacto',
        bool $showHabitaciones = true
    ): void {
?>
        <section gloryDiv class="contact-section"
            style="width: 100%; max-width: unset;">
            <div gloryDivSecundario class="contact-container">
                <?php if (!empty($title)): ?>
                    <div gloryDivSecundario class="section-header">
                        <h2 gloryTexto class="section-title"><?php echo esc_html($title); ?></h2>
                    </div>
                <?php endif; ?>

                <form gloryForm
                    data-ajax-submit="true"
                    data-form-id="<?php echo esc_attr($formId); ?>"
                    data-success-message="Formulario enviado con exito!"
                    data-error-message="Hubo un error al enviar el formulario."
                    class="contact-form">
                    <div gloryDivSecundario class="form-row">
                        <div gloryInput opciones="name: 'nombre', label: 'Nombre', type: 'text', required: true" class="form-group">
                            <label>Nombre</label>
                            <input type="text" name="nombre">
                        </div>
                        <div gloryInput opciones="name: 'email', label: 'Email', type: 'email', required: true" class="form-group">
                            <label>Email</label>
                            <input type="email" name="email">
                        </div>
                    </div>
                    <div gloryDivSecundario class="form-row">
                        <div gloryInput opciones="name: 'telefono', label: 'Telefono', type: 'tel'" class="form-group">
                            <label>Telefono</label>
                            <input type="tel" name="telefono">
                        </div>
                        <div gloryInput opciones="name: 'alojamiento', label: 'Alojamiento', type: 'text'" class="form-group">
                            <label>Alojamiento</label>
                            <input type="text" name="alojamiento">
                        </div>
                    </div>
                    <?php if ($showHabitaciones): ?>
                        <div gloryDivSecundario class="form-row">
                            <div gloryInput opciones="name: 'habitaciones', label: 'N habitaciones', type: 'text'" class="form-group">
                                <label>N habitaciones</label>
                                <input type="text" name="habitaciones">
                            </div>
                            <div gloryInput opciones="name: 'pms', label: 'PMS/Channel', type: 'text'" class="form-group">
                                <label>PMS/Channel</label>
                                <input type="text" name="pms">
                            </div>
                        </div>
                    <?php endif; ?>
                    <div gloryTextarea opciones="name: 'mensaje', label: 'Mensaje', rows: 4" class="form-group full-width">
                        <label>Mensaje</label>
                        <textarea name="mensaje" rows="1"></textarea>
                    </div>

                    <div gloryDivSecundario class="form-footer">
                        <label class="checkbox-label">
                            <input type="checkbox" name="privacy" required>
                            He leido y acepto la Politica de Privacidad.
                        </label>
                        <button glorySubmit opciones="texto: 'Enviar', loadingText: 'Enviando...'" type="submit" class="btn-submit">Enviar</button>
                    </div>
                </form>
            </div>
        </section>
    <?php
    }

    /**
     * Renderiza solo el formulario sin la seccion wrapper
     * Util para insertar en secciones personalizadas
     * 
     * @param string $formId ID unico del formulario
     * @param bool $showHabitaciones Mostrar campos de habitaciones y PMS
     * @return void
     */
    public static function renderFormOnly(string $formId = 'contacto', bool $showHabitaciones = true): void
    {
    ?>
        <form gloryForm
            data-ajax-submit="true"
            data-form-id="<?php echo esc_attr($formId); ?>"
            data-success-message="Formulario enviado con exito!"
            data-error-message="Hubo un error al enviar el formulario."
            class="contact-form">
            <div gloryDivSecundario class="form-row">
                <div gloryInput opciones="name: 'nombre', label: 'Nombre', type: 'text', required: true" class="form-group">
                    <label>Nombre</label>
                    <input type="text" name="nombre">
                </div>
                <div gloryInput opciones="name: 'email', label: 'Email', type: 'email', required: true" class="form-group">
                    <label>Email</label>
                    <input type="email" name="email">
                </div>
            </div>
            <div gloryDivSecundario class="form-row">
                <div gloryInput opciones="name: 'telefono', label: 'Telefono', type: 'tel'" class="form-group">
                    <label>Telefono</label>
                    <input type="tel" name="telefono">
                </div>
                <div gloryInput opciones="name: 'alojamiento', label: 'Alojamiento', type: 'text'" class="form-group">
                    <label>Alojamiento</label>
                    <input type="text" name="alojamiento">
                </div>
            </div>
            <?php if ($showHabitaciones): ?>
                <div gloryDivSecundario class="form-row">
                    <div gloryInput opciones="name: 'habitaciones', label: 'N habitaciones', type: 'text'" class="form-group">
                        <label>N habitaciones</label>
                        <input type="text" name="habitaciones">
                    </div>
                    <div gloryInput opciones="name: 'pms', label: 'PMS/Channel', type: 'text'" class="form-group">
                        <label>PMS/Channel</label>
                        <input type="text" name="pms">
                    </div>
                </div>
            <?php endif; ?>
            <div gloryTextarea opciones="name: 'mensaje', label: 'Mensaje', rows: 4" class="form-group full-width">
                <label>Mensaje</label>
                <textarea name="mensaje" rows="1"></textarea>
            </div>

            <div gloryDivSecundario class="form-footer">
                <label class="checkbox-label">
                    <input type="checkbox" name="privacy" required>
                    He leido y acepto la Politica de Privacidad.
                </label>
                <button glorySubmit opciones="texto: 'Enviar', loadingText: 'Enviando...'" type="submit" class="btn-submit">Enviar</button>
            </div>
        </form>
    <?php
    }

    /**
     * Renderiza el formulario con un servicio preseleccionado
     * Usado en las paginas de detalle de servicios
     * 
     * @param string $formId ID unico del formulario
     * @param string $title Titulo de la seccion
     * @param string $serviceName Nombre del servicio preseleccionado
     * @return void
     */
    public static function renderWithService(
        string $formId = 'contacto',
        string $title = 'Solicitar informacion',
        string $serviceName = ''
    ): void {
    ?>
        <section gloryDiv class="contact-section service-contact-section">
            <div gloryDivSecundario class="contact-container">
                <?php if (!empty($title)): ?>
                    <div gloryDivSecundario class="section-header">
                        <h2 gloryTexto class="section-title"><?php echo esc_html($title); ?></h2>
                    </div>
                <?php endif; ?>

                <?php if (!empty($serviceName)): ?>
                    <div class="service-selected-badge">
                        <span class="badge-label">Servicio seleccionado:</span>
                        <span class="badge-value"><?php echo esc_html($serviceName); ?></span>
                    </div>
                <?php endif; ?>

                <form gloryForm
                    data-ajax-submit="true"
                    data-form-id="<?php echo esc_attr($formId); ?>"
                    data-success-message="Gracias por tu interes! Nos pondremos en contacto contigo pronto."
                    data-error-message="Hubo un error al enviar el formulario."
                    class="contact-form">

                    <!-- Campo oculto con el servicio seleccionado -->
                    <?php if (!empty($serviceName)): ?>
                        <input type="hidden" name="servicio_interes" value="<?php echo esc_attr($serviceName); ?>">
                    <?php endif; ?>

                    <div gloryDivSecundario class="form-row">
                        <div gloryInput opciones="name: 'nombre', label: 'Nombre', type: 'text', required: true" class="form-group">
                            <label>Nombre</label>
                            <input type="text" name="nombre" required>
                        </div>
                        <div gloryInput opciones="name: 'email', label: 'Email', type: 'email', required: true" class="form-group">
                            <label>Email</label>
                            <input type="email" name="email" required>
                        </div>
                    </div>
                    <div gloryDivSecundario class="form-row">
                        <div gloryInput opciones="name: 'telefono', label: 'Telefono', type: 'tel'" class="form-group">
                            <label>Telefono</label>
                            <input type="tel" name="telefono">
                        </div>
                        <div gloryInput opciones="name: 'alojamiento', label: 'Nombre del alojamiento', type: 'text'" class="form-group">
                            <label>Nombre del alojamiento</label>
                            <input type="text" name="alojamiento">
                        </div>
                    </div>
                    <div gloryDivSecundario class="form-row">
                        <div gloryInput opciones="name: 'habitaciones', label: 'N habitaciones', type: 'text'" class="form-group">
                            <label>N habitaciones</label>
                            <input type="text" name="habitaciones">
                        </div>
                        <div gloryInput opciones="name: 'pms', label: 'PMS/Channel', type: 'text'" class="form-group">
                            <label>PMS/Channel</label>
                            <input type="text" name="pms">
                        </div>
                    </div>
                    <div gloryTextarea opciones="name: 'mensaje', label: 'Cuentanos sobre tu proyecto', rows: 4" class="form-group full-width">
                        <label>Cuentanos sobre tu proyecto</label>
                        <textarea name="mensaje" rows="3" placeholder="Describe brevemente tu alojamiento y que te gustaria conseguir..."></textarea>
                    </div>

                    <div gloryDivSecundario class="form-footer">
                        <label class="checkbox-label">
                            <input type="checkbox" name="privacy" required>
                            He leido y acepto la Politica de Privacidad.
                        </label>
                        <button glorySubmit opciones="texto: 'Solicitar propuesta', loadingText: 'Enviando...'" type="submit" class="btn-submit">Solicitar propuesta</button>
                    </div>
                </form>
            </div>
        </section>
<?php
    }
}
