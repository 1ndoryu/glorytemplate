import React, { useState } from 'react';
import { Terminal, Check, MoreHorizontal, AlertCircle, Clock, Plus, Hash, FileText } from 'lucide-react';

const DashboardBoceto = () => {
  // Datos simulados para el boceto (Mock Data)
  
  // Lógica: Ordenados por Importancia (3=Alta, 1=Baja) y luego por Días de Inactividad (Descendente)
  // El usuario debe ver primero lo importante que ha descuidado más tiempo.
  const initialHabits = [
    { id: 1, nombre: 'Deep Work / Coding', importancia: 'Alta', diasInactividad: 4, racha: 12, tags: ['dev', 'focus'] },
    { id: 2, nombre: 'Lectura Técnica', importancia: 'Alta', diasInactividad: 2, racha: 5, tags: ['learning'] },
    { id: 3, nombre: 'Ejercicio Físico', importancia: 'Media', diasInactividad: 5, racha: 0, tags: ['salud'] },
    { id: 4, nombre: 'Revisión de Backlog', importancia: 'Media', diasInactividad: 1, racha: 30, tags: ['admin'] },
    { id: 5, nombre: 'Meditación', importancia: 'Baja', diasInactividad: 0, racha: 2, tags: ['mental'] },
  ];

  const [tareas] = useState([
    { id: 1, texto: 'Refactorizar componente de autenticación', completado: false, proyecto: 'App Core' },
    { id: 2, texto: 'Responder correos pendientes de clientes', completado: true, proyecto: 'Freelance' },
    { id: 3, texto: 'Actualizar documentación de API', completado: false, proyecto: 'Docs' },
    { id: 4, texto: 'Configurar entorno de staging', completado: false, proyecto: 'DevOps' },
  ]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#888] font-mono text-[12px] p-6 selection:bg-[#333] selection:text-white">
      
      {/* Header Minimalista */}
      <header className="mb-8 flex items-center justify-between border-b border-[#1a1a1a] pb-4">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 bg-white rounded-full"></div>
          <span className="font-semibold text-[#eaeaea] tracking-tight">DASHBOARD_01</span>
        </div>
        <div className="flex gap-4">
          <span className="hover:text-white cursor-pointer transition-colors">v1.0.0-beta</span>
          <span className="hover:text-white cursor-pointer transition-colors">user@admin</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA 1: Hábitos Críticos (Span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-[#eaeaea] uppercase tracking-wider flex items-center gap-2">
              <AlertCircle size={12} /> Foco Prioritario
            </h2>
            <span className="text-[#444]">Orden: Importancia &gt; Inactividad</span>
          </div>

          <div className="bg-[#090909] border border-[#1a1a1a] p-0">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-3 border-b border-[#1a1a1a] text-[#555]">
              <div className="col-span-1 text-center">ID</div>
              <div className="col-span-5">HÁBITO</div>
              <div className="col-span-2 text-center">PRIORIDAD</div>
              <div className="col-span-2 text-center">INACTIVIDAD</div>
              <div className="col-span-2 text-right">ESTADO</div>
            </div>

            {/* Rows */}
            {initialHabits.map((habit, index) => (
              <div 
                key={habit.id} 
                className="grid grid-cols-12 gap-4 p-3 border-b border-[#1a1a1a] items-center hover:bg-[#0c0c0c] transition-colors group cursor-default"
              >
                <div className="col-span-1 text-center font-bold text-[#333] group-hover:text-[#555]">
                  {String(index + 1).padStart(2, '0')}
                </div>
                
                <div className="col-span-5 text-[#ccc]">
                  <div className="font-medium text-[#eaeaea]">{habit.nombre}</div>
                  <div className="flex gap-2 mt-1">
                    {habit.tags.map(tag => (
                      <span key={tag} className="text-[#444] text-[10px] border border-[#222] px-1 rounded-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 text-center flex justify-center">
                  <span className={`px-2 py-0.5 border text-[10px] ${
                    habit.importancia === 'Alta' 
                      ? 'border-red-900/30 text-red-500 bg-red-900/10' 
                      : habit.importancia === 'Media'
                      ? 'border-yellow-900/30 text-yellow-600 bg-yellow-900/10'
                      : 'border-[#333] text-[#666]'
                  }`}>
                    {habit.importancia.toUpperCase()}
                  </span>
                </div>

                <div className="col-span-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock size={10} className={habit.diasInactividad > 2 ? "text-red-500" : "text-[#444]"} />
                    <span className={habit.diasInactividad > 2 ? "text-[#eaeaea]" : "text-[#666]"}>
                      {habit.diasInactividad}d
                    </span>
                  </div>
                </div>

                <div className="col-span-2 text-right">
                   {/* Visual Bar for urgency */}
                   <div className="w-full bg-[#111] h-1.5 mt-1 overflow-hidden">
                      <div 
                        className={`h-full ${habit.diasInactividad > 3 ? 'bg-red-600' : 'bg-[#333]'}`} 
                        style={{ width: `${Math.min((habit.diasInactividad / 7) * 100, 100)}%` }}
                      ></div>
                   </div>
                   <span className="text-[10px] text-[#444] mt-1 block">Racha: {habit.racha}</span>
                </div>
              </div>
            ))}
            
            {/* Add Habit Placeholder */}
            <div className="p-3 text-center text-[#333] hover:text-[#555] cursor-pointer border-t border-[#1a1a1a] border-dashed">
              + Añadir nuevo hábito de seguimiento
            </div>
          </div>
        </div>

        {/* COLUMNA 2: Tareas y Notas (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Section: To-Do */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <h2 className="text-[#eaeaea] uppercase tracking-wider flex items-center gap-2">
                <Terminal size={12} /> Ejecución
              </h2>
              <div className="flex gap-2">
                <button className="hover:text-white transition-colors"><Plus size={12} /></button>
                <button className="hover:text-white transition-colors"><MoreHorizontal size={12} /></button>
              </div>
            </div>

            <div className="bg-[#090909] border border-[#1a1a1a] flex flex-col">
              {tareas.map((tarea) => (
                <div key={tarea.id} className="group flex items-start gap-3 p-3 border-b border-[#1a1a1a] hover:bg-[#0c0c0c] transition-colors">
                  <div className={`mt-0.5 w-3 h-3 border border-[#333] flex items-center justify-center cursor-pointer ${tarea.completado ? 'bg-[#222] border-[#444]' : 'hover:border-[#666]'}`}>
                    {tarea.completado && <Check size={8} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`leading-tight ${tarea.completado ? 'text-[#333] line-through decoration-[#333]' : 'text-[#ccc]'}`}>
                      {tarea.texto}
                    </p>
                    <span className="text-[10px] text-[#444] mt-1 block">[{tarea.proyecto}]</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Quick Notes */}
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-end mb-2">
              <h2 className="text-[#eaeaea] uppercase tracking-wider flex items-center gap-2">
                <FileText size={12} /> Scratchpad
              </h2>
              <span className="text-[#444]">markdown supported</span>
            </div>
            
            <div className="bg-[#090909] border border-[#1a1a1a] p-4 flex-grow min-h-[150px] relative group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#222] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <textarea 
                className="w-full h-full bg-transparent resize-none focus:outline-none text-[#888] placeholder-[#222]"
                placeholder="// Escribe tus notas rápidas aquí..."
                defaultValue={"- Idea: Refactorizar el módulo de fechas\n- Recordatorio: Comprar café\n\n> La consistencia gana a la intensidad."}
              ></textarea>
            </div>
          </div>

        </div>
      </div>
      
      {/* Footer Minimalista */}
      <footer className="mt-8 text-center text-[#222] border-t border-[#1a1a1a] pt-4">
        <p>SYSTEM_READY • {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </footer>

    </div>
  );
};

export default DashboardBoceto;