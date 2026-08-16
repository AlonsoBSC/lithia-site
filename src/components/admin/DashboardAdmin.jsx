import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { LayoutDashboard, Building2, Users, Calendar, DollarSign, AlertCircle, TrendingUp, LogOut, CheckSquare, ClipboardCheck, Wallet, ListChecks, AlertTriangle, FileText, Package, BarChart3 } from 'lucide-react';
import Obras from './Obras';
import TareasDiarias from './TareasDiarias';
import AsistenciasAvances from './AsistenciasAvances';
import GestionPagos from './GestionPagos';
import GestionUsuarios from './GestionUsuarios';
import PlanificacionActividades from './PlanificacionActividades';
import GestionTickets from './GestionTickets';
import Reportes from './Reportes';
import Inventario from './Inventario';

export default function DashboardAdmin({ usuario, onLogout }) {
  const [vista, setVista] = useState('dashboard');
  const [obras, setObras] = useState([]);
  const [stats, setStats] = useState({
    totalObras: 0,
    obrasActivas: 0,
    totalContratos: 0,
    alertas: 0
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    // Cargar obras
    const { data: obrasData } = await supabase
      .from('obras')
      .select('*')
      .order('created_at', { ascending: false });

    if (obrasData) {
      setObras(obrasData);
      
      const activas = obrasData.filter(o => o.estado === 'en_curso').length;
      const total = obrasData.reduce((sum, o) => sum + parseFloat(o.monto_contrato || 0), 0);
      
      setStats({
        totalObras: obrasData.length,
        obrasActivas: activas,
        totalContratos: total,
        alertas: 0
      });
    }
  };

  const getEstadoColor = (estado) => {
    const colores = {
      planificada: 'bg-yellow-100 text-yellow-700',
      en_curso: 'bg-green-100 text-green-700',
      pausada: 'bg-orange-100 text-orange-700',
      entregada: 'bg-orange-500/20 text-orange-400'
    };
    return colores[estado] || 'bg-zinc-800 text-zinc-200';
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      planificada: 'Planificada',
      en_curso: 'En Curso',
      pausada: 'Pausada',
      entregada: 'Entregada'
    };
    return textos[estado] || estado;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-zinc-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold"><span className="text-white">GRUPO</span> <span className="text-orange-500">LITHIA</span></h1>
                <p className="text-zinc-400 text-sm">Panel de Administración</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">{usuario.nombre}</p>
                <p className="text-zinc-400 text-sm capitalize">{usuario.rol.replace('_', ' ')}</p>
              </div>
              <button
                onClick={onLogout}
                className="bg-zinc-900/10 hover:bg-zinc-900/20 p-2 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6 overflow-x-auto">
            <button
              onClick={() => setVista('dashboard')}
              className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                vista === 'dashboard'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-zinc-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </div>
            </button>
            <button
              onClick={() => setVista('obras')}
              className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                vista === 'obras'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-zinc-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Obras
              </div>
            </button>
            <button
              onClick={() => setVista('usuarios')}
              className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                vista === 'usuarios'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-zinc-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gestión de Usuarios
              </div>
            </button>
            <button
              onClick={() => setVista('actividades')}
              className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                vista === 'actividades'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-zinc-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <ListChecks className="w-5 h-5" />
                Actividades
              </div>
            </button>
            <button
              onClick={() => setVista('tareas')}
              className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                vista === 'tareas'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-zinc-300 hover:text-white'
              }`}
            > 
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Tareas Diarias
              </div>
            </button>
            <button
              onClick={() => setVista('asistencias')}
              className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                vista === 'asistencias'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-zinc-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                Asistencias y Avances
              </div>
            </button>
            <button
              onClick={() => setVista('tickets')}
              className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                vista === 'tickets'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-zinc-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Tickets
              </div>
            </button>
            <button
              onClick={() => setVista('pagos')}
              className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                vista === 'pagos'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-zinc-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Gestión de Pagos
              </div>
            </button>
            <button
              onClick={() => setVista('reportes')}
              className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                vista === 'reportes'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-zinc-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Reportes
              </div>
            </button>
            <button
              onClick={() => setVista('inventario')}
              className={`px-4 py-4 font-medium border-b-2 transition whitespace-nowrap ${
                vista === 'inventario'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-zinc-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Inventario
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {vista === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-zinc-900 rounded-xl shadow-sm p-6 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-300 text-sm font-medium">Total Obras</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.totalObras}</p>
                  </div>
                  <div className="bg-orange-500/20 p-3 rounded-lg">
                    <Building2 className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-xl shadow-sm p-6 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-300 text-sm font-medium">Obras Activas</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.obrasActivas}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-xl shadow-sm p-6 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-300 text-sm font-medium">Contratos Totales</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      ${stats.totalContratos.toLocaleString('es-CL')}
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-xl shadow-sm p-6 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-300 text-sm font-medium">Alertas</p>
                    <p className="text-3xl font-bold text-white mt-2">{stats.alertas}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Obras Recientes */}
            <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800">
              <div className="p-6 border-b border-zinc-800">
                <h2 className="text-xl font-bold text-white">Obras Recientes</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {obras.slice(0, 5).map((obra) => (
                  <div key={obra.id} className="p-6 hover:bg-black transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{obra.nombre_obra}</h3>
                        <p className="text-sm text-zinc-300">{obra.direccion}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-zinc-400">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {new Date(obra.fecha_inicio_plan).toLocaleDateString('es-CL')}
                          </span>
                          <span className="text-sm text-zinc-400">
                            <DollarSign className="w-4 h-4 inline mr-1" />
                            ${parseFloat(obra.monto_contrato).toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(obra.estado)}`}>
                        {getEstadoTexto(obra.estado)}
                      </span>
                    </div>
                  </div>
                ))}
                
                {obras.length === 0 && (
                  <div className="p-12 text-center">
                    <Building2 className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
                    <p className="text-zinc-300">No hay obras registradas</p>
                    <button
                      onClick={() => setVista('obras')}
                      className="mt-4 text-orange-500 hover:text-orange-400 font-medium"
                    >
                      Crear primera obra
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {vista === 'obras' && (
          <Obras usuario={usuario} />
        )}

        {vista === 'usuarios' && (
          <GestionUsuarios />
        )}

        {vista === 'actividades' && (
          <PlanificacionActividades />
        )}

        {vista === 'tareas' && (
          <TareasDiarias />
        )}

        {vista === 'asistencias' && (
          <AsistenciasAvances />
        )}

        {vista === 'tickets' && (
          <GestionTickets usuario={usuario} />
        )}

        {vista === 'pagos' && (
          <GestionPagos />
        )}

        {vista === 'reportes' && (
          <Reportes />
        )}

        {vista === 'inventario' && (
          <Inventario />
        )}
      </main>
    </div>
  );
}
