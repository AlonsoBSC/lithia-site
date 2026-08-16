import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Download, Calendar, Users, Camera, MessageSquare, DollarSign, TrendingUp, Clock, MapPin, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Reportes() {
  const [tipoReporte, setTipoReporte] = useState('asistencias');
  const [obras, setObras] = useState([]);
  const [maestros, setMaestros] = useState([]);
  const [clientes, setClientes] = useState([]);
  
  // Filtros
  const [obraSeleccionada, setObraSeleccionada] = useState('');
  const [maestroSeleccionado, setMaestroSeleccionado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // Datos
  const [datosReporte, setDatosReporte] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    const { data: obrasData } = await supabase.from('obras').select('id, nombre_obra').order('nombre_obra');
    const { data: maestrosData } = await supabase.from('usuarios').select('*').eq('rol', 'maestro').order('nombre');
    const { data: clientesData } = await supabase.from('usuarios').select('*').eq('rol', 'cliente').order('nombre');
    
    setObras(obrasData || []);
    setMaestros(maestrosData || []);
    setClientes(clientesData || []);
  };

  const generarReporte = async () => {
    setCargando(true);
    try {
      switch(tipoReporte) {
        case 'asistencias':
          await generarReporteAsistencias();
          break;
        case 'avances':
          await generarReporteAvances();
          break;
        case 'tickets':
          await generarReporteTickets();
          break;
        case 'pagos':
          await generarReportePagos();
          break;
        case 'resumen':
          await generarReporteResumen();
          break;
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('Error al generar reporte');
    }
    setCargando(false);
  };

  const generarReporteAsistencias = async () => {
    console.log('Iniciando generación de reporte de asistencias...', { maestroSeleccionado, fechaInicio, fechaFin });
    let query = supabase
      .from('asistencias')
      .select(`
        *,
        maestro:usuarios!asistencias_maestro_id_fkey(nombre, email),
        tarea:tareas_diarias(
          id,
          obra:obras(nombre_obra, direccion)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10000);

    if (maestroSeleccionado) query = query.eq('maestro_id', maestroSeleccionado);
    if (fechaInicio) query = query.gte('created_at', fechaInicio);
    if (fechaFin) query = query.lte('created_at', fechaFin + 'T23:59:59');

    const { data, error } = await query;
    
    if (error) {
      console.error('Error en Supabase (asistencias):', error);
      setRegistros([]);
      setDatosReporte({ tipo: 'asistencias', totales: { registros: 0 } });
      return;
    }

    const reportData = data || [];
    console.log('Reporte asistencias obtenido, cantidad:', reportData.length);
    setRegistros(reportData);
    setDatosReporte({
      tipo: 'asistencias',
      totales: {
        registros: reportData.length
      }
    });
  };

  const generarReporteAvances = async () => {
    console.log('Iniciando generación de reporte de avances...', { obraSeleccionada, maestroSeleccionado, fechaInicio, fechaFin });
    let query = supabase
      .from('fotos_avance')
      .select(`
        *,
        maestro:usuarios!fotos_avance_maestro_id_fkey(nombre),
        tarea:tareas_diarias!inner(
          id_obra,
          obra:obras(nombre_obra)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10000);

    if (obraSeleccionada) query = query.eq('tarea.id_obra', obraSeleccionada);
    if (maestroSeleccionado) query = query.eq('maestro_id', maestroSeleccionado);
    if (fechaInicio) query = query.gte('created_at', fechaInicio);
    if (fechaFin) query = query.lte('created_at', fechaFin + 'T23:59:59');

    const { data, error } = await query;
    
    if (error) {
      console.error('Error en Supabase (avances):', error);
      setRegistros([]);
      setDatosReporte({ tipo: 'avances', totales: { totalFotos: 0, conComentarios: 0 } });
      return;
    }

    const reportData = data || [];

    setDatosReporte({
      tipo: 'avances',
      datos: reportData.map(foto => ({
        fecha: new Date(foto.created_at).toLocaleDateString('es-CL'),
        hora: new Date(foto.created_at).toLocaleTimeString('es-CL'),
        maestro: foto.maestro?.nombre || 'Sin nombre',
        obra: foto.tarea?.obra?.nombre_obra || 'Sin obra',
        descripcion: foto.descripcion || 'Sin descripción',
        url: foto.url,
        gps: foto.gps_latitud && foto.gps_longitud 
          ? `${foto.gps_latitud}, ${foto.gps_longitud}` 
          : 'No registrado',
        comentarios: foto.comentarios_cliente || 'Sin comentarios'
      })),
      totales: {
        totalFotos: reportData.length,
        conComentarios: reportData.filter(f => f.comentarios_cliente).length
      }
    });
  };

  const generarReporteTickets = async () => {
    console.log('Iniciando generación de reporte de tickets...', { obraSeleccionada, maestroSeleccionado, fechaInicio, fechaFin });
    let query = supabase
      .from('tickets')
      .select(`
        *,
        maestro:usuarios!tickets_maestro_id_fkey(nombre),
        cliente:usuarios!tickets_cliente_id_fkey(nombre),
        obra:obras(nombre_obra),
        foto:fotos_avance(url, descripcion)
      `)
      .order('created_at', { ascending: false })
      .limit(10000);

    if (obraSeleccionada) query = query.eq('obra_id', obraSeleccionada);
    if (maestroSeleccionado) query = query.eq('maestro_id', maestroSeleccionado);
    if (fechaInicio) query = query.gte('created_at', fechaInicio);
    if (fechaFin) query = query.lte('created_at', fechaFin + 'T23:59:59');

    const { data, error } = await query;
    
    if (error) {
      console.error('Error en Supabase (tickets):', error);
      setRegistros([]);
      setDatosReporte({ tipo: 'tickets', totales: { total: 0, pendientes: 0, enProceso: 0, resueltos: 0, altaPrioridad: 0 } });
      return;
    }

    const reportData = data || [];

    setDatosReporte({
      tipo: 'tickets',
      datos: reportData.map(ticket => ({
        fecha: new Date(ticket.created_at).toLocaleDateString('es-CL'),
        obra: ticket.obra?.nombre_obra || 'Sin obra',
        maestro: ticket.maestro?.nombre || 'Sin nombre',
        cliente: ticket.cliente?.nombre || 'Sin nombre',
        observacion: ticket.observacion,
        prioridad: ticket.prioridad,
        estado: ticket.estado,
        respuesta: ticket.respuesta || 'Sin respuesta',
        fechaResolucion: ticket.fecha_resolucion ? new Date(ticket.fecha_resolucion).toLocaleDateString('es-CL') : 'Pendiente'
      })),
      totales: {
        total: reportData.length,
        pendientes: reportData.filter(t => t.estado === 'pendiente').length,
        enProceso: reportData.filter(t => t.estado === 'en_proceso').length,
        resueltos: reportData.filter(t => t.estado === 'resuelto').length,
        altaPrioridad: reportData.filter(t => t.prioridad === 'alta' || t.prioridad === 'urgente').length
      }
    });
  };

  const generarReportePagos = async () => {
    console.log('Iniciando generación de reporte de pagos...', { obraSeleccionada, fechaInicio, fechaFin });
    let query = supabase
      .from('payments')
      .select(`
        *,
        obra:obras(nombre_obra, cliente:id_cliente(nombre)),
        payment_schedule:payment_schedule(concepto)
      `)
      .order('fecha_pago', { ascending: false })
      .limit(10000);

    if (obraSeleccionada) query = query.eq('obra_id', obraSeleccionada);
    if (fechaInicio) query = query.gte('fecha_pago', fechaInicio);
    if (fechaFin) query = query.lte('fecha_pago', fechaFin);

    const { data, error } = await query;
    
    if (error) {
      console.error('Error en Supabase (pagos):', error);
      setRegistros([]);
      setDatosReporte({ tipo: 'pagos', totales: { totalPagos: 0, montoTotal: 0 } });
      return;
    }

    const reportData = data || [];

    setDatosReporte({
      tipo: 'pagos',
      datos: reportData.map(pago => ({
        fecha: new Date(pago.fecha_pago).toLocaleDateString('es-CL'),
        obra: pago.obra?.nombre_obra || 'Sin obra',
        cliente: pago.obra?.cliente?.nombre || 'N/A',
        monto: pago.monto,
        metodoPago: pago.metodo_pago,
        concepto: pago.payment_schedule?.concepto || pago.notas || 'Sin concepto',
        referencia: pago.referencia || 'N/A'
      })),
      totales: {
        totalPagos: reportData.length,
        montoTotal: reportData.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
      }
    });
  };

  const generarReporteResumen = async () => {
    if (!obraSeleccionada) {
      alert('Selecciona una obra para el reporte resumen');
      return;
    }

    const { data: obra } = await supabase
      .from('obras')
      .select(`
        *,
        cliente:id_cliente(nombre, email, telefono)
      `)
      .eq('id', obraSeleccionada)
      .single();

    const { data: tareas } = await supabase
      .from('tareas_diarias')
      .select('*')
      .eq('id_obra', obraSeleccionada)
      .limit(10000);

    const { data: fotos } = await supabase
      .from('fotos_avance')
      .select('*, tarea:tareas_diarias!inner(id_obra)')
      .eq('tarea.id_obra', obraSeleccionada)
      .limit(10000);

    const { data: tickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('obra_id', obraSeleccionada)
      .limit(10000);

    const { data: pagos } = await supabase
      .from('payments')
      .select('monto')
      .eq('obra_id', obraSeleccionada)
      .limit(10000);

    const { data: asistencias } = await supabase
      .from('asistencias')
      .select(`
        *,
        tarea:tareas_diarias!inner(id_obra)
      `)
      .eq('tarea.id_obra', obraSeleccionada)
      .limit(10000);

    setDatosReporte({
      tipo: 'resumen',
      obra: {
        nombre: obra.nombre_obra,
        direccion: obra.direccion,
        cliente: obra.cliente?.nombre || 'Sin cliente',
        fechaInicio: obra.fecha_inicio_plan ? new Date(obra.fecha_inicio_plan).toLocaleDateString('es-CL') : 'No definida',
        fechaFin: obra.fecha_fin_plan ? new Date(obra.fecha_fin_plan).toLocaleDateString('es-CL') : 'No definida',
        presupuesto: obra.monto_contrato || 0,
        estatus: obra.estado
      },
      estadisticas: {
        totalTareas: tareas?.length || 0,
        tareasCompletadas: tareas?.filter(t => t.estado === 'finalizada').length || 0,
        totalFotos: fotos?.length || 0,
        totalTickets: tickets?.length || 0,
        ticketsPendientes: tickets?.filter(t => t.estado === 'pendiente').length || 0,
        totalPagos: pagos?.reduce((sum, p) => sum + parseFloat(p.monto), 0) || 0,
        totalAsistencias: asistencias?.length || 0
      }
    });
  };

  const exportarExcel = () => {
    if (!datosReporte) return;

    if (tipoReporte === 'asistencias') {
      const exportData = registros.map(r => ({
        Maestro: r.maestro?.nombre || 'Sin nombre',
        Obra: r.tarea?.obra?.nombre_obra || 'Sin obra',
        'Tipo de Movimiento': r.tipo || 'N/A',
        'Fecha Hora': r.fecha_hora ? new Date(r.fecha_hora).toLocaleString('es-CL') : 'N/A',
        Latitud: r.latitud || 'N/A',
        Longitud: r.longitud || 'N/A',
        'Dirección': r.tarea?.obra?.direccion || 'N/A'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Asistencias");
      XLSX.writeFile(wb, `reporte_asistencias_${new Date().toISOString().split('T')[0]}.xlsx`);
      return;
    }

    let csv = '';
    let filename = `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.csv`;

    switch(tipoReporte) {
      case 'asistencias':
        csv = 'Maestro,Email,Obra,Tipo,Fecha Hora,Latitud,Longitud,Ubicación\n';
        registros.forEach(r => {
          const fechaFormateada = r.fecha_hora ? new Date(r.fecha_hora).toLocaleString('es-CL') : 'N/A';
          csv += `"${r.maestro?.nombre || 'Sin nombre'}","${r.maestro?.email || 'Sin email'}","${r.tarea?.obra?.nombre_obra || 'Sin obra'}","${r.tipo || 'N/A'}","${fechaFormateada}","${r.latitud || 'N/A'}","${r.longitud || 'N/A'}","${r.ubicacion_texto || 'N/A'}"\n`;
        });
        csv += `\nTotal Registros:,${datosReporte.totales.registros}\n`;
        break;

      case 'avances':
        csv = 'Fecha,Hora,Maestro,Obra,Descripción,GPS,Comentarios\n';
        registros.forEach(r => {
          csv += `"${r.fecha}","${r.hora}","${r.maestro}","${r.obra}","${r.descripcion}","${r.gps}","${r.comentarios}"\n`;
        });
        csv += `\nTotal Fotos:,${datosReporte.totales.totalFotos}\n`;
        csv += `Con Comentarios:,${datosReporte.totales.conComentarios}\n`;
        break;

      case 'tickets':
        csv = 'Fecha,Obra,Maestro,Cliente,Observación,Prioridad,Estado,Respuesta,Fecha Resolución\n';
        registros.forEach(r => {
          csv += `"${r.fecha}","${r.obra}","${r.maestro}","${r.cliente}","${r.observacion}","${r.prioridad}","${r.estado}","${r.respuesta}","${r.fechaResolucion}"\n`;
        });
        csv += `\nTotal:,${datosReporte.totales.total}\n`;
        csv += `Pendientes:,${datosReporte.totales.pendientes}\n`;
        csv += `Resueltos:,${datosReporte.totales.resueltos}\n`;
        break;

      case 'pagos':
        csv = 'Fecha,Obra,Cliente,Monto,Método de Pago,Concepto/Notas,Referencia\n';
        registros.forEach(r => {
          csv += `"${r.fecha}","${r.obra}","${r.cliente}","${r.monto}","${r.metodoPago}","${r.concepto}","${r.referencia}"\n`;
        });
        csv += `\nTotal Pagos:,${datosReporte.totales.totalPagos}\n`;
        csv += `Monto Total:,$${datosReporte.totales.montoTotal.toLocaleString('es-CL')}\n`;
        break;

      case 'resumen':
        csv = 'RESUMEN DE OBRA\n\n';
        csv += `Obra:,${datosReporte.obra.nombre}\n`;
        csv += `Dirección:,${datosReporte.obra.direccion}\n`;
        csv += `Cliente:,${datosReporte.obra.cliente}\n`;
        csv += `Fecha Inicio:,${datosReporte.obra.fechaInicio}\n`;
        csv += `Fecha Fin Estimada:,${datosReporte.obra.fechaFin}\n`;
        csv += `Presupuesto:,$${datosReporte.obra.presupuesto.toLocaleString('es-CL')}\n`;
        csv += `Estado:,${datosReporte.obra.estatus}\n\n`;
        csv += 'ESTADÍSTICAS\n';
        csv += `Total Tareas:,${datosReporte.estadisticas.totalTareas}\n`;
        csv += `Tareas Completadas:,${datosReporte.estadisticas.tareasCompletadas}\n`;
        csv += `Total Fotos:,${datosReporte.estadisticas.totalFotos}\n`;
        csv += `Total Tickets:,${datosReporte.estadisticas.totalTickets}\n`;
        csv += `Tickets Pendientes:,${datosReporte.estadisticas.ticketsPendientes}\n`;
        csv += `Total Pagos Recibidos:,$${datosReporte.estadisticas.totalPagos.toLocaleString('es-CL')}\n`;
        csv += `Total Asistencias:,${datosReporte.estadisticas.totalAsistencias}\n`;
        break;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  console.log("Estado de registros para UI:", registros);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Reportes</h2>
            <p className="text-sm text-zinc-300">Genera reportes detallados y descarga en Excel</p>
          </div>
        </div>
      </div>

      {/* Selector de Tipo de Reporte */}
      <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 p-6">
        <label className="block text-sm font-medium text-white mb-3">Tipo de Reporte</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => setTipoReporte('asistencias')}
            className={`p-4 rounded-lg border-2 transition-all ${
              tipoReporte === 'asistencias'
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <Clock className={`w-6 h-6 mx-auto mb-2 ${tipoReporte === 'asistencias' ? 'text-orange-500' : 'text-white'}`} />
            <p className={`text-sm font-medium ${tipoReporte === 'asistencias' ? 'text-orange-500' : 'text-white'}`}>Asistencias</p>
          </button>

          <button
            onClick={() => setTipoReporte('avances')}
            className={`p-4 rounded-lg border-2 transition-all ${
              tipoReporte === 'avances'
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <Camera className={`w-6 h-6 mx-auto mb-2 ${tipoReporte === 'avances' ? 'text-orange-500' : 'text-white'}`} />
            <p className={`text-sm font-medium ${tipoReporte === 'avances' ? 'text-orange-500' : 'text-white'}`}>Avances</p>
          </button>

          <button
            onClick={() => setTipoReporte('tickets')}
            className={`p-4 rounded-lg border-2 transition-all ${
              tipoReporte === 'tickets'
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <MessageSquare className={`w-6 h-6 mx-auto mb-2 ${tipoReporte === 'tickets' ? 'text-orange-500' : 'text-white'}`} />
            <p className={`text-sm font-medium ${tipoReporte === 'tickets' ? 'text-orange-500' : 'text-white'}`}>Tickets</p>
          </button>

          <button
            onClick={() => setTipoReporte('pagos')}
            className={`p-4 rounded-lg border-2 transition-all ${
              tipoReporte === 'pagos'
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <DollarSign className={`w-6 h-6 mx-auto mb-2 ${tipoReporte === 'pagos' ? 'text-orange-500' : 'text-white'}`} />
            <p className={`text-sm font-medium ${tipoReporte === 'pagos' ? 'text-orange-500' : 'text-white'}`}>Pagos</p>
          </button>

          <button
            onClick={() => setTipoReporte('resumen')}
            className={`p-4 rounded-lg border-2 transition-all ${
              tipoReporte === 'resumen'
                ? 'border-orange-500 bg-orange-500/10'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${tipoReporte === 'resumen' ? 'text-orange-500' : 'text-white'}`} />
            <p className={`text-sm font-medium ${tipoReporte === 'resumen' ? 'text-orange-500' : 'text-white'}`}>Resumen</p>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(tipoReporte === 'avances' || tipoReporte === 'tickets' || tipoReporte === 'pagos' || tipoReporte === 'resumen') && (
            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">Obra</label>
              <select
                value={obraSeleccionada}
                onChange={(e) => setObraSeleccionada(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Todas las obras</option>
                {obras.map(obra => (
                  <option key={obra.id} value={obra.id}>{obra.nombre_obra}</option>
                ))}
              </select>
            </div>
          )}

          {(tipoReporte === 'asistencias' || tipoReporte === 'avances' || tipoReporte === 'tickets') && (
            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">Maestro</label>
              <select
                value={maestroSeleccionado}
                onChange={(e) => setMaestroSeleccionado(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Todos los maestros</option>
                {maestros.map(maestro => (
                  <option key={maestro.id} value={maestro.id}>{maestro.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {tipoReporte !== 'resumen' && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-2">Fecha Inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-2">Fecha Fin</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={generarReporte}
            disabled={cargando}
            className="flex-1 bg-black border-b border-zinc-800 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            {cargando ? 'Generando...' : 'Generar Reporte'}
          </button>

          {datosReporte && (
            <button
              onClick={exportarExcel}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Descargar Excel
            </button>
          )}
        </div>
      </div>

      {/* Resultados */}
      {datosReporte && (
        <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Resultados</h3>

          {/* Reporte de Asistencias */}
          {datosReporte.tipo === 'asistencias' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
                <div className="bg-orange-500/10 rounded-lg p-4">
                  <p className="text-sm text-orange-500 font-medium">Total Registros</p>
                  <p className="text-3xl font-bold text-orange-500">{datosReporte.totales.registros}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Maestro</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Obra</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Fecha y Hora</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Ubicación GPS</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Dirección</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700 text-white">
                    {(!registros || registros.length === 0) ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-zinc-400">
                          No hay registros disponibles para los filtros seleccionados
                        </td>
                      </tr>
                    ) : registros.map((registro, idx) => {
                      console.log("item", registro);
                      const fechaFormateada = registro.fecha_hora ? new Date(registro.fecha_hora).toLocaleString('es-CL') : 'N/A';
                      return (
                      <tr key={idx} className="hover:bg-black">
                        <td className="px-4 py-3 text-sm text-white">{registro.maestro?.nombre || 'Sin nombre'}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{registro.maestro?.email || 'Sin email'}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{registro.tarea?.obra?.nombre_obra || 'Sin obra'}</td>
                        <td className="px-4 py-3 text-sm text-white font-medium">{registro.tipo || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-white font-medium">{fechaFormateada}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-orange-500">
                          {registro.latitud && registro.longitud ? `${registro.latitud}, ${registro.longitud}` : 'Sin GPS'}
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{registro.tarea?.obra?.direccion || 'N/A'}</td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reporte de Avances */}
          {datosReporte.tipo === 'avances' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-500/10 rounded-lg p-4">
                  <p className="text-sm text-green-400 font-medium">Total Fotos</p>
                  <p className="text-3xl font-bold text-white">{datosReporte.totales.totalFotos}</p>
                </div>
                <div className="bg-orange-500/10 rounded-lg p-4">
                  <p className="text-sm text-orange-500 font-medium">Con Comentarios</p>
                  <p className="text-3xl font-bold text-orange-500">{datosReporte.totales.conComentarios}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(!registros || registros.length === 0) ? (
                  <div className="col-span-full py-8 text-center text-zinc-400">
                    No hay fotos disponibles para los filtros seleccionados
                  </div>
                ) : registros.map((foto, idx) => (
                  <div key={idx} className="border border-zinc-800 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <img src={foto.url} alt="Avance" className="w-full h-48 object-cover rounded-lg mb-3" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-white">{foto.obra}</p>
                      <p className="text-xs text-zinc-300">{foto.maestro} • {foto.fecha} {foto.hora}</p>
                      <p className="text-sm text-zinc-200">{foto.descripcion}</p>
                      {foto.comentarios !== 'Sin comentarios' && (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2">
                          <p className="text-xs text-orange-400">{foto.comentarios}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reporte de Tickets */}
          {datosReporte.tipo === 'tickets' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-black rounded-lg p-4">
                  <p className="text-sm text-zinc-300 font-medium">Total</p>
                  <p className="text-3xl font-bold text-white">{datosReporte.totales.total}</p>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-4">
                  <p className="text-sm text-yellow-400 font-medium">Pendientes</p>
                  <p className="text-3xl font-bold text-white">{datosReporte.totales.pendientes}</p>
                </div>
                <div className="bg-orange-500/10 rounded-lg p-4">
                  <p className="text-sm text-orange-500 font-medium">En Proceso</p>
                  <p className="text-3xl font-bold text-orange-500">{datosReporte.totales.enProceso}</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4">
                  <p className="text-sm text-green-400 font-medium">Resueltos</p>
                  <p className="text-3xl font-bold text-white">{datosReporte.totales.resueltos}</p>
                </div>
              </div>

              <div className="space-y-3">
                {(!registros || registros.length === 0) ? (
                  <div className="py-8 text-center text-zinc-400">
                    No hay tickets disponibles para los filtros seleccionados
                  </div>
                ) : registros.map((ticket, idx) => (
                  <div key={idx} className="border border-zinc-800 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            ticket.prioridad === 'alta' || ticket.prioridad === 'urgente'
                              ? 'bg-red-500/20 text-red-400'
                              : ticket.prioridad === 'media'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-zinc-800 text-white'
                          }`}>
                            {ticket.prioridad.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            ticket.estado === 'resuelto'
                              ? 'bg-green-500/20 text-green-400'
                              : ticket.estado === 'en_proceso'
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-zinc-800 text-white'
                          }`}>
                            {ticket.estado.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white mb-1">{ticket.obra}</p>
                        <p className="text-sm text-zinc-200 mb-2">{ticket.observacion}</p>
                        <div className="flex items-center gap-4 text-xs text-zinc-400">
                          <span>👷 {ticket.maestro}</span>
                          <span>👤 {ticket.cliente}</span>
                          <span>📅 {ticket.fecha}</span>
                        </div>
                      </div>
                    </div>
                    {ticket.respuesta !== 'Sin respuesta' && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mt-3">
                        <p className="text-xs font-medium text-orange-400 mb-1">Respuesta del Maestro:</p>
                        <p className="text-sm text-orange-500">{ticket.respuesta}</p>
                        <p className="text-xs text-orange-500 mt-1">Resuelto: {ticket.fechaResolucion}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reporte de Pagos */}
          {datosReporte.tipo === 'pagos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-emerald-500/10 rounded-lg p-4">
                  <p className="text-sm text-emerald-400 font-medium">Total Pagos</p>
                  <p className="text-3xl font-bold text-white">{datosReporte.totales.totalPagos}</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4">
                  <p className="text-sm text-green-400 font-medium">Monto Total</p>
                  <p className="text-3xl font-bold text-white">${datosReporte.totales.montoTotal.toLocaleString('es-CL')}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Obra</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Cliente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Monto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Método</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Concepto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Referencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700 text-white">
                    {(!registros || registros.length === 0) ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-zinc-400">
                          No hay pagos disponibles para los filtros seleccionados
                        </td>
                      </tr>
                    ) : registros.map((pago, idx) => (
                      <tr key={idx} className="hover:bg-black">
                        <td className="px-4 py-3 text-sm text-zinc-300">{pago.fecha}</td>
                        <td className="px-4 py-3 text-sm text-white">{pago.obra}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{pago.cliente}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-400">${parseFloat(pago.monto).toLocaleString('es-CL')}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{pago.metodoPago}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{pago.concepto}</td>
                        <td className="px-4 py-3 text-sm text-zinc-300">{pago.referencia}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reporte Resumen */}
          {datosReporte.tipo === 'resumen' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 border border-orange-500/30">
                <h4 className="text-xl font-bold text-white mb-4">{datosReporte.obra.nombre}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-zinc-300">Cliente</p>
                    <p className="font-medium text-white">{datosReporte.obra.cliente}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300">Dirección</p>
                    <p className="font-medium text-white">{datosReporte.obra.direccion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300">Estado</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      datosReporte.obra.estatus === 'activa'
                        ? 'bg-green-500/20 text-green-400'
                        : datosReporte.obra.estatus === 'completada'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-zinc-800 text-white'
                    }`}>
                      {datosReporte.obra.estatus.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300">Fecha Inicio</p>
                    <p className="font-medium text-white">{datosReporte.obra.fechaInicio}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300">Fecha Fin Estimada</p>
                    <p className="font-medium text-white">{datosReporte.obra.fechaFin}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300">Presupuesto</p>
                    <p className="font-medium text-green-400">${parseFloat(datosReporte.obra.presupuesto).toLocaleString('es-CL')}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-orange-500 font-medium">Tareas</p>
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold text-orange-500">{datosReporte.estadisticas.totalTareas}</p>
                  <p className="text-xs text-orange-500 mt-1">{datosReporte.estadisticas.tareasCompletadas} completadas</p>
                </div>

                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-green-400 font-medium">Fotos</p>
                    <Camera className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{datosReporte.estadisticas.totalFotos}</p>
                  <p className="text-xs text-green-400 mt-1">Fotos de avance</p>
                </div>

                <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-orange-600 font-medium">Tickets</p>
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-white">{datosReporte.estadisticas.totalTickets}</p>
                  <p className="text-xs text-orange-600 mt-1">{datosReporte.estadisticas.ticketsPendientes} pendientes</p>
                </div>

                <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-emerald-400 font-medium">Pagos</p>
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">${datosReporte.estadisticas.totalPagos.toLocaleString('es-CL')}</p>
                  <p className="text-xs text-emerald-400 mt-1">Total recibido</p>
                </div>

                <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-purple-400 font-medium">Asistencias</p>
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{datosReporte.estadisticas.totalAsistencias}</p>
                  <p className="text-xs text-purple-400 mt-1">Registros totales</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
