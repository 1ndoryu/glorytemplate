<?php

namespace Glory\App\Services;

class ReportePdfStyles
{
    public function obtener(): string
    {
        return <<<CSS
<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: 'Helvetica', 'Arial', sans-serif;
        font-size: 10pt;
        line-height: 1.4;
        color: #333;
        padding: 20px;
    }

    .cabecera {
        display: table;
        width: 100%;
        border-bottom: 2px solid #2563eb;
        padding-bottom: 15px;
        margin-bottom: 20px;
    }

    .logoCentro {
        display: table-cell;
        width: 60%;
        vertical-align: top;
    }

    .logoCentro h1 {
        color: #1e40af;
        font-size: 16pt;
        margin-bottom: 5px;
    }

    .logoCentro p {
        color: #666;
        font-size: 9pt;
    }

    .informe {
        display: table-cell;
        width: 40%;
        text-align: right;
        vertical-align: top;
    }

    .informe h2 {
        color: #1e40af;
        font-size: 12pt;
        margin-bottom: 5px;
    }

    .informe p {
        color: #666;
        font-size: 9pt;
    }

    .seccion {
        margin-bottom: 20px;
    }

    .seccion h3 {
        color: #1e40af;
        font-size: 11pt;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
        margin-bottom: 10px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10px;
    }

    .datosSimples td {
        padding: 5px;
        border: none;
    }

    .tablaAsignaturas th,
    .tablaAsignaturas td,
    .tablaClases th,
    .tablaClases td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
    }

    .tablaAsignaturas th,
    .tablaClases th {
        background-color: #f3f4f6;
        font-weight: bold;
        color: #374151;
    }

    .tablaAsignaturas tbody tr:nth-child(even),
    .tablaClases tbody tr:nth-child(even) {
        background-color: #f9fafb;
    }

    .centrado {
        text-align: center;
    }

    .completada {
        color: #059669;
        font-weight: bold;
    }

    .pendiente {
        color: #d97706;
    }

    .asistio {
        color: #059669;
    }

    .noAsistio {
        color: #dc2626;
    }

    .bloqueada {
        background-color: #fef2f2 !important;
    }

    .sinClases {
        color: #6b7280;
        font-style: italic;
        text-align: center;
        padding: 15px;
    }

    .progresoContenedor {
        margin: 10px 0;
    }

    .progresoTexto {
        margin-bottom: 5px;
    }

    .horasActuales {
        font-size: 14pt;
        font-weight: bold;
        color: #2563eb;
    }

    .barraProgreso {
        background-color: #e5e7eb;
        border-radius: 4px;
        height: 12px;
        overflow: hidden;
    }

    .barraProgresoRelleno {
        background-color: #2563eb;
        height: 100%;
        border-radius: 4px;
    }

    .piePagina {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        text-align: center;
        font-size: 8pt;
        color: #9ca3af;
        border-top: 1px solid #e5e7eb;
        padding-top: 10px;
    }

    .piePagina p {
        margin-bottom: 3px;
    }
</style>
CSS;
    }
}
