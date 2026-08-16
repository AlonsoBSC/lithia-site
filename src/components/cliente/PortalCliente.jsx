import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, Calendar, MapPin, Image, MessageSquare, Send, Eye, Clock, User, DollarSign, CreditCard, Calendar as CalendarIcon, AlertCircle, CheckCircle, LogOut } from 'lucide-react';

export default function PortalCliente({ usuario, onLogout }) {
  const [obras, setObras] = useState([]);
  const [obraSeleccionada, setObraSeleccionada] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [fotosDelDia, setFotosDelDia] = useState([]);
  const [comentarios, setComentarios] = useState({});
  const [nuevoComentario, setNuevoComentario] = useState({});
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState('fotos'); // 'fotos' o 'pagos'
  
  // Estados para pagos
  const [planPagos, setPlanPagos] = useState([]);
  const [resumenPagos, setResumenPagos] = useState({
    montoTotal: 0,
    totalAbonado: 0,
    totalPendiente: 0,
    proximoPago: null
  });

  useEffect(() => {
    if (usuario?.id) {
      cargarObrasCliente();
    }
  }, [usuario]);

  useEffect(() => {
    if (obraSeleccionada) {
      cargarFotosDelDia();
      cargarPlanPagos();
    }
  }, [obraSeleccionada, fechaSeleccionada]);

  const cargarObrasCliente = async () => {
    try {
      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .eq('id_cliente', usuario.id);

      if (error) throw error;
      
      console.log('Obras encontradas:', data);
      setObras(data || []);
      if (data && data.length > 0) {
        setObraSeleccionada(data[0]);
      }
    } catch (error) {
      console.error('Error al cargar obras:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarFotosDelDia = async () => {
    try {
      console.log('Buscando tareas para obra:', obraSeleccionada.id, 'fecha:', fechaSeleccionada);
      
      // CORRECCIÓN: Filtrar directamente por id_obra (que existe en tareas_diarias)
      const { data: tareas, error: tareasError } = await supabase
        .from('tareas_diarias')
        .select('id, descripcion_trabajo')
        .eq('id_obra', obraSeleccionada.id)
        .eq('fecha_asignada', fechaSeleccionada);

      if (tareasError) {
        console.error('Error al cargar tareas:', tareasError);
        throw tareasError;
      }

      console.log('Tareas encontradas:', tareas);

      if (tareas && tareas.length > 0) {
        const tareasIds = tareas.map(t => t.id);
        console.log('IDs de tareas:', tareasIds);
        
        const { data: fotos, error } = await supabase
          .from('fotos_avance')
          .select(`
            *,
            maestro_id (
              id,
              nombre
            )
          `)
          .in('tarea_id', tareasIds)
          .order('fecha_hora', { ascending: false });

        if (error) throw error;

        console.log('Fotos encontradas:', fotos);

        // Cargar comentarios para cada foto
        const fotosConComentarios = await Promise.all(
          (fotos || []).map(async (foto) => {
            const { data: comentariosData } = await supabase
              .from('comentarios_fotos')
              .select('*')
              .eq('foto_id', foto.id)
              .order('fecha', { ascending: true });

            return {
              ...foto,
              comentarios: comentariosData || []
            };
          })
        );

        setFotosDelDia(fotosConComentarios);
      } else {
        console.log('No se encontraron tareas para esta fecha');
        setFotosDelDia([]);
      }
    } catch (error) {
      console.error('Error al cargar fotos:', error);
    }
  };

  const cargarPlanPagos = async () => {
    try {
      // Cargar plan de pagos
      const { data: planData, error: planError } = await supabase
        .from('payment_schedule')
        .select('*')
        .eq('obra_id', obraSeleccionada.id)
        .order('payment_number', { ascending: true });

      if (planError) throw planError;

      // Cargar pagos realizados
      const { data: pagosData, error: pagosError } = await supabase
        .from('payments')
        .select('*')
        .eq('obra_id', obraSeleccionada.id)
        .order('fecha_pago', { ascending: false });

      if (pagosError) throw pagosError;

      setPlanPagos(planData || []);

      // Calcular resumen
      const montoTotal = obraSeleccionada.monto_contrato;
      const totalAbonado = (pagosData || []).reduce((sum, p) => sum + parseFloat(p.monto), 0);
      const totalPendiente = montoTotal - totalAbonado;

      // Encontrar próximo pago
      const proximoPago = (planData || []).find(p => p.status === 'pendiente');

      setResumenPagos({
        montoTotal,
        totalAbonado,
        totalPendiente,
        proximoPago
      });
    } catch (error) {
      console.error('Error al cargar plan de pagos:', error);
    }
  };

  const agregarComentario = async (fotoId) => {
    const comentario = nuevoComentario[fotoId]?.trim();
    if (!comentario) return;

    try {
      // 1. Guardar el comentario en comentarios_fotos
      const { error: comentarioError } = await supabase
        .from('comentarios_fotos')
        .insert({
          foto_id: fotoId,
          obra_id: obraSeleccionada.id,
          cliente_email: usuario.email.toLowerCase(),
          comentario: comentario,
          leido: false
        });

      if (comentarioError) throw comentarioError;

      // 2. Buscar la foto para obtener el maestro_id
      const foto = fotosDelDia.find(f => f.id === fotoId);
      
      if (foto && foto.maestro_id) {
        // 3. Crear un ticket de prioridad ALTA automáticamente
        const { error: ticketError } = await supabase
          .from('tickets')
          .insert({
            foto_id: fotoId,
            obra_id: obraSeleccionada.id,
            maestro_id: foto.maestro_id.id, // ID del maestro que subió la foto
            cliente_id: usuario.id,
            observacion: comentario,
            prioridad: 'ALTA',
            estado: 'pendiente'
          });

        if (ticketError) {
          console.error('Error al crear ticket:', ticketError);
          // No lanzamos error para no bloquear el comentario
        } else {
          console.log('✅ Ticket de prioridad ALTA creado para el maestro');
        }
      }

      setNuevoComentario({ ...nuevoComentario, [fotoId]: '' });
      cargarFotosDelDia();
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      alert('Error al guardar el comentario');
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatearHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(monto);
  };

  const calcularPorcentajePagado = () => {
    if (resumenPagos.montoTotal === 0) return 0;
    return ((resumenPagos.totalAbonado / resumenPagos.montoTotal) * 100).toFixed(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pagado':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'vencido':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-white/70';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pagado':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pendiente':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'vencido':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-white/50" />;
    }
  };

  const diasHastaFecha = (fecha) => {
    const hoy = new Date();
    const fechaObj = new Date(fecha);
    const diff = Math.ceil((fechaObj - hoy) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-zinc-600 font-medium">Cargando portal del cliente...</p>
        </div>
      </div>
    );
  }

  if (obras.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        `}</style>
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-8 max-w-md text-center">
          <Building2 className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-orange-500 mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>Sin Obras Asignadas</h2>
          <p className="text-zinc-600">No tienes obras asignadas en este momento.</p>
          <button
            onClick={onLogout}
            className="mt-6 px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 mx-auto font-semibold text-sm"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
      `}</style>
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
                <span className="text-[#0a0a0a]">GRUPO</span> <span className="text-orange-500">LITHIA</span> <span className="text-[#0a0a0a]">- Portal del Cliente</span>
              </h1>
              <p className="text-sm text-zinc-500 mt-1 font-medium">{usuario.nombre} ({usuario.email})</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Selector de Obras - SIEMPRE visible */}
              <select
                value={obraSeleccionada?.id || ''}
                onChange={(e) => {
                  const obra = obras.find(o => o.id === e.target.value);
                  setObraSeleccionada(obra);
                }}
                className="px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-zinc-800 text-sm font-medium outline-none"
              >
                {obras.map(obra => (
                  <option key={obra.id} value={obra.id}>{obra.nombre_obra}</option>
                ))}
              </select>

              <button
                onClick={onLogout}
                className="px-4 py-2 border border-zinc-200 bg-zinc-50 text-zinc-700 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 transition-colors flex items-center gap-2 text-sm font-semibold shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información de la Obra */}
        {obraSeleccionada && (
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-orange-500" />
                <div>
                  <h2 className="text-2xl font-bold text-[#0a0a0a]" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
                    {obraSeleccionada.nombre_obra}
                  </h2>
                  <div className="flex items-center gap-2 text-zinc-500 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">{obraSeleccionada.direccion}</span>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                obraSeleccionada.estado === 'en_curso' ? 'bg-green-100 text-green-800' :
                obraSeleccionada.estado === 'planificada' ? 'bg-orange-100 text-orange-800' :
                obraSeleccionada.estado === 'pausada' ? 'bg-yellow-100 text-yellow-800' :
                'bg-zinc-100 text-zinc-800'
              }`}>
                {obraSeleccionada.estado === 'en_curso' ? 'En Curso' :
                 obraSeleccionada.estado === 'planificada' ? 'Planificada' :
                 obraSeleccionada.estado === 'pausada' ? 'Pausada' : 'Entregada'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Inicio</p>
                  <p className="font-bold text-zinc-800">
                    {new Date(obraSeleccionada.fecha_inicio_plan).toLocaleDateString('es-CL')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Término</p>
                  <p className="font-bold text-zinc-800">
                    {new Date(obraSeleccionada.fecha_fin_plan).toLocaleDateString('es-CL')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-lg">
                <DollarSign className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Monto Total</p>
                  <p className="font-bold text-zinc-800">
                    {formatearMoneda(obraSeleccionada.monto_contrato)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toggle entre Fotos, Pagos y Mensajes */}
        <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl border border-zinc-200 shadow-sm">
          <button
            onClick={() => setVistaActual('fotos')}
            className={`flex-1 py-2.5 px-6 rounded-lg font-bold text-sm tracking-wide transition-all ${
              vistaActual === 'fotos'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Image className="w-4 h-4" />
              Progreso Diario
            </div>
          </button>
          <button
            onClick={() => setVistaActual('pagos')}
            className={`flex-1 py-2.5 px-6 rounded-lg font-bold text-sm tracking-wide transition-all ${
              vistaActual === 'pagos'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" />
              Plan de Pagos
            </div>
          </button>
        </div>

        {/* Vista de Fotos */}
        {vistaActual === 'fotos' && (
          <>
            {/* Selector de Fecha */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-6 mb-6">
              <label className="block text-sm font-bold text-orange-500 mb-2 uppercase tracking-wide">
                Seleccionar fecha para ver progreso
              </label>
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full md:w-auto min-w-[200px] px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-zinc-800 font-medium outline-none"
              />
            </div>

            {/* Galería de Fotos */}
            {fotosDelDia.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-16 text-center">
                <Image className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-orange-500 mb-2">
                  No hay fotos para esta fecha
                </h3>
                <p className="text-zinc-500">
                  Los maestros aún no han subido fotos del progreso para el {formatearFecha(fechaSeleccionada)}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {fotosDelDia.map((foto) => (
                  <div key={foto.id} className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                    {/* Imagen */}
                    <div className="relative md:w-2/5 aspect-video md:aspect-auto bg-zinc-100 cursor-pointer overflow-hidden group" onClick={() => setFotoAmpliada(foto)}>
                      <img
                        src={foto.url_foto}
                        alt={foto.descripcion}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-orange-500 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 shadow-sm border border-zinc-200">
                        <Eye className="w-3.5 h-3.5" />
                        Ampliar
                      </div>
                    </div>

                    {/* Información */}
                    <div className="p-6 md:w-3/5 flex flex-col">
                      <p className="text-lg font-medium text-zinc-800 mb-4">{foto.descripcion || 'Sin descripción'}</p>
                      
                      <div className="flex flex-wrap gap-4 mb-6 text-sm">
                        <div className="flex items-center gap-1.5 text-zinc-500 bg-zinc-50 px-3 py-1.5 rounded-md border border-zinc-100">
                          <Clock className="w-4 h-4 text-orange-400" />
                          <span className="font-medium">{formatearHora(foto.fecha_hora)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500 bg-zinc-50 px-3 py-1.5 rounded-md border border-zinc-100">
                          <User className="w-4 h-4 text-orange-400" />
                          <span className="font-medium">{foto.maestro_id?.nombre || 'Sin asignar'}</span>
                        </div>
                        {foto.latitud && foto.longitud && (
                          <div className="flex items-center gap-1.5 text-orange-500 bg-orange-50 px-3 py-1.5 rounded-md border border-orange-100">
                            <MapPin className="w-4 h-4" />
                            <a
                              href={`https://www.google.com/maps?q=${foto.latitud},${foto.longitud}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:underline"
                            >
                              Ver ubicación
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Comentarios Existentes */}
                      {foto.comentarios && foto.comentarios.length > 0 && (
                        <div className="mb-6 space-y-3 flex-1">
                          <h4 className="font-bold text-orange-500 flex items-center gap-2 text-xs uppercase tracking-wider">
                            <MessageSquare className="w-4 h-4" />
                            Tus observaciones anteriores
                          </h4>
                          {foto.comentarios.map((com) => (
                            <div key={com.id} className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 relative">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-zinc-400">
                                  {formatearFecha(com.fecha)} - {formatearHora(com.fecha)}
                                </span>
                                {com.leido && (
                                  <span className="text-[10px] font-bold tracking-wider uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    Leído
                                  </span>
                                )}
                              </div>
                              <p className="text-zinc-700 text-sm leading-relaxed">{com.comentario}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Nueva Observación */}
                      <div className="border-t border-zinc-200 pt-5 mt-auto">
                        <label className="block text-xs font-bold text-orange-500 mb-2 uppercase tracking-wide">
                          Agregar nueva observación
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={nuevoComentario[foto.id] || ''}
                            onChange={(e) => setNuevoComentario({ ...nuevoComentario, [foto.id]: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && agregarComentario(foto.id)}
                            placeholder="Escribe tu comentario u observación..."
                            className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm"
                          />
                          <button
                            onClick={() => agregarComentario(foto.id)}
                            className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 font-semibold text-sm shadow-sm"
                          >
                            <Send className="w-4 h-4" />
                            Enviar
                          </button>
                        </div>
                        <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Se notificará automáticamente al equipo a cargo.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Vista de Pagos */}
        {vistaActual === 'pagos' && (
          <div className="space-y-6">
            {/* Resumen de Pagos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 flex flex-col justify-center items-center text-center">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-zinc-600" />
                  </div>
                  <h3 className="font-bold text-zinc-500 text-xs uppercase tracking-wider">Monto Total</h3>
                </div>
                <p className="text-3xl font-bold text-[#0a0a0a]" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
                  {formatearMoneda(resumenPagos.montoTotal)}
                </p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 flex flex-col justify-center items-center text-center">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="font-bold text-zinc-500 text-xs uppercase tracking-wider">Total Abonado</h3>
                </div>
                <p className="text-3xl font-bold text-green-600" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
                  {formatearMoneda(resumenPagos.totalAbonado)}
                </p>
                <p className="text-xs font-semibold text-zinc-400 mt-1 uppercase tracking-wide">
                  {calcularPorcentajePagado()}% del total
                </p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 flex flex-col justify-center items-center text-center">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-zinc-500 text-xs uppercase tracking-wider">Saldo Pendiente</h3>
                </div>
                <p className="text-3xl font-bold text-orange-500" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
                  {formatearMoneda(resumenPagos.totalPendiente)}
                </p>
              </div>
            </div>

            {/* Barra de Progreso */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-orange-500 mb-4 text-xs uppercase tracking-widest">Progreso de Pagos</h3>
              <div className="w-full bg-zinc-100 rounded-full h-4 overflow-hidden border border-zinc-200">
                <div
                  className="bg-green-500 h-full flex items-center justify-center text-white text-[10px] font-bold transition-all duration-1000 ease-out"
                  style={{ width: `${calcularPorcentajePagado()}%` }}
                >
                  {calcularPorcentajePagado() > 5 ? `${calcularPorcentajePagado()}%` : ''}
                </div>
              </div>
            </div>

            {/* Próximo Pago Destacado */}
            {resumenPagos.proximoPago && (
              <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200">
                    <CalendarIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-orange-600" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>Próximo Pago Programado</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-2">
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Concepto</p>
                    <p className="text-lg font-bold text-zinc-800">{resumenPagos.proximoPago.concepto}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Monto</p>
                    <p className="text-xl font-bold text-orange-600" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
                      {formatearMoneda(resumenPagos.proximoPago.monto)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Estado / Fecha</p>
                    <p className="text-sm font-bold text-zinc-800">
                      {formatearFecha(resumenPagos.proximoPago.fecha_estimada)}
                    </p>
                    <p className={`text-xs font-bold mt-1 ${diasHastaFecha(resumenPagos.proximoPago.fecha_estimada) < 0 ? 'text-red-600' : 'text-orange-500'}`}>
                      {diasHastaFecha(resumenPagos.proximoPago.fecha_estimada) > 0 
                        ? `Vence en ${diasHastaFecha(resumenPagos.proximoPago.fecha_estimada)} días`
                        : diasHastaFecha(resumenPagos.proximoPago.fecha_estimada) === 0
                        ? 'Vence hoy'
                        : `Vencido hace ${Math.abs(diasHastaFecha(resumenPagos.proximoPago.fecha_estimada))} días`}
                    </p>
                  </div>
                </div>

                {resumenPagos.proximoPago.notas && (
                  <div className="mt-5 p-4 bg-white/60 border border-orange-200/50 rounded-lg backdrop-blur-sm">
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Nota adicional</p>
                    <p className="text-sm text-zinc-700 italic">{resumenPagos.proximoPago.notas}</p>
                  </div>
                )}
              </div>
            )}

            {/* Plan de Pagos Completo */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-200 bg-zinc-50">
                <h3 className="text-xl font-bold text-[#0a0a0a]" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>Historial y Plan Completo</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Concepto
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        %
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-zinc-100">
                    {planPagos.map((pago) => (
                      <tr key={pago.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(pago.status)}
                            <span className="font-bold text-zinc-400">{pago.payment_number}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-zinc-800">{pago.concepto}</div>
                          {pago.notas && (
                            <div className="text-xs text-zinc-500 mt-1 italic">{pago.notas}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-orange-500">
                            {formatearMoneda(pago.monto)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-zinc-600 bg-zinc-100 px-2 py-1 rounded inline-block">{pago.porcentaje}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-zinc-800">
                            {formatearFecha(pago.fecha_estimada)}
                          </div>
                          {pago.status === 'pendiente' && diasHastaFecha(pago.fecha_estimada) <= 7 && diasHastaFecha(pago.fecha_estimada) > 0 && (
                            <div className="text-xs font-bold text-orange-500 mt-1">
                              En {diasHastaFecha(pago.fecha_estimada)} días
                            </div>
                          )}
                          {pago.status === 'pendiente' && diasHastaFecha(pago.fecha_estimada) < 0 && (
                            <div className="text-xs font-bold text-red-500 mt-1">
                              Vencido
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-[10px] font-bold uppercase tracking-wider rounded-full ${getStatusColor(pago.status)}`}>
                            {pago.status === 'pagado' ? 'Pagado' : pago.status === 'pendiente' ? 'Pendiente' : 'Vencido'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Foto Ampliada */}
      {fotoAmpliada && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setFotoAmpliada(null)}>
          <div className="relative max-w-6xl w-full bg-white rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors">
              <button
                onClick={() => setFotoAmpliada(null)}
                className="w-10 h-10 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>
            <img
              src={fotoAmpliada.url_foto}
              alt={fotoAmpliada.descripcion}
              className="w-full max-h-[80vh] object-contain bg-zinc-100"
            />
            <div className="bg-white p-6 border-t border-zinc-200">
              <p className="text-zinc-800 font-bold text-lg mb-1">{fotoAmpliada.descripcion}</p>
              <p className="text-zinc-500 text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {formatearFecha(fotoAmpliada.fecha_hora)} - {formatearHora(fotoAmpliada.fecha_hora)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
