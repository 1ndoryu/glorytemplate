(function () {
    const btn = document.getElementById('btnExportarCsv');
    if (!btn) return;
    btn.addEventListener('click', async function (e) {
        e.preventDefault();
        const url = btn.getAttribute('data-export-url');
        btn.disabled = true;
        const originalText = btn.textContent;
        btn.textContent = 'Generando…';

        try {
            // Extraer action y nonce de la URL para usar gloryAjax
            let action = null;
            let nonce = null;
            try {
                const parsed = new URL(url, window.location.href);
                action = parsed.searchParams.get('action');
                nonce = parsed.searchParams.get('nonce');
            } catch (err) {
                // Fallback: intentar parse manual
                const matchAction = url.match(/[?&]action=([^&]+)/);
                const matchNonce = url.match(/[?&]nonce=([^&]+)/);
                if (matchAction) action = decodeURIComponent(matchAction[1]);
                if (matchNonce) nonce = decodeURIComponent(matchNonce[1]);
            }

            if (!action) {
                throw new Error('No se pudo determinar la acción AJAX desde la URL.');
            }

            const params = {};
            if (nonce) params.nonce = nonce;

            const resp = await window.gloryAjax(action, params);
            if (!resp || resp.success === false) {
                alert(resp && resp.message ? resp.message : 'No se pudo generar el CSV.');
                return;
            }

            if (resp.blob) {
                const blob = resp.blob;
                const filename = resp.filename || 'reservas.csv';
                const link = document.createElement('a');
                const objectUrl = URL.createObjectURL(blob);
                link.href = objectUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                setTimeout(function () {
                    URL.revokeObjectURL(objectUrl);
                    link.remove();
                }, 0);
                return;
            }

            // Si no hay blob, intentar mostrar mensaje o data textual
            if (resp.data || resp.message) {
                alert(resp.message || 'Export generado.');
            } else {
                alert('Export generado sin contenido descargable.');
            }

        } catch (error) {
            console.error('Exportar CSV error:', error);
            alert('No se pudo generar el CSV.');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
})();


