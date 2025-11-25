## Agente Logic Horario Automatizado

Sistema automatizado que ejecuta el agente Logic de forma periódica. Hay dos modos:
- **Agente clásico WSL**: lógica fija en bash (sin IA remota).
- **Agente IA WSL**: usa `cursor-agent` (modelo `gpt-5`) pero las llamadas HTTP las hace el script, no la IA.

## 📋 Requisitos

- **Cursor CLI** instalado: [https://cursor.com/install](https://cursor.com/install)
- **API Key de Cursor** en `CURSOR_API_KEY` (para el modelo remoto)
- **API Key de Logic** en `LOGIC_API_KEY` (o definida en los scripts)
- **Permisos de administrador** para configurar el programador de tareas
- **PowerShell** (incluido en Windows)

## 🚀 Instalación Completada

### ✅ SISTEMA YA CONFIGURADO Y FUNCIONANDO (WSL)

**Cursor CLI**: ✅ Instalado en WSL Ubuntu  
**API Keys**: ✅ Configuradas vía variables de entorno  
**Agente WSL**: ✅ Ejecutándose vía `cron`  
**Modelo IA**: ✅ `gpt-5` (configurable con `LOGIC_AGENT_MODEL`)

### Estado Actual (IA WSL)
- 🟢 **Cron Job Activo**: ejecuta `hourly_agent_wsl_ai.sh` cada 6 horas  
- 🟢 **Conectividad**: API Logic accesible desde WSL  
- 🟢 **Modelo IA**: `gpt-5` operativo vía `cursor-agent`  
- 🟢 **Autonomía**: el script **consulta la API y aplica acciones sin pedir `curl` manual**

### Verificación del Sistema
```bash
# Ver estado del cron job
crontab -l

# Ver logs del agente
tail -f hourly_agent_wsl.log

# Ejecutar manualmente para pruebas
bash hourly_agent_wsl.sh --test
```

## 📁 Archivos del Sistema

| Archivo | Descripción |
|---------|-------------|
| `hourly_agent_wsl.sh` | Agente clásico en bash (árbol de decisión fijo, sin IA remota) |
| `hourly_agent_wsl_ai.sh` | **Agente IA WSL** - usa `cursor-agent` y aplica acciones automáticamente |
| `hourly_agent_smart.ps1` | Agente inteligente en PowerShell (usa IA vía WSL) |
| `setup_hourly_task.ps1` | Instalador del programador de tareas en Windows |
| `hourly_agent.ps1` / `.bat` | Scripts simples/legacy |
| `README_hourly_agent.md` | Esta documentación |

## ⚙️ Cómo Funciona

### Agente IA WSL (`hourly_agent_wsl_ai.sh`)
- Usa **cursor-agent** con modelo `gpt-5` (remoto).  
- El **script bash** hace todos los `curl` a `glorybuilder.local`:
  - `/state`, `/history`, `/steps`, `/habits` con cabecera `X-Glory-Logic-Key`.  
- Empaqueta esos datos en un solo JSON y se lo pasa a la IA como contexto.  
- La IA **no tiene red**: solo lee el JSON y devuelve un JSON de **acciones**.  
- El script interpreta ese JSON y:
  - Pausa pasos (`/steps/{id}/pause`),  
  - Crea mensajes de ayuda (`/help-message`),  
  - Crea contextos (`/contexts`).  
- En modo prueba (`--test`) solo **simula** las llamadas y deja todo en el log.

### Árbol de Decisión (reglas lógicas que sigue la IA)
1. **Check de Emergencia**: ¿Último ejercicio > 3 días?
2. **Check de Ingresos**: ¿Hay trabajos cliente pendientes?
3. **Check de Estado Mental**: Análisis de contextos recientes

### Acciones Automáticas
- ✅ Crear/pausar/resumir pasos
- ✅ Gestionar mensajes de ayuda
- ✅ Agregar contextos de seguimiento
- ✅ Gestionar hábitos
- ✅ Aplicar protocolos de descanso

## 📊 Logs y Monitoreo

### Archivos de Log
- `hourly_agent_wsl_ai.log`: Log principal del agente IA WSL  
- `hourly_agent_wsl.log`: Log del agente clásico bash  
- `hourly_agent_smart.log`: Log del agente PowerShell  
- `agent_results.log`: Resultados detallados del agente PowerShell

### Verificar Estado
```powershell
# Ver tareas programadas
schtasks /Query /TN "LogicHourlyAgent"

# Ejecutar manualmente para pruebas
.\hourly_agent_smart.ps1 -TestMode -Verbose
```

## 🛠️ Comandos Útiles

### Control del Agente (WSL)
```bash
# Ver estado del cron job
crontab -l

# Detener agente automático
bash remove_cron_wsl.sh

# Reactivar agente automático
bash setup_cron_wsl.sh

# Ejecutar manualmente
bash hourly_agent_wsl.sh

# Ejecutar en modo prueba
bash hourly_agent_wsl.sh --test
```

### PowerShell (Avanzado)
```powershell
# Instalar tarea (requiere admin)
.\setup_hourly_task.ps1

# Desinstalar tarea
.\setup_hourly_task.ps1 -Uninstall
```

### Ejecución Manual
```powershell
# Modo normal
.\hourly_agent_smart.ps1

# Modo prueba (sin cambios reales)
.\hourly_agent_smart.ps1 -TestMode

# Modo verbose
.\hourly_agent_smart.ps1 -Verbose

# Con modelo específico
.\hourly_agent_smart.ps1 -Model "grok-code"
```

### Monitoreo
```powershell
# Ver logs recientes
Get-Content hourly_agent_smart.log -Tail 20

# Ver resultados de agente
Get-Content agent_results.log -Tail 50
```

## 🔧 Configuración Avanzada

### Variables de Entorno
```powershell
# API Key de Cursor (requerida para IA remota)
$env:CURSOR_API_KEY = "TU_API_KEY_CURSOR"

# API Key de Logic (si no se quiere hardcodear en los scripts)
$env:LOGIC_API_KEY = "TU_API_KEY_LOGIC"

# Opcional: Cambiar modelo IA (para `hourly_agent_wsl_ai.sh` y PowerShell)
$env:LOGIC_AGENT_MODEL = "gpt-5"
```

### Personalizar Frecuencia
Para cambiar la frecuencia de ejecución, modifica el script `setup_hourly_task.ps1`:

```powershell
# Cada 30 minutos
/SC MINUTE /MO 30

# Cada 2 horas
/SC HOURLY /MO 2

# Diariamente a las 9:00
/SC DAILY /ST 09:00
```

## 🚨 Solución de Problemas

### Error: "cursor-agent no encontrado"
```bash
# Verificar instalación
cursor-agent --version

# Si no está en PATH, agregar manualmente
$env:Path += ";C:\ruta\a\cursor\bin"
```

### Error: "API key no configurada"
```powershell
# Configurar temporalmente
$env:CURSOR_API_KEY = "tu_api_key_aqui"

# Configurar permanentemente (Panel de Control > Variables de entorno)
```

### Error: "No se pudo crear tarea programada"
- Ejecuta PowerShell como **Administrador**
- Verifica permisos de escritura en `C:\Windows\System32\Tasks\`

### Agente no se ejecuta
```powershell
# Ver historial de tareas
schtasks /Query /TN "LogicHourlyAgent" /V

# Ver logs de Windows
eventvwr.msc > Registros de Windows > Aplicación
```

## 📈 Funcionalidades del Agente

### Análisis Inteligente
- **Lectura de contexto**: Analiza todos los contextos recientes
- **Detección de patrones**: Identifica señales de cansancio, motivación, etc.
- **Evaluación de prioridades**: Aplica jerarquía trabajo > salud > proyectos

### Acciones Automatizadas
- **Gestión de energía**: Pausa tareas cuando detecta fatiga
- **Mensajes de apoyo**: Crea mensajes de ayuda contextuales
- **Mantenimiento de hábitos**: Gestiona rutinas de ejercicio y salud
- **Documentación**: Registra todas las decisiones tomadas

### Seguridad
- **Modo prueba**: `-TestMode` para verificar sin cambios reales
- **Logs detallados**: Seguimiento completo de todas las acciones
- **Validación**: Verifica estado antes de cada acción

## 🔄 Actualizaciones

Para actualizar el agente:

1. Descarga nueva versión de scripts
2. Desinstala tarea actual:
   ```powershell
   .\setup_hourly_task.ps1 -Uninstall
   ```
3. Instala nueva versión:
   ```powershell
   .\setup_hourly_task.ps1
   ```

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `hourly_agent_smart.log`
2. Ejecuta en modo verbose: `.\hourly_agent_smart.ps1 -Verbose`
3. Verifica conectividad con la API de Logic
4. Confirma que Cursor CLI esté funcionando: `cursor-agent --version`

---

**Estado**: ✅ Sistema configurado y listo para instalación
**Modelo IA**: gemini-3-pro-preview (configurable)
**Frecuencia**: Cada 6 horas (configurable)
**Autonomía**: Completa con árbol de decisión inteligente
