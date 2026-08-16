import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, User, CheckCircle2, Clock, AlertCircle, Plus, Edit2, Trash2, Wrench, Package, Droplets, ChevronDown, ChevronUp, Building2, Users, Timer } from 'lucide-react';

export default function TareasDiarias() {
  const [tareas, setTareas] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [obras, setObras] = useState([]);
  const [maestros, setMaestros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTarea, setEditingTarea] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [showRecursos, setShowRecursos] = useState(true);
  const [cantidadAEjecutar, setCantidadAEjecutar] = useState('');
  const [numeroMaestros, setNumeroMaestros] = useState(1);

  const [formData, setFormData] = useState({
    id_obra: '',
    id_actividad: '',
    fecha_asignada: new Date().toISOString().split('T')[0],
    responsable_trabajador: '',
    descripcion_trabajo: '',
    recursos_necesarios: '',
    meta_cantidad: '',
    observaciones_seguridad_calidad: '',
    estado: 'pendiente',
    materiales: [],
    herramientas: [],
    insumos: []
  });

  useEffect(() => {
    cargarDatos();
  }, [filtroFecha, filtroEstado]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      // Cargar obras
      const { data: obrasData } = await supabase
        .from('obras')
        .select('*')
        .order('nombre_obra');
      setObras(obrasData || []);

      // Cargar actividades (plantillas)
      const { data: actividadesData } = await supabase
        .from('planificacion_actividades')
        .select('*');
      setActividades(actividadesData || []);

      // Cargar maestros
      const { data: maestrosData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rol', 'maestro')
      setMaestros(maestrosData || []);

      // Cargar tareas con joins
      let query = supabase
        .from('tareas_diarias')
        .select(`
          *,
          obra:id_obra (
            nombre_obra,
            direccion
          ),
          actividad:id_actividad (
            nombre,
            descripcion,
            rendimiento_dia_hombre,
            unidad_medida
          ),
          trabajador:responsable_trabajador (
            nombre,
            telefono
          )
        `)
        .order('fecha_asignada', { ascending: false });

      if (filtroFecha) {
        query = query.eq('fecha_asignada', filtroFecha);
      }

      if (filtroEstado !== 'todos') {
        query = query.eq('estado', filtroEstado);
      }

      const { data: tareasData, error: tareasError } = await query;
      
      if (tareasError) {
        console.error('Error cargando tareas:', tareasError);
      }
      
      console.log('🟦 ADMIN - Tareas cargadas:', tareasData?.length || 0);
      console.log('🟦 ADMIN - Filtros aplicados:', { filtroFecha, filtroEstado });
      setTareas(tareasData || []);

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarActividadCompleta = async (idActividad) => {
    if (!idActividad) {
      setActividadSeleccionada(null);
      setCantidadAEjecutar('');
      setNumeroMaestros(1);
      setFormData(prev => ({
        ...prev,
        materiales: [],
        herramientas: [],
        insumos: []
      }));
      return;
    }

    const { data: actividad } = await supabase
      .from('planificacion_actividades')
      .select('*')
      .eq('id', idActividad)
      .single();

    if (actividad) {
      setActividadSeleccionada(actividad);
      setFormData(prev => ({
        ...prev,
        id_actividad: idActividad,
        materiales: actividad.materiales || [],
        herramientas: actividad.herramientas || [],
        insumos: actividad.insumos || []
      }));
    }
  };

  const calcularDuracionEstimada = () => {
    if (!actividadSeleccionada?.rendimiento_dia_hombre || !cantidadAEjecutar || cantidadAEjecutar <= 0) {
      return null;
    }

    const cantidad = parseFloat(String(cantidadAEjecutar).replace(',', '.'));
    const rendimiento = parseFloat(actividadSeleccionada.rendimiento_dia_hombre);
    const maestros = parseInt(numeroMaestros) || 1;

    if (isNaN(cantidad) || isNaN(rendimiento)) {
      return null;
    }

    // Cálculo: días = cantidad / (rendimiento * número_maestros)
    const diasNecesarios = cantidad / (rendimiento * maestros);

    return {
      dias: diasNecesarios.toFixed(2),
      cantidad,
      rendimiento,
      maestros,
      unidad: actividadSeleccionada.unidad_medida || 'unidades'
    };
  };

  const abrirModal = (tarea = null) => {
    if (tarea) {
      setEditingTarea(tarea);
      setFormData({
        id_obra: tarea.id_obra || '',
        id_actividad: tarea.id_actividad,
        fecha_asignada: tarea.fecha_asignada,
        responsable_trabajador: tarea.responsable_trabajador,
        descripcion_trabajo: tarea.descripcion_trabajo,
        recursos_necesarios: tarea.recursos_necesarios || '',
        meta_cantidad: tarea.meta_cantidad || '',
        observaciones_seguridad_calidad: tarea.observaciones_seguridad_calidad || '',
        estado: tarea.estado,
        materiales: tarea.materiales || [],
        herramientas: tarea.herramientas || [],
        insumos: tarea.insumos || []
      });
      setCantidadAEjecutar(tarea.meta_cantidad || '');
      setNumeroMaestros(1);
      cargarActividadCompleta(tarea.id_actividad);
    } else {
      setEditingTarea(null);
      setActividadSeleccionada(null);
      setCantidadAEjecutar('');
      setNumeroMaestros(1);
      setFormData({
        id_obra: '',
        id_actividad: '',
        fecha_asignada: new Date().toISOString().split('T')[0],
        responsable_trabajador: '',
        descripcion_trabajo: '',
        recursos_necesarios: '',
        meta_cantidad: '',
        observaciones_seguridad_calidad: '',
        estado: 'pendiente',
        materiales: [],
        herramientas: [],
        insumos: []
      });
    }
    setShowModal(true);
  };

  const actualizarMaterial = (index, campo, valor) => {
    const nuevosMateriales = [...formData.materiales];
    nuevosMateriales[index] = {
      ...nuevosMateriales[index],
      [campo]: valor
    };
    setFormData({...formData, materiales: nuevosMateriales});
  };

  const eliminarMaterial = (index) => {
    const nuevosMateriales = formData.materiales.filter((_, i) => i !== index);
    setFormData({...formData, materiales: nuevosMateriales});
  };

  const agregarMaterial = () => {
    setFormData({
      ...formData,
      materiales: [...formData.materiales, { item: '', cantidad: '', unidad: '' }]
    });
  };

  const actualizarHerramienta = (index, campo, valor) => {
    const nuevasHerramientas = [...formData.herramientas];
    nuevasHerramientas[index] = {
      ...nuevasHerramientas[index],
      [campo]: valor
    };
    setFormData({...formData, herramientas: nuevasHerramientas});
  };

  const eliminarHerramienta = (index) => {
    const nuevasHerramientas = formData.herramientas.filter((_, i) => i !== index);
    setFormData({...formData, herramientas: nuevasHerramientas});
  };

  const agregarHerramienta = () => {
    setFormData({
      ...formData,
      herramientas: [...formData.herramientas, { item: '', cantidad: '' }]
    });
  };

  const actualizarInsumo = (index, campo, valor) => {
    const nuevosInsumos = [...formData.insumos];
    nuevosInsumos[index] = {
      ...nuevosInsumos[index],
      [campo]: valor
    };
    setFormData({...formData, insumos: nuevosInsumos});
  };

  const eliminarInsumo = (index) => {
    const nuevosInsumos = formData.insumos.filter((_, i) => i !== index);
    setFormData({...formData, insumos: nuevosInsumos});
  };

  const agregarInsumo = () => {
    setFormData({
      ...formData,
      insumos: [...formData.insumos, { item: '', cantidad: '', unidad: '' }]
    });
  };

  const guardarTarea = async (e) => {
    e.preventDefault();
    console.log('🟦 INICIO DE GUARDADO');
    console.log('🟦 FormData recibido del formulario:', formData);

    try {
      setLoading(true);

      // VALIDACIÓN ROBUSTA DE META_CANTIDAD
      let metaCantidadParsed = null;
      if (formData.meta_cantidad !== '' && formData.meta_cantidad !== null && formData.meta_cantidad !== undefined) {
        // Convertir a string y reemplazar coma por punto para formato universal
        const formattedValue = String(formData.meta_cantidad).trim().replace(',', '.');
        console.log('🟦 Meta cantidad antes de parsear:', formData.meta_cantidad);
        console.log('🟦 Meta cantidad formateada:', formattedValue);
        
        const parsedValue = parseFloat(formattedValue);
        console.log('🟦 Meta cantidad después de parseFloat:', parsedValue);
        console.log('🟦 ¿Es NaN?:', isNaN(parsedValue));
        
        if (isNaN(parsedValue)) {
          alert('❌ Error: La "Meta de Cantidad" debe ser un número válido (ejemplos válidos: 10, 10.5, 10,5)');
          setLoading(false);
          return; // DETENER el proceso
        }
        metaCantidadParsed = parsedValue;
      }
      console.log('🟦 Meta cantidad final a guardar:', metaCantidadParsed);

      const tareaData = {
        id_obra: formData.id_obra || null,
        id_actividad: formData.id_actividad || null,
        fecha_asignada: formData.fecha_asignada,
        responsable_trabajador: formData.responsable_trabajador || null,
        descripcion_trabajo: formData.descripcion_trabajo,
        recursos_necesarios: formData.recursos_necesarios && formData.recursos_necesarios.trim() !== '' ? formData.recursos_necesarios : null,
        meta_cantidad: metaCantidadParsed, // Usar el valor VALIDADO
        observaciones_seguridad_calidad: formData.observaciones_seguridad_calidad && formData.observaciones_seguridad_calidad.trim() !== '' ? formData.observaciones_seguridad_calidad : null,
        estado: formData.estado,
        materiales: formData.materiales && formData.materiales.length > 0 ? formData.materiales : null,
        herramientas: formData.herramientas && formData.herramientas.length > 0 ? formData.herramientas : null,
        insumos: formData.insumos && formData.insumos.length > 0 ? formData.insumos : null
      };

      console.log('🟦 TareaData preparada para enviar a Supabase:', JSON.stringify(tareaData, null, 2));
      console.log('🟦 Tipo de meta_cantidad:', typeof tareaData.meta_cantidad);
      console.log('🟦 Valor exacto de meta_cantidad:', tareaData.meta_cantidad);

      let result;
      if (editingTarea) {
        console.log('🟦 MODO: Actualizando tarea existente con ID:', editingTarea.id);
        result = await supabase
          .from('tareas_diarias')
          .update(tareaData)
          .eq('id', editingTarea.id)
          .select();
      } else {
        console.log('🟦 MODO: Insertando nueva tarea');
        result = await supabase
          .from('tareas_diarias')
          .insert([tareaData])
          .select();
      }

      console.log('🟦 Resultado completo de Supabase:', result);
      console.log('🟦 result.error:', result.error);
      console.log('🟦 result.data:', result.data);
      console.log('🟦 result.status:', result.status);
      console.log('🟦 result.statusText:', result.statusText);
      console.log('🟦 result.count:', result.count);

      if (result.error) {
        console.error('❌ ERROR DE SUPABASE DETECTADO:');
        console.error('❌ Código del error:', result.error.code);
        console.error('❌ Mensaje del error:', result.error.message);
        console.error('❌ Detalles del error:', result.error.details);
        console.error('❌ Hint del error:', result.error.hint);
        console.error('❌ Objeto error completo:', JSON.stringify(result.error, null, 2));
        alert('❌ Error al guardar la tarea: ' + result.error.message);
        setLoading(false);
        return;
      }

      console.log('✅ TAREA GUARDADA EXITOSAMENTE');
      console.log('✅ Datos guardados:', result.data);
      alert('✅ Tarea guardada correctamente');
      setShowModal(false);
      setLoading(false);
      
      // Recargar datos
      console.log('🟦 Recargando lista de tareas...');
      await cargarDatos();
      console.log('🟦 Recarga completada');
      
    } catch (error) {
      console.error('❌ ERROR GENERAL GUARDANDO TAREA:');
      console.error('❌ Tipo de error:', typeof error);
      console.error('❌ Error.name:', error.name);
      console.error('❌ Error.message:', error.message);
      console.error('❌ Error.stack:', error.stack);
      console.error('❌ Error completo:', JSON.stringify(error, null, 2));
      alert('❌ Error al guardar la tarea: ' + (error.message || 'Error desconocido'));
      setLoading(false);
    }
  };

  const eliminarTarea = async (id) => {
    if (window.confirm('¿Eliminar esta tarea?')) {
      try {
        await supabase
          .from('tareas_diarias')
          .delete()
          .eq('id', id);
        cargarDatos();
      } catch (error) {
        console.error('Error eliminando tarea:', error);
      }
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await supabase
        .from('tareas_diarias')
        .update({ estado: nuevoEstado })
        .eq('id', id);
      cargarDatos();
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { color: 'bg-zinc-800 text-white border-zinc-700', icon: Clock, label: 'Pendiente' },
      en_progreso: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/50', icon: AlertCircle, label: 'En Progreso' },
      pausada: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: AlertCircle, label: 'Pausada' },
      finalizada: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle2, label: 'Finalizada' }
    };
    const badge = badges[estado] || badges.pendiente;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const duracion = calcularDuracionEstimada();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F15A29] mx-auto"></div>
          <p className="mt-4 text-zinc-300">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Tareas Diarias</h1>
        <p className="text-zinc-300 mt-1">Asigna y gestiona tareas específicas para cada maestro</p>
      </div>

      {/* Filtros y Acciones */}
      <div className="bg-zinc-900 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            {/* Filtro Fecha */}
            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-1">Fecha</label>
              <input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="px-3 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F15A29]"
              />
            </div>

            {/* Filtro Estado */}
            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-1">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-3 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F15A29]"
              >
                <option value="todos">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En Progreso</option>
                <option value="pausada">Pausada</option>
                <option value="finalizada">Finalizada</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => abrirModal()}
            className="flex items-center gap-2 bg-[#F15A29] text-white px-4 py-2 rounded-lg hover:bg-[#d94d1f] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* Lista de Tareas */}
      <div className="grid grid-cols-1 gap-4">
        {tareas.length === 0 ? (
          <div className="bg-zinc-900 rounded-lg shadow-sm p-8 text-center">
            <Calendar className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
            <p className="text-zinc-400">No hay tareas para esta fecha</p>
            <button
              onClick={() => abrirModal()}
              className="mt-4 text-[#F15A29] hover:underline"
            >
              Crear primera tarea
            </button>
          </div>
        ) : (
          tareas.map((tarea) => (
            <div key={tarea.id} className="bg-zinc-900 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Encabezado con Obra */}
                  <div className="flex items-center gap-3 mb-3">
                    <Building2 className="w-5 h-5 text-[#F15A29]" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        {tarea.obra?.nombre_obra || 'Sin obra asignada'}
                      </h3>
                      {tarea.obra?.direccion && (
                        <p className="text-sm text-zinc-400">{tarea.obra.direccion}</p>
                      )}
                    </div>
                    {getEstadoBadge(tarea.estado)}
                  </div>

                  {/* Maestro */}
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-200">
                      Maestro: {tarea.trabajador?.nombre || 'Sin asignar'}
                    </span>
                  </div>

                  {/* Actividad */}
                  <div className="mb-3">
                    <p className="text-sm font-medium text-[#F15A29]">
                      {tarea.actividad?.nombre}
                    </p>
                    {tarea.actividad?.descripcion && (
                      <p className="text-sm text-zinc-400 italic">
                        {tarea.actividad.descripcion}
                      </p>
                    )}
                    {tarea.actividad?.rendimiento_dia_hombre && (
                      <div className="flex items-center gap-2 mt-1">
                        <Timer className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-orange-600 font-medium">
                          Rendimiento: {tarea.actividad.rendimiento_dia_hombre} {tarea.actividad.unidad_medida}/día-hombre
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Descripción */}
                  <p className="text-zinc-200 mb-3">{tarea.descripcion_trabajo}</p>

                  {/* Recursos de la tarea */}
                  {(tarea.materiales?.length > 0 || tarea.herramientas?.length > 0 || tarea.insumos?.length > 0) && (
                    <div className="mt-4 p-4 bg-black rounded-lg space-y-3">
                      {/* Materiales */}
                      {tarea.materiales?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-4 h-4 text-[#F15A29]" />
                            <span className="font-medium text-sm text-zinc-200">Materiales:</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {tarea.materiales.map((mat, idx) => (
                              <div key={idx} className="text-zinc-300">
                                • {mat.item} - {mat.cantidad} {mat.unidad}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Herramientas */}
                      {tarea.herramientas?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Wrench className="w-4 h-4 text-[#F15A29]" />
                            <span className="font-medium text-sm text-zinc-200">Herramientas:</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {tarea.herramientas.map((her, idx) => (
                              <div key={idx} className="text-zinc-300">
                                • {typeof her === 'string' ? her : `${her.item} - ${her.cantidad}`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Insumos */}
                      {tarea.insumos?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Droplets className="w-4 h-4 text-[#F15A29]" />
                            <span className="font-medium text-sm text-zinc-200">Insumos:</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {tarea.insumos.map((ins, idx) => (
                              <div key={idx} className="text-zinc-300">
                                • {ins.item} - {ins.cantidad} {ins.unidad || ''}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detalles */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mt-3">
                    {tarea.meta_cantidad && (
                      <div>
                        <span className="font-medium text-zinc-200">Meta:</span>
                        <p className="text-zinc-300">{tarea.meta_cantidad} {tarea.actividad?.unidad_medida || ''}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-zinc-200">Fecha:</span>
                      <p className="text-zinc-300">
                        {new Date(tarea.fecha_asignada).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </div>

                  {tarea.observaciones_seguridad_calidad && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <span className="font-medium">⚠️ Observaciones:</span> {tarea.observaciones_seguridad_calidad}
                      </p>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => abrirModal(tarea)}
                    className="p-2 text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => eliminarTarea(tarea.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Cambio rápido de estado */}
              {tarea.estado !== 'finalizada' && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="flex gap-2">
                    {tarea.estado === 'pendiente' && (
                      <button
                        onClick={() => cambiarEstado(tarea.id, 'en_progreso')}
                        className="px-3 py-1 text-sm bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30 transition-colors"
                      >
                        Iniciar
                      </button>
                    )}
                    {tarea.estado === 'en_progreso' && (
                      <>
                        <button
                          onClick={() => cambiarEstado(tarea.id, 'pausada')}
                          className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                        >
                          Pausar
                        </button>
                        <button
                          onClick={() => cambiarEstado(tarea.id, 'finalizada')}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                          Finalizar
                        </button>
                      </>
                    )}
                    {tarea.estado === 'pausada' && (
                      <button
                        onClick={() => cambiarEstado(tarea.id, 'en_progreso')}
                        className="px-3 py-1 text-sm bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30 transition-colors"
                      >
                        Reanudar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingTarea ? 'Editar Tarea' : 'Nueva Tarea'}
              </h2>

              <form onSubmit={guardarTarea} className="space-y-4">
                {/* Obra */}
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1">
                    Obra *
                  </label>
                  <select
                    value={formData.id_obra}
                    onChange={(e) => setFormData({...formData, id_obra: e.target.value})}
                    className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F15A29]"
                    required
                  >
                    <option value="">Seleccionar obra</option>
                    {obras.map(obra => (
                      <option key={obra.id} value={obra.id}>
                        {obra.nombre_obra} - {obra.direccion}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actividad */}
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1">
                    Actividad *
                  </label>
                  <select
                    value={formData.id_actividad}
                    onChange={(e) => cargarActividadCompleta(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F15A29]"
                    required
                  >
                    <option value="">Seleccionar actividad</option>
                    {actividades.map(act => (
                      <option key={act.id} value={act.id}>
                        {act.nombre}{act.descripcion ? ` - ${act.descripcion}` : ''}
                        {act.rendimiento_dia_hombre ? ` (${act.rendimiento_dia_hombre} ${act.unidad_medida}/día-hombre)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CALCULADORA DE DURACIÓN */}
                {actividadSeleccionada?.rendimiento_dia_hombre && (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Timer className="w-6 h-6 text-[#F15A29]" />
                      <h3 className="font-bold text-white text-lg">Calculadora de Duración Estimada</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Cantidad a ejecutar */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-200 mb-1">
                          Cantidad a Ejecutar ({actividadSeleccionada.unidad_medida})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={cantidadAEjecutar}
                          onChange={(e) => {
                            setCantidadAEjecutar(e.target.value);
                            setFormData({...formData, meta_cantidad: e.target.value});
                          }}
                          placeholder="Ej: 100"
                          className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F15A29]"
                        />
                      </div>

                      {/* Número de maestros */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-200 mb-1">
                          Número de Maestros
                        </label>
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-zinc-400" />
                          <input
                            type="number"
                            min="1"
                            value={numeroMaestros}
                            onChange={(e) => setNumeroMaestros(Math.max(1, parseInt(e.target.value) || 1))}
                            className="flex-1 px-3 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F15A29]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Resultado */}
                    {duracion && (
                      <div className="bg-zinc-900 rounded-lg p-4 border-2 border-[#F15A29]">
                        <div className="flex items-start gap-3">
                          <Clock className="w-6 h-6 text-[#F15A29] mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-bold text-2xl text-[#F15A29] mb-2">
                              ⏱️ {duracion.dias} días estimados
                            </p>
                            <div className="text-sm text-zinc-200 space-y-1">
                              <p>
                                📊 <strong>Cálculo:</strong> {duracion.cantidad} {duracion.unidad} ÷ ({duracion.rendimiento} {duracion.unidad}/día × {duracion.maestros} {duracion.maestros === 1 ? 'maestro' : 'maestros'}) = <strong>{duracion.dias} días</strong>
                              </p>
                              <p className="text-zinc-300 italic mt-2">
                                Con {duracion.maestros} {duracion.maestros === 1 ? 'maestro trabajando' : 'maestros trabajando'} 8 horas al día, se completarían {duracion.cantidad} {duracion.unidad} en aproximadamente {duracion.dias} días.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-zinc-300 mt-3 italic">
                      💡 Esta estimación se basa en el rendimiento de {actividadSeleccionada.rendimiento_dia_hombre} {actividadSeleccionada.unidad_medida} por día-hombre registrado en la biblioteca de actividades.
                    </p>
                  </div>
                )}

                {/* Maestro */}
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1">
                    Maestro Responsable *
                  </label>
                  <select
                    value={formData.responsable_trabajador}
                    onChange={(e) => setFormData({...formData, responsable_trabajador: e.target.value})}
                    className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F15A29]"
                    required
                  >
                    <option value="">Seleccionar maestro</option>
                    {maestros.map(maestro => (
                      <option key={maestro.id} value={maestro.id}>
                        {maestro.nombre} - {maestro.telefono}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1">
                    Fecha Asignada *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_asignada}
                    onChange={(e) => setFormData({...formData, fecha_asignada: e.target.value})}
                    className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F15A29]"
                    required
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1">
                    Descripción del Trabajo *
                  </label>
                  <textarea
                    value={formData.descripcion_trabajo}
                    onChange={(e) => setFormData({...formData, descripcion_trabajo: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F15A29]"
                    required
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1">
                    Observaciones de Seguridad/Calidad
                  </label>
                  <textarea
                    value={formData.observaciones_seguridad_calidad}
                    onChange={(e) => setFormData({...formData, observaciones_seguridad_calidad: e.target.value})}
                    rows="2"
                    placeholder="Indicaciones especiales de seguridad o calidad"
                    className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F15A29]"
                  />
                </div>

                {/* Recursos (solo si hay actividad seleccionada) */}
                {actividadSeleccionada && (
                  <div className="border-t pt-4">
                    <button
                      type="button"
                      onClick={() => setShowRecursos(!showRecursos)}
                      className="flex items-center gap-2 text-[#F15A29] font-medium mb-4"
                    >
                      {showRecursos ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      Gestionar Materiales, Herramientas e Insumos
                    </button>

                    {showRecursos && (
                      <div className="space-y-6 bg-black p-4 rounded-lg">
                        {/* Materiales */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Package className="w-5 h-5 text-[#F15A29]" />
                              <h4 className="font-medium text-white">Materiales</h4>
                            </div>
                            <button
                              type="button"
                              onClick={agregarMaterial}
                              className="text-sm text-[#F15A29] hover:underline"
                            >
                              + Agregar material
                            </button>
                          </div>
                          <div className="space-y-2">
                            {formData.materiales.map((material, idx) => (
                              <div key={idx} className="flex gap-2">
                                <input
                                  type="text"
                                  value={material.item}
                                  onChange={(e) => actualizarMaterial(idx, 'item', e.target.value)}
                                  placeholder="Nombre del material"
                                  className="flex-1 px-3 py-2 border border-zinc-700 rounded-lg"
                                />
                                <input
                                  type="text"
                                  value={material.cantidad}
                                  onChange={(e) => actualizarMaterial(idx, 'cantidad', e.target.value)}
                                  placeholder="Cantidad"
                                  className="w-24 px-3 py-2 border border-zinc-700 rounded-lg"
                                />
                                <input
                                  type="text"
                                  value={material.unidad}
                                  onChange={(e) => actualizarMaterial(idx, 'unidad', e.target.value)}
                                  placeholder="Unidad"
                                  className="w-24 px-3 py-2 border border-zinc-700 rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => eliminarMaterial(idx)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Herramientas */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Wrench className="w-5 h-5 text-[#F15A29]" />
                              <h4 className="font-medium text-white">Herramientas</h4>
                            </div>
                            <button
                              type="button"
                              onClick={agregarHerramienta}
                              className="text-sm text-[#F15A29] hover:underline"
                            >
                              + Agregar herramienta
                            </button>
                          </div>
                          <div className="space-y-2">
                            {formData.herramientas.map((herramienta, idx) => (
                              <div key={idx} className="flex gap-2">
                                <input
                                  type="text"
                                  value={herramienta.item}
                                  onChange={(e) => actualizarHerramienta(idx, 'item', e.target.value)}
                                  placeholder="Nombre de la herramienta"
                                  className="flex-1 px-3 py-2 border border-zinc-700 rounded-lg"
                                />
                                <input
                                  type="text"
                                  value={herramienta.cantidad}
                                  onChange={(e) => actualizarHerramienta(idx, 'cantidad', e.target.value)}
                                  placeholder="Cantidad"
                                  className="w-32 px-3 py-2 border border-zinc-700 rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => eliminarHerramienta(idx)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Insumos */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Droplets className="w-5 h-5 text-[#F15A29]" />
                              <h4 className="font-medium text-white">Insumos</h4>
                            </div>
                            <button
                              type="button"
                              onClick={agregarInsumo}
                              className="text-sm text-[#F15A29] hover:underline"
                            >
                              + Agregar insumo
                            </button>
                          </div>
                          <div className="space-y-2">
                            {formData.insumos.map((insumo, idx) => (
                              <div key={idx} className="flex gap-2">
                                <input
                                  type="text"
                                  value={insumo.item}
                                  onChange={(e) => actualizarInsumo(idx, 'item', e.target.value)}
                                  placeholder="Nombre del insumo"
                                  className="flex-1 px-3 py-2 border border-zinc-700 rounded-lg"
                                />
                                <input
                                  type="text"
                                  value={insumo.cantidad}
                                  onChange={(e) => actualizarInsumo(idx, 'cantidad', e.target.value)}
                                  placeholder="Cantidad"
                                  className="w-24 px-3 py-2 border border-zinc-700 rounded-lg"
                                />
                                <input
                                  type="text"
                                  value={insumo.unidad || ''}
                                  onChange={(e) => actualizarInsumo(idx, 'unidad', e.target.value)}
                                  placeholder="Unidad"
                                  className="w-24 px-3 py-2 border border-zinc-700 rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => eliminarInsumo(idx)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F15A29]"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_progreso">En Progreso</option>
                    <option value="pausada">Pausada</option>
                    <option value="finalizada">Finalizada</option>
                  </select>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#F15A29] text-white py-3 rounded-lg hover:bg-[#d94d1f] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Guardando...' : (editingTarea ? 'Actualizar' : 'Crear') + ' Tarea'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                    className="flex-1 bg-zinc-700 text-zinc-200 py-3 rounded-lg hover:bg-zinc-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}