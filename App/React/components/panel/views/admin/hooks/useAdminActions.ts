import {apiClient} from '../../../../../data/api/client';

export const useAdminActions = () => {
    const handleSeed = async () => {
        if (!confirm('¿Estás seguro de inicializar los datos de prueba? Esto creará usuarios y posts si no existen.')) return;
        try {
            const res = await apiClient.post<any>('glory/v1/seed', {});
            alert('Seed completado: ' + JSON.stringify(res.message));
            window.location.reload();
        } catch (e) {
            alert('Error al ejecutar seed: ' + e);
        }
    };

    return {handleSeed};
};
