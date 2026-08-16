import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

export default function CrearObra({ onBack }) {
  const [clientes, setClientes] = useState([]);
  const [jefes, setJefes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre_obra: '',
    direccion: '',
    fecha_inicio_plan: '',
    fecha_fin_plan: '',
    monto_contrato: '',
    id_cliente: '',
    id_jefe_obra: '',
    estado: 'planificada'
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    const { data: clientesData } = await supabase
      .from('usuarios')
      .select('*')
      .eq('rol', 'cliente');
    
    const { data: jefesData } = await supabase
      .from('usuarios')
      .select('*')
      .in('rol', ['admin', 'administrador_obra']);

    if (clientesData) setClientes(clientesData);
    if (jefesData) setJefes(jefesData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('obras')
      .insert([form]);

    if (!error) {
      onBack();
    } else {
      alert('Error al crear la obra');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-zinc-800 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-300" />
        </button>
        <h2 className="text-2xl font-bold text-white">Nueva Obra</h2>
      </div>

      <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-200 mb-2">
                Nombre de la Obra *
              </label>
              <input
                type="text"
                value={form.nombre_obra}
                onChange={(e) => setForm({...form, nombre_obra: e.target.value})}
                className="w-full px-4 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Casa Particular Los Pinos"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-200 mb-2">
                Dirección *
              </label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => setForm({...form, direccion: e.target.value})}
                className="w-full px-4 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Av. Los Pinos 1234, Las Condes"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">
                Fecha Inicio *
              </label>
              <input
                type="date"
                value={form.fecha_inicio_plan}
                onChange={(e) => setForm({...form, fecha_inicio_plan: e.target.value})}
                className="w-full px-4 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">
                Fecha Término *
              </label>
              <input
                type="date"
                value={form.fecha_fin_plan}
                onChange={(e) => setForm({...form, fecha_fin_plan: e.target.value})}
                className="w-full px-4 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">
                Monto Contrato (CLP) *
              </label>
              <input
                type="number"
                value={form.monto_contrato}
                onChange={(e) => setForm({...form, monto_contrato: e.target.value})}
                className="w-full px-4 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="15000000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">
                Estado
              </label>
              <select
                value={form.estado}
                onChange={(e) => setForm({...form, estado: e.target.value})}
                className="w-full px-4 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="planificada">Planificada</option>
                <option value="en_curso">En Curso</option>
                <option value="pausada">Pausada</option>
                <option value="entregada">Entregada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">
                Cliente
              </label>
              <select
                value={form.id_cliente}
                onChange={(e) => setForm({...form, id_cliente: e.target.value})}
                className="w-full px-4 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Seleccionar cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">
                Administrador de Obra
              </label>
              <select
                value={form.id_jefe_obra}
                onChange={(e) => setForm({...form, id_jefe_obra: e.target.value})}
                className="w-full px-4 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Seleccionar administrador</option>
                {jefes.map((jefe) => (
                  <option key={jefe.id} value={jefe.id}>
                    {jefe.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 justify-end pt-6 border-t border-zinc-800">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-zinc-700 text-zinc-200 rounded-lg hover:bg-black transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Crear Obra
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}