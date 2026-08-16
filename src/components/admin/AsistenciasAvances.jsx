import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Clock, MapPin, Camera, Calendar, User, ExternalLink, Filter } from 'lucide-react';

export default function AsistenciasAvances() {
  const [asistenciasConsolidadas, setAsistenciasConsolidadas] = useState([]);
  const [fotosAvance, setFotosAvance] = useState([]);
  const [maestros, setMaestros] = useState([]);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroMaestro, setFiltroMaestro] = useState('');
  const [filtroObra, setFiltroObra] = useState('');
  const [vistaActual, setVistaActual] = useState('asistencias'); // 'asistencias' o 'fotos'

  useEffect(() => {
    cargarDatos();
    
    // ✅ Suscripción en tiempo real
    const channelAsistencias = supabase
      .channel('asistencias-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asistencias' }, () => {
        console.log('🔄 Cambio detectado en asistencias');
        cargarDatos();
      })
      .subscribe();

    const channelFotos = supabase
      .channel('fotos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fotos_avance' }, () => {
        console.log('🔄 Cambio detectado en fotos');
        cargarDatos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelAsistencias);
      supabase.removeChannel(channelFotos);
    };
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    
    try {
      // ✅ Cargar asistencias con JOINs correctos
      const { data: asistenciasData, error: errorAsist } = await supabase
        .from('asistencias')
        .select(`
          *,
          maestro:maestro_id (
            id,
            nombre
          ),
          tarea:tarea_id (
            id_obra,
            obra:id_obra (
              id,
              nombre_obra
            )
          )
        `)
        .order('fecha_hora', { ascending: false });

      console.log('📊 ADMIN - Asistencias cargadas:', asistenciasData);

      if (errorAsist) {
        console.error('❌ Error cargando asistencias:', errorAsist);
      }

      // ✅ Consolidar asistencias por maestro y día
      const consolidadas = consolidarAsistencias(asistenciasData || []);
      console.log('📊 ADMIN - Asistencias consolidadas:', consolidadas);
      setAsistenciasConsolidadas(consolidadas);
      
      // ✅ Cargar fotos con JOINs correctos
      const { data: fotosData, error: errorFotos } = await supabase
        .from('fotos_avance')
        .select(`
          *,
          maestro:maestro_id (
            id,
            nombre
          ),
          tarea:tarea_id (
            id_obra,
            obra:id_obra (
              id,
              nombre_obra
            )
          )
        `)
        .order('fecha_hora', { ascending: false });

      console.log('📸 ADMIN - Fotos cargadas:', fotosData);

      if (errorFotos) {
        console.error('❌ Error cargando fotos:', errorFotos);
      }

      setFotosAvance(fotosData || []);
      
      // Cargar maestros
      const { data: maestrosData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rol', 'maestro');
      
      // Cargar obras
      const { data: obrasData } = await supabase
        .from('obras')
        .select('*');
      
      setMaestros(maestrosData || []);
      setObras(obrasData || []);
    } catch (error) {
      console.error('❌ Error general cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Consolidar entradas y salidas por maestro y día
  const consolidarAsistencias = (asistencias) => {
    const mapa = {};

    asistencias.forEach(asist => {
      const fecha = asist.fecha_hora.split('T')[0];
      const maestroId = asist.maestro_id;
      const key = `${maestroId}_${fecha}`;

      if (!mapa[key]) {
        mapa[key] = {
          fecha,
          maestro_id: maestroId,
          maestro_nombre: asist.maestro?.nombre || 'Desconocido',
          obra_id: asist.tarea?.id_obra || null,
          obra_nombre: asist.tarea?.obra?.nombre_obra || 'Sin obra',
          entrada: null,
          salida: null
        };
      }

      if (asist.tipo === 'entrada') {
        mapa[key].entrada = {
          hora: new Date(asist.fecha_hora).toLocaleTimeString('es-ES'),
          latitud: asist.latitud,
          longitud: asist.longitud
        };
      } else if (asist.tipo === 'salida') {
        mapa[key].salida = {
          hora: new Date(asist.fecha_hora).toLocaleTimeString('es-ES'),
          latitud: asist.latitud,
          longitud: asist.longitud
        };
      }
    });

    return Object.values(mapa).sort((a, b) => b.fecha.localeCompare(a.fecha));
  };

  const asistenciasFiltradas = asistenciasConsolidadas.filter(a => {
    if (filtroFecha && a.fecha !== filtroFecha) return false;
    if (filtroMaestro && a.maestro_id !== parseInt(filtroMaestro)) return false;
    if (filtroObra && a.obra_id !== parseInt(filtroObra)) return false;
    return true;
  });

  const fotosFiltradas = fotosAvance.filter(f => {
    const fecha = f.fecha_hora?.split('T')[0];
    if (filtroFecha && fecha !== filtroFecha) return false;
    if (filtroMaestro && f.maestro_id !== parseInt(filtroMaestro)) return false;
    if (filtroObra && f.tarea?.id_obra !== parseInt(filtroObra)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Asistencias y Avances</h2>
        <p className="text-zinc-300 mt-1">Registro completo de entrada/salida GPS y fotos de avance</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setVistaActual('asistencias')}
          className={`px-4 py-2 font-medium transition-colors ${
            vistaActual === 'asistencias'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Asistencias ({asistenciasFiltradas.length})
          </div>
        </button>
        <button
          onClick={() => setVistaActual('fotos')}
          className={`px-4 py-2 font-medium transition-colors ${
            vistaActual === 'fotos'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Fotos de Avance ({fotosFiltradas.length})
          </div>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-zinc-300" />
          <span className="font-medium text-zinc-200">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha
            </label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Maestro
            </label>
            <select
              value={filtroMaestro}
              onChange={(e) => setFiltroMaestro(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Todos los maestros</option>
              {maestros.map(m => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-1">
              Obra
            </label>
            <select
              value={filtroObra}
              onChange={(e) => setFiltroObra(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Todas las obras</option>
              {obras.map(o => (
                <option key={o.id} value={o.id}>{o.nombre_obra}</option>
              ))}
            </select>
          </div>
        </div>
        {(filtroFecha || filtroMaestro || filtroObra) && (
          <button
            onClick={() => {
              setFiltroFecha('');
              setFiltroMaestro('');
              setFiltroObra('');
            }}
            className="mt-3 text-sm text-orange-500 hover:text-orange-400 font-medium"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Vista Asistencias */}
      {vistaActual === 'asistencias' && (
        <div className="space-y-4">
          {asistenciasFiltradas.length === 0 ? (
            <div className="text-center py-12 bg-black rounded-lg">
              <Clock className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
              <p className="text-zinc-300">No hay asistencias registradas con estos filtros</p>
            </div>
          ) : (
            asistenciasFiltradas.map((asistencia, idx) => (
              <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-white">
                      {asistencia.maestro_nombre}
                    </h3>
                    <p className="text-sm text-zinc-300 mt-1">
                      📍 {asistencia.obra_nombre}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-zinc-200">{asistencia.fecha}</div>
                  </div>
                </div>

                <fieldset className="border border-zinc-800 rounded-lg p-4">
                  <legend className="text-sm font-semibold text-zinc-300 px-2">Registro de asistencia</legend>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Entrada */}
                    {asistencia.entrada && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-semibold text-green-800">Entrada</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-700 mb-2">
                          <Clock className="w-4 h-4" />
                          <span className="font-mono text-lg">{asistencia.entrada.hora}</span>
                        </div>
                        {asistencia.entrada.latitud && asistencia.entrada.longitud && (
                          <a
                            href={`https://www.google.com/maps?q=${asistencia.entrada.latitud},${asistencia.entrada.longitud}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-green-700 hover:text-green-900 font-medium"
                          >
                            <MapPin className="w-4 h-4" />
                            Ver ubicación en mapa
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Salida */}
                    {asistencia.salida && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="font-semibold text-red-800">Salida</span>
                        </div>
                        <div className="flex items-center gap-2 text-red-700 mb-2">
                          <Clock className="w-4 h-4" />
                          <span className="font-mono text-lg">{asistencia.salida.hora}</span>
                        </div>
                        {asistencia.salida.latitud && asistencia.salida.longitud && (
                          <a
                            href={`https://www.google.com/maps?q=${asistencia.salida.latitud},${asistencia.salida.longitud}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-red-700 hover:text-red-900 font-medium"
                          >
                            <MapPin className="w-4 h-4" />
                            Ver ubicación en mapa
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </fieldset>

                {/* Si solo tiene entrada, mostrar advertencia */}
                {asistencia.entrada && !asistencia.salida && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    ⚠️ El maestro aún no ha marcado la salida
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Vista Fotos */}
      {vistaActual === 'fotos' && (
        <div className="space-y-4">
          {fotosFiltradas.length === 0 ? (
            <div className="text-center py-12 bg-black rounded-lg">
              <Camera className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
              <p className="text-zinc-300">No hay fotos de avance con estos filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fotosFiltradas.map((foto) => (
                <div key={foto.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-zinc-800 relative">
                    <img
                      src={foto.url_foto}
                      alt="Avance de obra"
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(foto.url_foto, '_blank')}
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-white mb-2">
                      {foto.maestro?.nombre || 'Maestro desconocido'}
                    </h4>
                    <p className="text-sm text-orange-500 font-medium mb-2">
                      📍 {foto.tarea?.obra?.nombre_obra || 'Sin obra'}
                    </p>
                    {foto.descripcion && (
                      <p className="text-sm text-zinc-200 mb-3 bg-black p-2 rounded">
                        {foto.descripcion}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-zinc-400 border-t pt-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {foto.fecha_hora?.split('T')[0]} {new Date(foto.fecha_hora).toLocaleTimeString('es-ES')}
                      </span>
                    </div>
                    {foto.latitud && foto.longitud && (
                      <a
                        href={`https://www.google.com/maps?q=${foto.latitud},${foto.longitud}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center justify-center gap-2 text-sm text-orange-500 hover:text-orange-400 font-medium bg-orange-500/10 py-2 rounded-lg"
                      >
                        <MapPin className="w-4 h-4" />
                        Ver ubicación GPS
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
