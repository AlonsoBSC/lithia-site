import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Save, X, AlertCircle, Package, Wrench, Clipboard, Clock } from 'lucide-react';

export default function PlanificacionActividades() {
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    materiales: [],
    herramientas: [],
    insumos: [],
    rendimiento_dia_hombre: '',
    unidad_medida: 'm2'
  });

  useEffect(() => {
    cargarActividades();
  }, []);

  const cargarActividades = async () => {
    try {
      const { data, error } = await supabase
        .from('planificacion_actividades')
        .select('*')
        .order('nombre');
      
      if (error) throw error;
      setActividades(data || []);
    } catch (error) {
      console.error('Error al cargar actividades:', error);
      mostrarMensaje('Error al cargar actividades', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3000);
  };

  const iniciarCreacion = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      materiales: [],
      herramientas: [],
      insumos: [],
      rendimiento_dia_hombre: '',
      unidad_medida: 'm2'
    });
    setCreando(true);
    setEditando(null);
  };

  const iniciarEdicion = (actividad) => {
    setFormData({
      nombre: actividad.nombre,
      descripcion: actividad.descripcion || '',
      materiales: actividad.materiales || [],
      herramientas: actividad.herramientas || [],
      insumos: actividad.insumos || [],
      rendimiento_dia_hombre: actividad.rendimiento_dia_hombre || '',
      unidad_medida: actividad.unidad_medida || 'm2'
    });
    setEditando(actividad.id);
    setCreando(false);
  };

  const cancelar = () => {
    setCreando(false);
    setEditando(null);
    setFormData({
      nombre: '',
      descripcion: '',
      materiales: [],
      herramientas: [],
      insumos: [],
      rendimiento_dia_hombre: '',
      unidad_medida: 'm2'
    });
  };

  const agregarItem = (tipo) => {
    const nuevoItem = tipo === 'herramientas' 
      ? { item: '', cantidad: '' }
      : { item: '', cantidad: '', unidad: '' };
    
    setFormData({
      ...formData,
      [tipo]: [...formData[tipo], nuevoItem]
    });
  };

  const actualizarItem = (tipo, index, campo, valor) => {
    const items = [...formData[tipo]];
    items[index][campo] = valor;
    setFormData({ ...formData, [tipo]: items });
  };

  const eliminarItem = (tipo, index) => {
    const items = [...formData[tipo]];
    items.splice(index, 1);
    setFormData({ ...formData, [tipo]: items });
  };

  const guardarActividad = async () => {
    if (!formData.nombre.trim()) {
      mostrarMensaje('El nombre de la actividad es obligatorio', 'error');
      return;
    }

    try {
      const dataToSave = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        materiales: formData.materiales,
        herramientas: formData.herramientas,
        insumos: formData.insumos,
        rendimiento_dia_hombre: formData.rendimiento_dia_hombre ? parseFloat(formData.rendimiento_dia_hombre) : null,
        unidad_medida: formData.unidad_medida
      };

      if (editando) {
        const { error } = await supabase
          .from('planificacion_actividades')
          .update(dataToSave)
          .eq('id', editando);
        
        if (error) throw error;
        mostrarMensaje('Actividad actualizada exitosamente', 'success');
      } else {
        const { error } = await supabase
          .from('planificacion_actividades')
          .insert([dataToSave]);
        
        if (error) throw error;
        mostrarMensaje('Actividad creada exitosamente', 'success');
      }
      
      cancelar();
      cargarActividades();
    } catch (error) {
      console.error('Error al guardar actividad:', error);
      mostrarMensaje('Error al guardar la actividad', 'error');
    }
  };

  const eliminarActividad = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta actividad? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('planificacion_actividades')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      mostrarMensaje('Actividad eliminada exitosamente', 'success');
      cargarActividades();
    } catch (error) {
      console.error('Error al eliminar actividad:', error);
      mostrarMensaje('Error al eliminar la actividad', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Biblioteca de Actividades</h2>
          <p className="text-zinc-300 mt-1">Crea plantillas de actividades reutilizables con materiales, herramientas, insumos y rendimientos</p>
        </div>
        {!creando && !editando && (
          <button
            onClick={iniciarCreacion}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus size={20} />
            Nueva Actividad
          </button>
        )}
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          mensaje.tipo === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <AlertCircle size={20} />
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Formulario */}
      {(creando || editando) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editando ? 'Editar Actividad' : 'Nueva Actividad'}
          </h3>
          
          <div className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Nombre de la Actividad *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Instalación de ventanas"
                  className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Descripción detallada de la actividad..."
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Rendimiento */}
              <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="text-orange-600" size={20} />
                  <h4 className="font-semibold text-white">Rendimiento por Día-Hombre</h4>
                </div>
                <p className="text-sm text-zinc-300 mb-3">
                  Define cuánto puede realizar 1 persona en 8 horas de trabajo
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-200 mb-1">
                      Rendimiento
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.rendimiento_dia_hombre}
                      onChange={(e) => setFormData({...formData, rendimiento_dia_hombre: e.target.value})}
                      placeholder="Ej: 50"
                      className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-200 mb-1">
                      Unidad de Medida
                    </label>
                    <select
                      value={formData.unidad_medida}
                      onChange={(e) => setFormData({...formData, unidad_medida: e.target.value})}
                      className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="m2">m² (metros cuadrados)</option>
                      <option value="m3">m³ (metros cúbicos)</option>
                      <option value="ml">ml (metros lineales)</option>
                      <option value="unidades">Unidades</option>
                      <option value="kg">Kilogramos</option>
                      <option value="ton">Toneladas</option>
                    </select>
                  </div>
                </div>
                {formData.rendimiento_dia_hombre && (
                  <div className="mt-3 text-sm text-orange-700 bg-zinc-900 px-3 py-2 rounded border border-orange-200">
                    <strong>Ejemplo:</strong> Si tienes que hacer {parseFloat(formData.rendimiento_dia_hombre) * 2} {formData.unidad_medida}, 
                    necesitarás 2 días con 1 persona, o 1 día con 2 personas.
                  </div>
                )}
              </div>
            </div>

            {/* Materiales */}
            <div className="border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="text-orange-500" size={20} />
                  <h4 className="font-semibold text-white">Materiales</h4>
                </div>
                <button
                  onClick={() => agregarItem('materiales')}
                  className="text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1"
                >
                  <Plus size={16} />
                  Agregar Material
                </button>
              </div>
              {formData.materiales.map((material, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Nombre del material"
                    value={material.item}
                    onChange={(e) => actualizarItem('materiales', index, 'item', e.target.value)}
                    className="flex-1 px-3 py-2 border border-zinc-700 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Cantidad"
                    value={material.cantidad}
                    onChange={(e) => actualizarItem('materiales', index, 'cantidad', e.target.value)}
                    className="w-24 px-3 py-2 border border-zinc-700 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Unidad"
                    value={material.unidad}
                    onChange={(e) => actualizarItem('materiales', index, 'unidad', e.target.value)}
                    className="w-24 px-3 py-2 border border-zinc-700 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => eliminarItem('materiales', index)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              {formData.materiales.length === 0 && (
                <p className="text-sm text-zinc-400 text-center py-2">No hay materiales agregados</p>
              )}
            </div>

            {/* Herramientas */}
            <div className="border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wrench className="text-green-600" size={20} />
                  <h4 className="font-semibold text-white">Herramientas</h4>
                </div>
                <button
                  onClick={() => agregarItem('herramientas')}
                  className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                >
                  <Plus size={16} />
                  Agregar Herramienta
                </button>
              </div>
              {formData.herramientas.map((herramienta, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Nombre de la herramienta"
                    value={herramienta.item}
                    onChange={(e) => actualizarItem('herramientas', index, 'item', e.target.value)}
                    className="flex-1 px-3 py-2 border border-zinc-700 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Cantidad"
                    value={herramienta.cantidad}
                    onChange={(e) => actualizarItem('herramientas', index, 'cantidad', e.target.value)}
                    className="w-24 px-3 py-2 border border-zinc-700 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => eliminarItem('herramientas', index)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              {formData.herramientas.length === 0 && (
                <p className="text-sm text-zinc-400 text-center py-2">No hay herramientas agregadas</p>
              )}
            </div>

            {/* Insumos */}
            <div className="border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clipboard className="text-purple-600" size={20} />
                  <h4 className="font-semibold text-white">Insumos</h4>
                </div>
                <button
                  onClick={() => agregarItem('insumos')}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <Plus size={16} />
                  Agregar Insumo
                </button>
              </div>
              {formData.insumos.map((insumo, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Nombre del insumo"
                    value={insumo.item}
                    onChange={(e) => actualizarItem('insumos', index, 'item', e.target.value)}
                    className="flex-1 px-3 py-2 border border-zinc-700 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Cantidad"
                    value={insumo.cantidad}
                    onChange={(e) => actualizarItem('insumos', index, 'cantidad', e.target.value)}
                    className="w-24 px-3 py-2 border border-zinc-700 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Unidad"
                    value={insumo.unidad}
                    onChange={(e) => actualizarItem('insumos', index, 'unidad', e.target.value)}
                    className="w-24 px-3 py-2 border border-zinc-700 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => eliminarItem('insumos', index)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              {formData.insumos.length === 0 && (
                <p className="text-sm text-zinc-400 text-center py-2">No hay insumos agregados</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={cancelar}
              className="flex items-center gap-2 px-4 py-2 border border-zinc-700 text-zinc-200 rounded-lg hover:bg-black transition-colors"
            >
              <X size={18} />
              Cancelar
            </button>
            <button
              onClick={guardarActividad}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Save size={18} />
              Guardar Actividad
            </button>
          </div>
        </div>
      )}

      {/* Lista de Actividades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actividades.length === 0 ? (
          <div className="col-span-full text-center py-12 text-zinc-400 bg-zinc-900 rounded-lg border border-zinc-800">
            <AlertCircle size={48} className="mx-auto mb-3 text-zinc-500" />
            <p className="text-lg">No hay actividades registradas</p>
            <p className="text-sm">Crea tu primera actividad para comenzar</p>
          </div>
        ) : (
          actividades.map((actividad) => (
            <div key={actividad.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-white">{actividad.nombre}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => iniciarEdicion(actividad)}
                    className="text-orange-500 hover:text-orange-400 p-1 hover:bg-orange-500/10 rounded transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => eliminarActividad(actividad.id)}
                    className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {actividad.descripcion && (
                <p className="text-sm text-zinc-300 mb-3 line-clamp-2">{actividad.descripcion}</p>
              )}

              {actividad.rendimiento_dia_hombre && (
                <div className="mb-3 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-700">
                    <Clock size={14} />
                    <span className="text-sm font-medium">
                      {actividad.rendimiento_dia_hombre} {actividad.unidad_medida}/día-hombre
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-orange-500">
                  <Package size={14} />
                  <span>{actividad.materiales?.length || 0} materiales</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <Wrench size={14} />
                  <span>{actividad.herramientas?.length || 0} herramientas</span>
                </div>
                <div className="flex items-center gap-2 text-purple-600">
                  <Clipboard size={14} />
                  <span>{actividad.insumos?.length || 0} insumos</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}