import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, MapPin, Calendar, DollarSign, User, CheckCircle, X } from 'lucide-react';
import CrearObra from './CrearObra';
import DetalleObra from './DetalleObra';

export default function Obras({ usuario }) {
  const [obras, setObras] = useState([]);
  const [vista, setVista] = useState('lista');
  const [obraSeleccionada, setObraSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para edición de obra
  const [modalObra, setModalObra] = useState(false);
  const [formObra, setFormObra] = useState({
    nombre: '',
    monto_contrato: '',
    fecha_inicio: '',
    fecha_fin: ''
  });

  useEffect(() => {
    cargarObras();
  }, []);

  const cargarObras = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('obras')
      .select(`
        *,
        cliente:id_cliente(nombre, email),
        jefe:id_jefe_obra(nombre)
      `)
      .order('created_at', { ascending: false });

    if (data) setObras(data);
    setLoading(false);
  };

  const cerrarObra = async (id) => {
    if (!confirm('¿Estás seguro de cerrar/finalizar esta obra? Esto marcará la obra como entregada.')) return;

    const { error } = await supabase
      .from('obras')
      .update({ estado: 'entregada' })
      .eq('id', id);

    if (!error) {
      alert('Obra cerrada/finalizada exitosamente');
      cargarObras();
    } else {
      alert('Error al cerrar la obra: ' + error.message);
    }
  };

  const eliminarObra = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta obra? Esta acción eliminará TODOS los datos asociados (pagos, tareas, fotos, etc.). Esta acción NO se puede deshacer.')) return;

    try {
      // Primero eliminar todos los datos relacionados
      await supabase.from('payments').delete().eq('obra_id', id);
      await supabase.from('payment_schedule').delete().eq('obra_id', id);
      await supabase.from('tareas_diarias').delete().eq('id_obra', id);
      await supabase.from('tareas_obra').delete().eq('id_obra', id);
      await supabase.from('tickets_cliente').delete().eq('id_obra', id);
      await supabase.from('parte_diario').delete().eq('id_obra', id);
      await supabase.from('comentarios_fotos').delete().eq('obra_id', id);

      // Finalmente eliminar la obra
      const { error } = await supabase
        .from('obras')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Obra eliminada exitosamente junto con todos sus datos');
      cargarObras();
    } catch (error) {
      console.error('Error al eliminar obra:', error);
      alert('Error al eliminar la obra: ' + error.message);
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

  // Abrir modal de edición
  const abrirModalEditarObra = (obra) => {
    setFormObra({
      nombre: obra.nombre_obra,
      monto_contrato: obra.monto_contrato,
      fecha_inicio: obra.fecha_inicio_plan,
      fecha_fin: obra.fecha_fin_plan
    });
    setObraSeleccionada(obra);
    setModalObra(true);
  };

  // Guardar cambios
  const actualizarObra = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('obras')
        .update({
          nombre_obra: formObra.nombre,
          monto_contrato: formObra.monto_contrato,
          fecha_inicio_plan: formObra.fecha_inicio,
          fecha_fin_plan: formObra.fecha_fin
        })
        .eq('id', obraSeleccionada.id);

      if (error) throw error;

      alert('Obra actualizada correctamente');
      setModalObra(false);
      cargarObras();
    } catch (err) {
      alert('Error al actualizar la obra: ' + err.message);
    }
  };

  if (vista === 'crear') {
    return <CrearObra onBack={() => { setVista('lista'); cargarObras(); }} />;
  }

  if (vista === 'detalle' && obraSeleccionada) {
    return <DetalleObra obra={obraSeleccionada} onVolver={() => { setVista('lista'); cargarObras(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Gestión de Obras</h2>
        <button
          onClick={() => setVista('crear')}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Nueva Obra
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : obras.length === 0 ? (
        <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 p-12 text-center">
          <div className="bg-zinc-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No hay obras registradas</h3>
          <p className="text-zinc-300 mb-6">Comienza creando tu primera obra</p>
          <button
            onClick={() => setVista('crear')}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            Crear Primera Obra
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {obras.map((obra) => (
            <div key={obra.id} className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 hover:shadow-md transition">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">{obra.nombre_obra}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(obra.estado)}`}>
                      {getEstadoTexto(obra.estado)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setObraSeleccionada(obra); setVista('detalle'); }}
                      className="p-2 hover:bg-zinc-800 rounded-lg transition"
                      title="Ver detalles"
                    >
                      <Edit className="w-4 h-4 text-zinc-300" />
                    </button>
                    <button
                      onClick={() => abrirModalEditarObra(obra)}
                      className="p-2 hover:bg-orange-500/10 rounded-lg transition"
                      title="Editar obra"
                    >
                      <Edit className="w-4 h-4 text-orange-500" />
                    </button>
                    {obra.estado !== 'entregada' && (
                      <button
                        onClick={() => cerrarObra(obra.id)}
                        className="p-2 hover:bg-green-50 rounded-lg transition"
                        title="Cerrar/Finalizar obra"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </button>
                    )}
                    <button
                      onClick={() => eliminarObra(obra.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar obra (permanente)"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <MapPin className="w-4 h-4" />
                    {obra.direccion}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Calendar className="w-4 h-4" />
                    {new Date(obra.fecha_inicio_plan).toLocaleDateString('es-CL')} - {new Date(obra.fecha_fin_plan).toLocaleDateString('es-CL')}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <DollarSign className="w-4 h-4" />${parseFloat(obra.monto_contrato).toLocaleString('es-CL')}
                  </div>
                  {obra.cliente && (
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <User className="w-4 h-4" />
                      {obra.cliente.nombre}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { setObraSeleccionada(obra); setVista('detalle'); }}
                  className="mt-4 w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2 rounded-lg font-medium transition"
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Editar Obra */}
      {modalObra && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-zinc-900 p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Editar Obra</h2>
            <form onSubmit={actualizarObra} className="space-y-3">
              <input
                type="text"
                value={formObra.nombre}
                onChange={(e) => setFormObra({ ...formObra, nombre: e.target.value })}
                placeholder="Nombre de la obra"
                className="w-full border p-2 rounded"
              />
              <input
                type="number"
                value={formObra.monto_contrato}
                onChange={(e) => setFormObra({ ...formObra, monto_contrato: e.target.value })}
                placeholder="Monto contrato"
                className="w-full border p-2 rounded"
              />
              <input
                type="date"
                value={formObra.fecha_inicio}
                onChange={(e) => setFormObra({ ...formObra, fecha_inicio: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <input
                type="date"
                value={formObra.fecha_fin}
                onChange={(e) => setFormObra({ ...formObra, fecha_fin: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setModalObra(false)} className="px-3 py-1 border rounded">
                  Cancelar
                </button>
                <button type="submit" className="px-3 py-1 bg-green-500 text-white rounded">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}