/* [193A-99] Sanitizador HTML ligero para contenido proveniente de localStorage/stores.
 * Usa DOMParser del navegador para eliminar vectores XSS conocidos sin dependencia externa.
 * Cubre: <script>, <iframe>, event handlers (on*), javascript: URIs, <object>, <embed>. */

export function sanitizarHtml(html: string): string {
    if (!html) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    /* Remover elementos peligrosos */
    doc.querySelectorAll('script, iframe, object, embed, form, link[rel="import"]').forEach(el => el.remove());

    /* Remover atributos de event handlers y URIs javascript: */
    const todos = doc.querySelectorAll('*');
    todos.forEach(el => {
        for (const attr of Array.from(el.attributes)) {
            const nombre = attr.name.toLowerCase();
            const valor = attr.value.trim().toLowerCase();
            if (nombre.startsWith('on')
                || (nombre === 'href' && valor.startsWith('javascript:'))
                || (nombre === 'src' && valor.startsWith('javascript:'))
                || (nombre === 'action' && valor.startsWith('javascript:'))
                || (nombre === 'xlink:href' && valor.startsWith('javascript:'))) {
                el.removeAttribute(attr.name);
            }
        }
    });

    return doc.body.innerHTML;
}
