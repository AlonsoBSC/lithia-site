import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, Clock, MapPin, Camera, LogOut, ChevronDown, ChevronUp, AlertTriangle, MessageSquare } from 'lucide-react';
import GestionTickets from '../admin/GestionTickets';

export default function DashboardMaestro({ usuario, onLogout }) {
  const [tareasAsignadas, setTareasAsignadas] = useState([]);
  const [asistenciaHoy, setAsistenciaHoy] = useState(null);
  const [fotosHoy, setFotosHoy] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [mostrarTickets, setMostrarTickets] = useState(false);
  const [ticketsPendientes, setTicketsPendientes] = useState(0);

  useEffect(() => {
    console.log('🟦 MAESTRO DASHBOARD - Usuario:', usuario);
    cargarDatos();
    cargarTicketsPendientes();

    // Suscripción a tickets para actualizar contador
    const subscription = supabase
      .channel('maestro-tickets')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tickets', filter: `maestro_id=eq.${usuario.id}` },
        () => cargarTicketsPendientes()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [usuario]);

  const cargarTicketsPendientes = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id')
        .eq('maestro_id', usuario.id)
        .in('estado', ['pendiente', 'en_proceso']);

      if (error) throw error;
      setTicketsPendientes(data?.length || 0);
    } catch (error) {
      console.error('Error cargando tickets pendientes:', error);
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      console.log('🟦 MAESTRO - Fecha de hoy:', hoy);
      console.log('🟦 MAESTRO - ID del usuario:', usuario.id);

      // Cargar tareas asignadas para hoy
      console.log('🟦 MAESTRO - Buscando tareas con responsable_trabajador:', usuario.id);
      
      const { data: tareas, error: errorTareas } = await supabase
        .from('tareas_diarias')
        .select(`
          *,
          planificacion_actividades:id_actividad (
            nombre,
            descripcion
          ),
          obra:id_obra (
            nombre_obra
          )
        `)
        .eq('responsable_trabajador', usuario.id)
        .eq('fecha_asignada', hoy);

      console.log('🟦 MAESTRO - Resultado de consulta de tareas:', { tareas, errorTareas });
      console.log('🟦 MAESTRO - Cantidad de tareas encontradas:', tareas?.length || 0);

      if (errorTareas) {
        console.error('❌ MAESTRO - Error al cargar tareas:', errorTareas);
        throw errorTareas;
      }
      
      setTareasAsignadas(tareas || []);

      // Cargar asistencia de hoy
      const { data: asistencias, error: errorAsist } = await supabase
        .from('asistencias')
        .select('*')
        .eq('maestro_id', usuario.id)
        .gte('fecha_hora', `${hoy}T00:00:00`)
        .lte('fecha_hora', `${hoy}T23:59:59`)
        .order('fecha_hora', { ascending: true });

      if (errorAsist) throw errorAsist;
      
      if (asistencias && asistencias.length > 0) {
        const entrada = asistencias.find(a => a.tipo === 'entrada');
        const salida = asistencias.find(a => a.tipo === 'salida');
        setAsistenciaHoy({ entrada, salida });
      }

      // Cargar fotos del día
      const { data: fotos, error: errorFotos } = await supabase
        .from('fotos_avance')
        .select('*')
        .eq('maestro_id', usuario.id)
        .gte('fecha_hora', `${hoy}T00:00:00`)
        .lte('fecha_hora', `${hoy}T23:59:59`)
        .order('fecha_hora', { ascending: false });

      if (errorFotos) throw errorFotos;
      setFotosHoy(fotos || []);
    } catch (error) {
      console.error('❌ MAESTRO - Error cargando datos:', error);
      alert('Error al cargar información');
    } finally {
      setLoading(false);
    }
  };

  const marcarAsistencia = async (tipo) => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log('📍 Ubicación actual:', lat, lng);

          // Obtener la primera tarea del día para vincular
          const tareaId = tareasAsignadas.length > 0 ? tareasAsignadas[0].id : null;

          const { data, error } = await supabase
            .from('asistencias')
            .insert({
              maestro_id: usuario.id,
              tarea_id: tareaId, // ✅ VINCULAMOS CON TAREA
              tipo,
              latitud: lat,
              longitud: lng,
              ubicacion_texto: `${lat}, ${lng}`
            });

          if (error) throw error;
          console.log(`✅ ${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada con éxito`);
          alert(`${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada con éxito`);
          cargarDatos();
        } catch (error) {
          console.error('❌ Error marcando asistencia:', error);
          alert('Error al registrar asistencia');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('❌ Error obteniendo ubicación:', error);
        alert('No se pudo obtener la ubicación. Verifica los permisos de geolocalización.');
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const subirFoto = async (tareaId) => {
    // Solicitar descripción
    const descripcion = prompt('Describe brevemente esta foto de avance:') || 'Foto de avance';

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setLoading(true);

      // ✅ OBTENER GPS AL MOMENTO DE SUBIR FOTO
      if (!navigator.geolocation) {
        alert('Tu navegador no soporta geolocalización');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const latitud = position.coords.latitude;
            const longitud = position.coords.longitude;

            console.log('📸 FOTO - GPS capturado:', { latitud, longitud });

            // Subir foto a Supabase Storage
            const fileName = `${Date.now()}_${file.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('fotos-avance')
              .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
              .from('fotos-avance')
              .getPublicUrl(fileName);

            console.log('📸 FOTO - Guardando en BD con GPS:', { latitud, longitud, tareaId });

            // Guardar registro en BD con GPS
            const { error: dbError } = await supabase
              .from('fotos_avance')
              .insert({
                tarea_id: tareaId,
                maestro_id: usuario.id,
                url_foto: publicUrl,
                descripcion,
                latitud, // ✅ GUARDAR GPS
                longitud // ✅ GUARDAR GPS
              });

            if (dbError) throw dbError;
            alert('Foto subida con éxito con ubicación GPS');
            cargarDatos();
          } catch (error) {
            console.error('Error subiendo foto:', error);
            alert('Error al subir foto: ' + error.message);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Error obteniendo ubicación para foto:', error);
          alert('No se pudo obtener la ubicación. La foto se subirá sin GPS.');
          
          // Subir sin GPS si falla la geolocalización
          (async () => {
            try {
              const fileName = `${Date.now()}_${file.name}`;
              const { error: uploadError } = await supabase.storage
                .from('fotos-avance')
                .upload(fileName, file);

              if (uploadError) throw uploadError;

              const { data: { publicUrl } } = supabase.storage
                .from('fotos-avance')
                .getPublicUrl(fileName);

              await supabase
                .from('fotos_avance')
                .insert({
                  tarea_id: tareaId,
                  maestro_id: usuario.id,
                  url_foto: publicUrl,
                  descripcion
                });

              alert('Foto subida con éxito (sin ubicación GPS)');
              cargarDatos();
            } catch (err) {
              console.error('Error subiendo foto sin GPS:', err);
              alert('Error al subir foto');
            } finally {
              setLoading(false);
            }
          })();
        }
      );
    };

    input.click();
  };

  const toggleExpandTask = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const getEstadoColor = (estado) => {
    const colores = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_progreso: 'bg-orange-500/20 text-orange-400',
      pausada: 'bg-orange-100 text-orange-800',
      finalizada: 'bg-green-100 text-green-800'
    };
    return colores[estado] || 'bg-neutral-900 text-orange-500';
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
      `}</style>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
                <span className="text-[#0a0a0a]">GRUPO</span> <span className="text-orange-500">LITHIA</span> <span className="text-[#0a0a0a]">- ¡Hola, {usuario.nombre}!</span>
              </h1>
              <p className="text-zinc-600 mt-1 font-medium">Panel del Maestro de Obra</p>
              <p className="text-xs text-zinc-400 mt-1">ID Usuario: {usuario.id}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Botón de Tickets */}
              <button
                onClick={() => setMostrarTickets(true)}
                className="relative flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold text-sm"
              >
                <AlertTriangle className="w-4 h-4" />
                Mis Tickets
                {ticketsPendientes > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                    {ticketsPendientes}
                  </span>
                )}
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-4 py-2 rounded-lg transition-colors font-semibold text-sm border border-zinc-300"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {/* Asistencia */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-[#0a0a0a] mb-4 flex items-center gap-2" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
            <Clock className="w-5 h-5 text-orange-500" />
            Asistencia de Hoy
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Entrada */}
            <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50">
              <h3 className="font-bold text-orange-500 mb-2 uppercase text-xs tracking-widest">Entrada</h3>
              {asistenciaHoy?.entrada ? (
                <div className="space-y-2">
                  <p className="text-sm text-zinc-800">
                    <strong>Hora:</strong> {new Date(asistenciaHoy.entrada.fecha_hora).toLocaleTimeString('es-ES')}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${asistenciaHoy.entrada.latitud},${asistenciaHoy.entrada.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-orange-500 hover:text-orange-600 text-sm font-medium"
                  >
                    <MapPin className="w-4 h-4" />
                    Ver ubicación en Google Maps
                  </a>
                </div>
              ) : (
                <button
                  onClick={() => marcarAsistencia('entrada')}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors"
                >
                  Marcar Entrada
                </button>
              )}
            </div>

            {/* Salida */}
            <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50">
              <h3 className="font-bold text-orange-500 mb-2 uppercase text-xs tracking-widest">Salida</h3>
              {asistenciaHoy?.salida ? (
                <div className="space-y-2">
                  <p className="text-sm text-zinc-800">
                    <strong>Hora:</strong> {new Date(asistenciaHoy.salida.fecha_hora).toLocaleTimeString('es-ES')}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${asistenciaHoy.salida.latitud},${asistenciaHoy.salida.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-orange-500 hover:text-orange-600 text-sm font-medium"
                  >
                    <MapPin className="w-4 h-4" />
                    Ver ubicación en Google Maps
                  </a>
                </div>
              ) : (
                <button
                  onClick={() => marcarAsistencia('salida')}
                  disabled={loading || !asistenciaHoy?.entrada}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg disabled:opacity-50 font-semibold text-sm transition-colors"
                >
                  Marcar Salida
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tareas Asignadas */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-[#0a0a0a] mb-4 flex items-center gap-2" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
            <Calendar className="w-5 h-5 text-orange-500" />
            Mis Tareas de Hoy ({tareasAsignadas.length})
          </h2>

          {tareasAsignadas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-500 mb-2 font-medium">No tienes tareas asignadas para hoy</p>
              <p className="text-xs text-zinc-400">Revisa la consola del navegador (F12) para ver logs de debugging</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tareasAsignadas.map((tarea) => (
                <div key={tarea.id} className="border border-zinc-200 bg-zinc-50 rounded-lg p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-orange-500">
                        {tarea.planificacion_actividades?.nombre || 'Sin actividad'}
                      </h3>
                      {tarea.obra && (
                        <p className="text-sm text-zinc-800 font-semibold mt-1">
                          📍 Obra: {tarea.obra.nombre_obra}
                        </p>
                      )}
                      <p className="text-sm text-zinc-600 mt-1">
                        {tarea.descripcion_trabajo}
                      </p>
                      {tarea.planificacion_actividades?.descripcion && (
                        <p className="text-xs text-zinc-500 mt-1 italic">
                          {tarea.planificacion_actividades.descripcion}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getEstadoColor(tarea.estado)}`}>
                      {tarea.estado.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Botón para expandir recursos */}
                  <button
                    onClick={() => toggleExpandTask(tarea.id)}
                    className="w-full flex items-center justify-between bg-white border border-zinc-200 hover:bg-zinc-100 p-3 rounded-lg mb-4 transition-colors"
                  >
                    <span className="font-bold text-zinc-700 text-sm uppercase tracking-wide">Ver Materiales, Herramientas e Insumos</span>
                    {expandedTasks[tarea.id] ? (
                      <ChevronUp className="w-5 h-5 text-zinc-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-500" />
                    )}
                  </button>

                  {/* Recursos expandidos */}
                  {expandedTasks[tarea.id] && (
                    <div className="grid md:grid-cols-3 gap-4 mb-4 p-4 bg-white border border-zinc-200 rounded-lg shadow-sm">
                      {/* Materiales */}
                      <div>
                        <h4 className="font-bold text-orange-500 mb-2 flex items-center gap-2 text-xs uppercase tracking-widest">
                          📦 Materiales
                        </h4>
                        {tarea.materiales && Array.isArray(tarea.materiales) && tarea.materiales.length > 0 ? (
                          <ul className="space-y-1 text-sm text-zinc-700">
                            {tarea.materiales.map((mat, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-orange-500">•</span> {mat.item} - <span className="font-medium">{mat.cantidad} {mat.unidad}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-zinc-400 italic">Sin materiales</p>
                        )}
                      </div>

                      {/* Herramientas */}
                      <div>
                        <h4 className="font-bold text-orange-500 mb-2 flex items-center gap-2 text-xs uppercase tracking-widest">
                          🔧 Herramientas
                        </h4>
                        {tarea.herramientas && Array.isArray(tarea.herramientas) && tarea.herramientas.length > 0 ? (
                          <ul className="space-y-1 text-sm text-zinc-700">
                            {tarea.herramientas.map((herr, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-orange-500">•</span> {herr.item}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-zinc-400 italic">Sin herramientas</p>
                        )}
                      </div>

                      {/* Insumos */}
                      <div>
                        <h4 className="font-bold text-orange-500 mb-2 flex items-center gap-2 text-xs uppercase tracking-widest">
                          🧰 Insumos
                        </h4>
                        {tarea.insumos && Array.isArray(tarea.insumos) && tarea.insumos.length > 0 ? (
                          <ul className="space-y-1 text-sm text-zinc-700">
                            {tarea.insumos.map((ins, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-orange-500">•</span> {ins.item} - <span className="font-medium">{ins.cantidad} {ins.unidad}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-zinc-400 italic">Sin insumos</p>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => subirFoto(tarea.id)}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg disabled:opacity-50 font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Subir Foto de Avance con GPS
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fotos del Día */}
        {fotosHoy.length > 0 && (
          <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#0a0a0a] mb-4 flex items-center gap-2" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
              <Camera className="w-5 h-5 text-orange-500" />
              Fotos Subidas Hoy ({fotosHoy.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {fotosHoy.map((foto) => (
                <div key={foto.id} className="relative group overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
                  <img
                    src={foto.url_foto}
                    alt="Foto de avance"
                    className="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-zinc-200 p-2">
                    <p className="text-xs font-semibold text-zinc-800">{new Date(foto.fecha_hora).toLocaleTimeString('es-ES')}</p>
                    {foto.latitud && foto.longitud && (
                      <p className="text-[10px] text-orange-600 font-medium">📍 GPS capturado</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Tickets */}
      {mostrarTickets && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-zinc-200 p-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-[#0a0a0a]" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>Mis Tickets</h2>
                <button
                  onClick={() => {
                    setMostrarTickets(false);
                    cargarTicketsPendientes();
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <GestionTickets usuario={usuario} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
