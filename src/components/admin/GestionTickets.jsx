import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, CheckCircle, Clock, XCircle, MessageSquare, Send, User, Building2, Image as ImageIcon, Eye, X, Camera } from 'lucide-react';

export default function GestionTickets({ usuario }) {
  const [tickets, setTickets] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todos'); // todos, pendiente, en_proceso, resuelto
  const [filtroPrioridad, setFiltroPrioridad] = useState('todos'); // todos, BAJA, MEDIA, ALTA, URGENTE
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [respuestaFotoFile, setRespuestaFotoFile] = useState(null);
  const [respuestaFotoUrlPreview, setRespuestaFotoUrlPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

  useEffect(() => {
    cargarTickets();
    
    // Suscripción a cambios en tiempo real
    const subscription = supabase
      .channel('tickets-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tickets' },
        () => {
          console.log('Cambio detectado en tickets, recargando...');
          cargarTickets();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [usuario]);

  const cargarTickets = async () => {
    try {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          maestro_id (id, nombre),
          cliente_id (id, nombre, email),
          obra_id (id, nombre_obra),
          foto_id (id, url_foto, descripcion)
        `)
        .order('fecha_creacion', { ascending: false });

      // Si es maestro, solo ver sus tickets
      if (usuario.rol === 'maestro') {
        query = query.eq('maestro_id', usuario.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('Tickets cargados:', data);
      setTickets(data || []);
    } catch (error) {
      console.error('Error al cargar tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (ticketId, nuevoEstado) => {
    try {
      const actualizacion = {
        estado: nuevoEstado,
        fecha_actualizacion: new Date().toISOString()
      };

      // Si se resuelve, agregar fecha de resolución
      if (nuevoEstado === 'resuelto') {
        actualizacion.fecha_resolucion = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tickets')
        .update(actualizacion)
        .eq('id', ticketId);

      if (error) throw error;

      await cargarTickets();
      if (ticketSeleccionado?.id === ticketId) {
        const ticketActualizado = tickets.find(t => t.id === ticketId);
        setTicketSeleccionado({ ...ticketActualizado, ...actualizacion });
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al actualizar el estado del ticket');
    }
  };

  const handleResponseFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRespuestaFotoFile(file);
      setRespuestaFotoUrlPreview(URL.createObjectURL(file));
    } else {
      setRespuestaFotoFile(null);
      setRespuestaFotoUrlPreview(null);
    }
  };

  const agregarRespuesta = async (ticketId) => {
    if (!respuesta.trim() && !respuestaFotoFile) {
      alert('Debe escribir una respuesta o adjuntar una foto de respaldo.');
      return;
    }

    setEnviandoRespuesta(true);

    let publicUrl = null;
    if (respuestaFotoFile) {
      const fileName = `tickets_respuestas/${usuario.id}_${Date.now()}_${respuestaFotoFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos-avance')
        .upload(fileName, respuestaFotoFile);

      if (uploadError) {
        console.error('Error subiendo foto de respuesta:', uploadError);
        alert('Error al subir la foto de respuesta');
        setEnviandoRespuesta(false);
        return;
      }

      const { data: { publicUrl: newPublicUrl } } = supabase.storage
        .from('fotos-avance')
        .getPublicUrl(fileName);
      publicUrl = newPublicUrl;
    }

    try {
      const updateData = {
        respuesta_maestro: respuesta.trim() || null,
        foto_respuesta: publicUrl,
        fecha_actualizacion: new Date().toISOString()
      };

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      setRespuesta('');
      setRespuestaFotoFile(null);
      setRespuestaFotoUrlPreview(null);
      
      await cargarTickets();
      
      // Actualizar ticket seleccionado
      if (ticketSeleccionado?.id === ticketId) {
        setTicketSeleccionado({
          ...ticketSeleccionado,
          ...updateData
        });
      }
      
      alert('Respuesta enviada con éxito.');
    } catch (error) {
      console.error('Error al agregar respuesta:', error);
      alert('Error al guardar la respuesta');
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case 'URGENTE':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'ALTA':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIA':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'BAJA':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      default:
        return 'bg-zinc-800 text-white border-zinc-700';
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'resuelto':
        return 'bg-green-100 text-green-800';
      case 'en_proceso':
        return 'bg-orange-500/20 text-orange-400';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-zinc-800 text-white';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'resuelto':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'en_proceso':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'pendiente':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'rechazado':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-zinc-300" />;
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const ticketsFiltrados = tickets.filter(ticket => {
    const cumpleEstado = filtroEstado === 'todos' || ticket.estado === filtroEstado;
    const cumplePrioridad = filtroPrioridad === 'todos' || ticket.prioridad === filtroPrioridad;
    return cumpleEstado && cumplePrioridad;
  });

  const contadores = {
    pendientes: tickets.filter(t => t.estado === 'pendiente').length,
    en_proceso: tickets.filter(t => t.estado === 'en_proceso').length,
    resueltos: tickets.filter(t => t.estado === 'resuelto').length,
    alta_prioridad: tickets.filter(t => (t.prioridad === 'ALTA' || t.prioridad === 'URGENTE') && t.estado !== 'resuelto').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header y Estadísticas */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">
          {usuario.rol === 'maestro' ? 'Mis Tickets' : 'Gestión de Tickets'}
        </h2>

        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 font-medium">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-900">{contadores.pendientes}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-400 font-medium">En Proceso</p>
                <p className="text-3xl font-bold text-orange-500">{contadores.en_proceso}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Resueltos</p>
                <p className="text-3xl font-bold text-green-900">{contadores.resueltos}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">Alta Prioridad</p>
                <p className="text-3xl font-bold text-red-900">{contadores.alta_prioridad}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-zinc-900 rounded-lg shadow p-4 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-2">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En Proceso</option>
              <option value="resuelto">Resuelto</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-2">Prioridad</label>
            <select
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value)}
              className="px-4 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="todos">Todas</option>
              <option value="URGENTE">Urgente</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Tickets */}
      {ticketsFiltrados.length === 0 ? (
        <div className="bg-zinc-900 rounded-lg shadow p-12 text-center">
          <CheckCircle className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No hay tickets con los filtros seleccionados
          </h3>
          <p className="text-zinc-300">
            Todos los tickets están gestionados correctamente
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ticketsFiltrados.map((ticket) => (
            <div
              key={ticket.id}
              className={`bg-zinc-900 rounded-lg shadow-lg border-2 ${
                ticket.prioridad === 'URGENTE' || ticket.prioridad === 'ALTA'
                  ? 'border-red-300'
                  : 'border-zinc-800'
              } overflow-hidden hover:shadow-xl transition-shadow cursor-pointer`}
              onClick={() => setTicketSeleccionado(ticket)}
            >
              {/* Header del Ticket */}
              <div className={`p-4 ${getPrioridadColor(ticket.prioridad)} border-b-2`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-bold text-sm">PRIORIDAD {ticket.prioridad}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(ticket.estado)}`}>
                    {ticket.estado === 'pendiente' ? 'Pendiente' :
                     ticket.estado === 'en_proceso' ? 'En Proceso' :
                     ticket.estado === 'resuelto' ? 'Resuelto' : 'Rechazado'}
                  </span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4 space-y-3">
                {/* Obra y Cliente */}
                <div className="flex items-start gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-zinc-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">{ticket.obra_id?.nombre_obra}</p>
                    <p className="text-zinc-300">Cliente: {ticket.cliente_id?.nombre}</p>
                  </div>
                </div>

                {/* Maestro Asignado */}
                {usuario.rol !== 'maestro' && (
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <User className="w-4 h-4" />
                    <span>Asignado a: <span className="font-semibold">{ticket.maestro_id?.nombre}</span></span>
                  </div>
                )}

                {/* Observación */}
                <div className="bg-black rounded-lg p-3">
                  <p className="text-sm font-medium text-zinc-200 mb-1">Observación del Cliente:</p>
                  <p className="text-sm text-white">{ticket.observacion}</p>
                </div>

                {/* Foto Asociada */}
                {ticket.foto_id && (
                  <div className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-400">
                    <ImageIcon className="w-4 h-4" />
                    <span>Ver foto asociada</span>
                  </div>
                )}

                {/* Respuesta del Maestro */}
                {(ticket.respuesta_maestro || ticket.foto_respuesta) && (
                  <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/30 mt-3">
                    <p className="text-sm font-medium text-orange-400 mb-1">Respuesta del Maestro:</p>
                    {ticket.respuesta_maestro && (
                      <p className="text-sm text-white">{ticket.respuesta_maestro}</p>
                    )}
                    {ticket.foto_respuesta && (
                      <a href={ticket.foto_respuesta} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-400 mt-2">
                        <ImageIcon className="w-4 h-4" />
                        Ver foto de respuesta
                      </a>
                    )}
                  </div>
                )}

                {/* Fechas */}
                <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t">
                  <span>Creado: {formatearFecha(ticket.fecha_creacion)}</span>
                  {ticket.fecha_resolucion && (
                    <span className="text-green-600 font-semibold">
                      Resuelto: {formatearFecha(ticket.fecha_resolucion)}
                    </span>
                  )}
                </div>

                {/* Acciones Rápidas (solo para maestro) */}
                {usuario.rol === 'maestro' && ticket.estado === 'pendiente' && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cambiarEstado(ticket.id, 'en_proceso');
                      }}
                      className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
                    >
                      Tomar Ticket
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalle del Ticket */}
      {ticketSeleccionado && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setTicketSeleccionado(null)}
        >
          <div
            className="bg-zinc-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`p-6 ${getPrioridadColor(ticketSeleccionado.prioridad)} border-b-2`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getEstadoIcon(ticketSeleccionado.estado)}
                  <div>
                    <h3 className="text-xl font-bold">Ticket de Prioridad {ticketSeleccionado.prioridad}</h3>
                    <p className="text-sm opacity-80">{formatearFecha(ticketSeleccionado.fecha_creacion)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setTicketSeleccionado(null)}
                  className="text-2xl font-bold hover:opacity-70"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">Obra</p>
                  <p className="font-semibold text-white">{ticketSeleccionado.obra_id?.nombre_obra}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">Cliente</p>
                  <p className="font-semibold text-white">{ticketSeleccionado.cliente_id?.nombre}</p>
                  <p className="text-sm text-zinc-300">{ticketSeleccionado.cliente_id?.email}</p>
                </div>
                {usuario.rol !== 'maestro' && (
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-400">Maestro Asignado</p>
                    <p className="font-semibold text-white">{ticketSeleccionado.maestro_id?.nombre}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">Estado</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getEstadoColor(ticketSeleccionado.estado)}`}>
                    {ticketSeleccionado.estado === 'pendiente' ? 'Pendiente' :
                     ticketSeleccionado.estado === 'en_proceso' ? 'En Proceso' :
                     ticketSeleccionado.estado === 'resuelto' ? 'Resuelto' : 'Rechazado'}
                  </span>
                </div>
              </div>

              {/* Foto Asociada */}
              {ticketSeleccionado.foto_id && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-200">Foto Asociada:</p>
                  <div className="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden">
                    <img
                      src={ticketSeleccionado.foto_id.url_foto}
                      alt={ticketSeleccionado.foto_id.descripcion}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {ticketSeleccionado.foto_id.descripcion && (
                    <p className="text-sm text-zinc-300">{ticketSeleccionado.foto_id.descripcion}</p>
                  )}
                </div>
              )}

              {/* Observación */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm font-medium text-orange-900 mb-2">Observación del Cliente:</p>
                <p className="text-white">{ticketSeleccionado.observacion}</p>
              </div>

              {/* Respuesta del Maestro */}
              {(ticketSeleccionado.respuesta_maestro || ticketSeleccionado.foto_respuesta) ? (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                  <p className="text-sm font-medium text-orange-500 mb-2">Respuesta del Maestro:</p>
                  {ticketSeleccionado.respuesta_maestro && (
                    <p className="text-white mb-3">{ticketSeleccionado.respuesta_maestro}</p>
                  )}
                  {ticketSeleccionado.foto_respuesta && (
                    <div className="mt-3">
                      <a href={ticketSeleccionado.foto_respuesta} target="_blank" rel="noopener noreferrer" className="block w-64 h-auto max-h-64 overflow-hidden rounded-lg hover:opacity-80 transition-opacity">
                        <img src={ticketSeleccionado.foto_respuesta} alt="Foto de respuesta del maestro" className="w-full h-full object-cover" />
                      </a>
                      <p className="text-xs text-orange-400 mt-1">Click para ver la foto de respaldo en tamaño completo</p>
                    </div>
                  )}
                </div>
              ) : usuario.rol === 'maestro' && ticketSeleccionado.estado !== 'resuelto' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-zinc-200">
                    Agregar respuesta y foto de respaldo:
                  </label>
                  <textarea
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    placeholder="Explica cómo vas a resolver esta observación..."
                    className="w-full px-4 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={3}
                  />
                  
                  {/* Input y Previsualización para foto de respuesta */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-200">
                      Adjuntar foto de respaldo (opcional):
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-zinc-700 rounded-lg hover:border-zinc-600 transition-colors">
                          <Camera className="w-5 h-5 text-zinc-300" />
                          <span className="text-sm text-zinc-300">
                            {respuestaFotoFile ? respuestaFotoFile.name : 'Seleccionar foto'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleResponseFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {respuestaFotoUrlPreview && (
                      <div className="mt-2 w-32 h-32 relative">
                        <img src={respuestaFotoUrlPreview} alt="Previsualización" className="object-cover w-full h-full rounded-lg border border-zinc-800" />
                        <button
                          type="button"
                          onClick={() => { setRespuestaFotoFile(null); setRespuestaFotoUrlPreview(null); }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                          title="Quitar foto"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => agregarRespuesta(ticketSeleccionado.id)}
                    disabled={(!respuesta.trim() && !respuestaFotoFile) || enviandoRespuesta}
                    className="w-full px-6 py-2 bg-zinc-100 text-white rounded-lg hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enviandoRespuesta ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Enviar Respuesta
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Acciones */}
              {ticketSeleccionado.estado !== 'resuelto' && (
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  {ticketSeleccionado.estado === 'pendiente' && (
                    <button
                      onClick={() => cambiarEstado(ticketSeleccionado.id, 'en_proceso')}
                      className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      Marcar como En Proceso
                    </button>
                  )}
                  {ticketSeleccionado.estado === 'en_proceso' && (
                    <button
                      onClick={() => cambiarEstado(ticketSeleccionado.id, 'resuelto')}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Marcar como Resuelto
                    </button>
                  )}
                  {usuario.rol === 'admin' && (
                    <button
                      onClick={() => cambiarEstado(ticketSeleccionado.id, 'rechazado')}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Rechazar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
