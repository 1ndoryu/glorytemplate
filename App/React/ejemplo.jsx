/* sentinel-disable-file limite-lineas -- Archivo de ejemplo/demo, no es codigo de produccion (ver AUDITORIA_COMPLETA.md C-B4) */
/* TO-DO: Eliminar este archivo muerto cuando se confirme que ya no se necesita como referencia visual */
import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  Settings, 
  Lock, 
  Unlock, 
  RotateCcw, 
  Download, 
  Play, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  LogOut,
  CreditCard,
  AlertTriangle,
  X
} from 'lucide-react';

const App = () => {
  // Estado de Autenticación
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('calendario');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Estado para simular la Alerta de Exceso de Cupo (Requisito Cliente)
  const [showOverbookingModal, setShowOverbookingModal] = useState(false);

  // Estado simulado del calendario
  const [clasesSemana, setClasesSemana] = useState([
    { id: 1, dia: 'Lunes', horaInicio: '08:00', horaFin: '13:00', asignatura: 'Conducción Racional', bloqueada: true, alumnos: 12 },
    { id: 2, dia: 'Lunes', horaInicio: '15:00', horaFin: '19:00', asignatura: 'Seguridad Vial', bloqueada: false, alumnos: 12 },
    { id: 3, dia: 'Martes', horaInicio: '08:00', horaFin: '12:00', asignatura: 'Logística', bloqueada: false, alumnos: 10 },
    { id: 4, dia: 'Martes', horaInicio: '12:30', horaFin: '15:30', asignatura: 'Primeros Auxilios', bloqueada: false, alumnos: 10 },
    { id: 5, dia: 'Miércoles', horaInicio: '08:00', horaFin: '14:00', asignatura: 'Reglamentación', bloqueada: true, alumnos: 15 },
    { id: 6, dia: 'Jueves', horaInicio: '15:00', horaFin: '20:00', asignatura: 'Mecánica', bloqueada: false, alumnos: 8 },
    { id: 7, dia: 'Viernes', horaInicio: '08:00', horaFin: '13:00', asignatura: 'Conducción Racional', bloqueada: false, alumnos: 12 },
  ]);

  const [alumnos, setAlumnos] = useState([
    { id: 1, nombre: 'Carlos Ruiz', progreso: 28, total: 35, estado: 'ok' },
    { id: 2, nombre: 'Ana García', progreso: 15, total: 35, estado: 'warning' },
    { id: 3, nombre: 'Luis Mendoza', progreso: 35, total: 35, estado: 'completed' },
    { id: 4, nombre: 'Elena Pozo', progreso: 32, total: 35, estado: 'ok' },
  ]);

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  const toggleBloqueo = (id) => {
    setClasesSemana(prev => prev.map(clase => 
      clase.id === id ? { ...clase, bloqueada: !clase.bloqueada } : clase
    ));
  };

  // Simulación mejorada: Muestra alerta de sobrecupo antes de "terminar"
  const handleGenerar = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowOverbookingModal(true); // Simulamos el conflicto que pidió el cliente
    }, 1500);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  // --- PANTALLA DE LOGIN (Requisito Nuevo) ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="bg-blue-600 p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 backdrop-blur-sm">
              A
            </div>
            <h1 className="text-2xl font-bold text-white">AutoManager CAP</h1>
            <p className="text-blue-100 mt-2">Gestión inteligente de calendarios</p>
          </div>
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" placeholder="admin@autoescuela.com" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input type="password" placeholder="••••••••" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-black transition-all transform active:scale-95">
                Iniciar Sesión
              </button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-6">Versión Demo v1.0.2</p>
          </div>
        </div>
      </div>
    );
  }

  // --- COMPONENTES INTERNOS ---

  const OverbookingModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-orange-50 p-6 border-b border-orange-100 flex items-start gap-4">
          <div className="p-3 bg-orange-100 rounded-full text-orange-600">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800">Conflicto de Capacidad Detectado</h3>
            <p className="text-sm text-gray-600 mt-1">
              El Lunes a las 08:00 hay <strong>18 alumnos disponibles</strong> para un aula de <strong>15 plazas</strong>.
            </p>
          </div>
          <button onClick={() => setShowOverbookingModal(false)} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Selecciona manualmente quién asiste:</p>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50">
                <span className="text-sm text-gray-700">Alumno Pendiente {i + 1}</span>
                <input type="checkbox" defaultChecked={i < 2} className="w-4 h-4 text-blue-600 rounded" />
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-3">
             <button onClick={() => setShowOverbookingModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancelar</button>
             <button onClick={() => setShowOverbookingModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Confirmar Selección</button>
          </div>
        </div>
      </div>
    </div>
  );

  const ClaseCard = ({ clase }) => (
    <div 
      className={`p-3 rounded-lg border-l-4 mb-3 transition-all cursor-pointer shadow-sm group hover:shadow-md ${
        clase.bloqueada 
          ? 'bg-red-50 border-red-500' 
          : 'bg-white border-blue-500 hover:bg-blue-50'
      }`}
      onClick={() => toggleBloqueo(clase.id)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-gray-800 text-sm">{clase.asignatura}</h4>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Clock size={12} className="mr-1" />
            {clase.horaInicio} - {clase.horaFin}
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Users size={12} className="mr-1" />
            {clase.alumnos} alumnos
          </div>
        </div>
        <button className={`text-gray-400 hover:text-gray-600 transition-colors ${clase.bloqueada ? 'text-red-500' : ''}`}>
          {clase.bloqueada ? <Lock size={14} /> : <Unlock size={14} className="opacity-0 group-hover:opacity-100" />}
        </button>
      </div>
    </div>
  );

  const renderCalendario = () => (
    <div className="h-full flex flex-col relative">
      {/* Grid Calendario */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button className="p-1 hover:bg-white rounded-md shadow-sm transition-all"><ChevronLeft size={18} /></button>
            <span className="px-4 text-sm font-medium text-gray-600">Semana 14 - 20 Oct</span>
            <button className="p-1 hover:bg-white rounded-md shadow-sm transition-all"><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
            <RotateCcw size={16} />
            <span className="hidden md:inline">Deshacer</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
            <Download size={16} />
            <span className="hidden md:inline">Reportes</span>
          </button>
          <button 
            onClick={handleGenerar}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-all active:scale-95"
          >
            {isGenerating ? (
              <span className="animate-pulse">Calculando...</span>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span>Generar</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-5 gap-4 min-w-[800px]">
          {diasSemana.map(dia => (
            <div key={dia} className="flex flex-col">
              <div className="text-center pb-3 border-b border-gray-100 mb-3">
                <span className="font-semibold text-gray-700">{dia}</span>
              </div>
              <div className="flex-1 bg-gray-50/50 rounded-lg p-2 min-h-[500px]">
                {clasesSemana.filter(c => c.dia === dia).map(clase => (
                  <ClaseCard key={clase.id} clase={clase} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderConfig = () => (
    <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Configuración del Centro</h2>
        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide">Plan Pro Activo</span>
      </div>
      
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-2 text-blue-800 font-semibold">
            <CreditCard size={18}/> Suscripción
          </div>
          <p className="text-sm text-blue-600 mb-3">Tu próxima facturación es el 01 Nov 2025.</p>
          <button className="text-xs bg-white text-blue-600 px-3 py-2 rounded border border-blue-200 font-medium hover:bg-blue-50">Gestionar Pagos</button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Capacidad máxima por clase</label>
          <input type="number" defaultValue={15} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          <p className="text-xs text-gray-400 mt-1">Si la demanda supera este número, el sistema pedirá selección manual.</p>
        </div>

        {/* ... Resto de configuración igual ... */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-black transition-colors">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );

  // Render principal con Layout
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Modal de Alerta */}
      {showOverbookingModal && <OverbookingModal />}

      {/* Sidebar */}
      <div className="w-20 lg:w-64 bg-white border-r border-gray-200 flex flex-col justify-between transition-all duration-300">
        <div>
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">A</div>
            <span className="font-bold text-lg hidden lg:block text-gray-800">AutoManager</span>
          </div>

          <nav className="mt-6 px-4 space-y-2">
            {[
              { id: 'calendario', icon: Calendar, label: 'Calendario' },
              { id: 'alumnos', icon: Users, label: 'Alumnos' },
              { id: 'config', icon: Settings, label: 'Configuración' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon size={20} strokeWidth={2} />
                <span className="hidden lg:block">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100">
           <button onClick={() => setIsLoggedIn(false)} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl w-full transition-colors">
              <LogOut size={20} />
              <span className="hidden lg:block text-sm font-medium">Cerrar Sesión</span>
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden p-4 lg:p-8 relative">
          {activeTab === 'calendario' && renderCalendario()}
          {activeTab === 'alumnos' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Estado de Alumnos</h2>
              {/* Tabla de alumnos igual que antes... */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 text-sm">
                      <th className="pb-3 pl-2">Alumno</th>
                      <th className="pb-3">Progreso</th>
                      <th className="pb-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnos.map((alumno) => (
                      <tr key={alumno.id} className="border-b border-gray-50">
                        <td className="py-4 pl-2 font-medium">{alumno.nombre}</td>
                        <td className="py-4 text-sm">{alumno.progreso}/35h</td>
                        <td className="py-4"><span className="px-2 py-1 text-xs bg-gray-100 rounded-full">{alumno.estado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'config' && renderConfig()}
        </main>
      </div>
    </div>
  );
};

export default App;