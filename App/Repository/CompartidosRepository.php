<?php

/**
 * Repositorio de Datos Compartidos
 *
 * Maneja la obtención de tareas y proyectos que otros usuarios
 * han compartido conmigo.
 *
 * @package App\Repository
 */

namespace App\Repository;

use App\Services\CompartidosService;

class CompartidosRepository
{
    private int $userId;

    public function __construct(int $userId)
    {
        if ($userId <= 0) {
            throw new \InvalidArgumentException('ID de usuario invalido');
        }
        $this->userId = $userId;
    }

    /**
     * Obtiene todos los datos compartidos conmigo
     * 
     * @return array ['tareas' => [...], 'proyectos' => [...]]
     */
    public function getAll(): array
    {
        $compartidosService = new CompartidosService();

        return [
            'tareas' => $this->getTareasCompartidas($compartidosService),
            'proyectos' => $this->getProyectosCompartidos($compartidosService)
        ];
    }

    /**
     * Obtiene proyectos compartidos conmigo
     */
    private function getProyectosCompartidos(CompartidosService $service): array
    {
        $proyectos = [];
        $proyectosData = $service->obtenerDatosProyectosCompartidos($this->userId);

        foreach ($proyectosData as $pData) {
            $proyecto = $this->decodeJson($pData['data']);
            if (!$proyecto) continue;

            $proyectos[] = $this->agregarMetadataCompartido($proyecto, $pData);
        }

        return $proyectos;
    }

    /**
     * Obtiene tareas compartidas conmigo (de proyectos + asignadas directamente)
     */
    private function getTareasCompartidas(CompartidosService $service): array
    {
        $tareas = [];

        /* Tareas de proyectos compartidos */
        $tareasProyectos = $service->obtenerTareasDeProyectosCompartidos($this->userId);
        foreach ($tareasProyectos as $tData) {
            $tarea = $this->decodeJson($tData['data']);
            if (!$tarea) continue;

            $tarea = $this->agregarMetadataCompartido($tarea, $tData);
            $tarea['proyectoId'] = $tData['proyectoId'];
            $tareas[] = $tarea;
        }

        /* Tareas asignadas directamente a mi */
        $tareasAsignadas = $service->obtenerTareasAsignadasAMi($this->userId);
        foreach ($tareasAsignadas as $tData) {
            $tarea = $this->decodeJson($tData['data']);
            if (!$tarea) continue;

            $tareas[] = $this->agregarMetadataCompartido($tarea, $tData);
        }

        return $tareas;
    }

    /**
     * Agrega metadata de compartido a un elemento
     */
    private function agregarMetadataCompartido(array $elemento, array $data): array
    {
        $elemento['id'] = (int) $data['idLocal'];
        $elemento['esCompartido'] = true;
        $elemento['propietarioId'] = $data['propietarioId'];
        $elemento['propietarioNombre'] = $data['propietarioNombre'];
        $elemento['propietarioAvatar'] = $data['propietarioAvatar'];
        $elemento['miRol'] = $data['rol'];

        return $elemento;
    }

    /**
     * Decodifica JSON de datos compartidos
     */
    private function decodeJson(string $data): ?array
    {
        if (empty($data)) return null;

        $decoded = json_decode($data, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }

        return is_array($decoded) ? $decoded : null;
    }
}
