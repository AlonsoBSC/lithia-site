import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MapPin, Calendar, DollarSign, User, ArrowLeft, Clock, Camera, CheckCircle, XCircle, AlertTriangle, Edit2, Trash2, Plus, Save, X } from 'lucide-react';
import GanttObra from './GanttObra';

export default function DetalleObra({ obra, onVolver }) {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pestanaActiva, setPestanaActiva] = useState('general');
  
  // Estados para pagos
  const [planPagos, setPlanPagos] = useState([]);
  const [pagosRealizados, setPagosRealizados] = useState([]);
  const [loadingPagos, setLoadingPagos] = useState(true);
  const [modalPago, setModalPago] = useState({ abierto: false, tipo: 'crear', pago: null });
  const [modalAbono, setModalAbono] = useState({ abierto: false, pagoId: null });
  const [modalEditarPagoRealizado, setModalEditarPagoRealizado] = useState({ abierto: false, pago: null });
  
  // Form states
  const [formPago, setFormPago] = useState({
    payment_number: '',
    concepto: '',
    monto: '',
    porcentaje: '',
    fecha_estimada: '',
    notas: ''
  });
  
  const [formAbono, setFormAbono] = useState({
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: 'transferencia',
    referencia: '',
    notas: ''
  });

  const [formEditarPagoRealizado, setFormEditarPagoRealizado] = useState({
    monto: '',
    fecha_pago: '',
    metodo_pago: 'transferencia',
    referencia: '',
    notas: ''
  });

  useEffect(() => {
    if (obra?.id) {
      cargarTareas();
      cargarPagos();
    }
  }, [obra?.id]);

  const cargarTareas = async () => {
    try {
      const { data, error } = await supabase
        .from('tareas_diarias')
        .select(`
          *,
          responsable:responsable_trabajador (nombre, email),
          actividad:id_actividad (nombre)
        `)
        .eq('id_obra', obra.id)
        .order('fecha_asignada', { ascending: false });

      if (error) throw error;
      setTareas(data || []);
    } catch (error) {
      console.error('Error cargando tareas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarPagos = async () => {
    try {
      setLoadingPagos(true);
      
      // Cargar plan de pagos
      const { data: planData, error: planError } = await supabase
        .from('payment_schedule')
        .select('*')
        .eq('obra_id', obra.id)
        .order('payment_number', { ascending: true });

      if (planError) throw planError;
      
      // Cargar pagos realizados
      const { data: pagosData, error: pagosError } = await supabase
        .from('payments')
        .select('*')
        .eq('obra_id', obra.id)
        .order('fecha_pago', { ascending: false });

      if (pagosError) throw pagosError;

      setPlanPagos(planData || []);
      setPagosRealizados(pagosData || []);

      // DEBUG DETALLADO: Logs para verificar cálculos
      console.log('=== DEBUG PAGOS DETALLADO ===');
      console.log('Obra:', obra.nombre_obra);
      console.log('Monto Contrato:', obra.monto_contrato);
      console.log('\n--- PAGOS REALIZADOS (tabla payments) ---');
      console.log('Total de registros:', pagosData?.length || 0);
      
      let totalAbonadoReal = 0;
      (pagosData || []).forEach((p, index) => {
        console.log(`Pago ${index + 1}:`, {
          id: p.id,
          payment_schedule_id: p.payment_schedule_id,
          monto: p.monto,
          fecha_pago: p.fecha_pago,
          metodo_pago: p.metodo_pago,
          referencia: p.referencia
        });
        totalAbonadoReal += parseFloat(p.monto || 0);
      });
      console.log('SUMA TOTAL (payments):', totalAbonadoReal);
      
      console.log('\n--- PLAN DE PAGOS (tabla payment_schedule) ---');
      console.log('Total de hitos:', planData?.length || 0);
      
      let totalPlanProgramado = 0;
      let totalPlanPagado = 0;
      (planData || []).forEach((p, index) => {
        console.log(`Hito ${index + 1}:`, {
          id: p.id,
          payment_number: p.payment_number,
          concepto: p.concepto,
          monto: p.monto,
          status: p.status
        });
        totalPlanProgramado += parseFloat(p.monto || 0);
        if (p.status === 'pagado') {
          totalPlanPagado += parseFloat(p.monto || 0);
        }
      });
      console.log('SUMA TOTAL PLAN:', totalPlanProgramado);
      console.log('SUMA SOLO PAGADOS:', totalPlanPagado);
      
      // Verificar si hay duplicados
      const paymentScheduleIds = (pagosData || []).map(p => p.payment_schedule_id).filter(id => id);
      const duplicados = paymentScheduleIds.filter((id, index) => paymentScheduleIds.indexOf(id) !== index);
      if (duplicados.length > 0) {
        console.warn('⚠️ ALERTA: Hay payment_schedule_id DUPLICADOS:', duplicados);
      }
      
      console.log('\n--- ANÁLISIS ---');
      console.log('Diferencia (Real - Plan Pagado):', totalAbonadoReal - totalPlanPagado);
      console.log('Porcentaje Real:', ((totalAbonadoReal / obra.monto_contrato) * 100).toFixed(2) + '%');
      console.log('Porcentaje Esperado:', ((totalPlanPagado / obra.monto_contrato) * 100).toFixed(2) + '%');
      console.log('==================');

    } catch (error) {
      console.error('Error cargando pagos:', error);
      alert('Error al cargar los pagos: ' + error.message);
    } finally {
      setLoadingPagos(false);
    }
  };

  // Calcular totales - ESTO ES LO CORRECTO
  const totalAbonado = pagosRealizados.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
  const totalPlanProgramado = planPagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
  const saldoPendiente = obra.monto_contrato - totalAbonado;
  const porcentajePagado = (totalAbonado / obra.monto_contrato) * 100;

  // Obtener próximos pagos (ordenar por fecha y filtrar pendientes)
  const proximosPagos = planPagos
    .filter(p => p.status === 'pendiente')
    .sort((a, b) => new Date(a.fecha_estimada) - new Date(b.fecha_estimada))
    .slice(0, 3);

  const abrirModalPago = (tipo = 'crear', pago = null) => {
    if (tipo === 'editar' && pago) {
      setFormPago({
        payment_number: pago.payment_number,
        concepto: pago.concepto,
        monto: pago.monto,
        porcentaje: pago.porcentaje || '',
        fecha_estimada: pago.fecha_estimada,
        notas: pago.notas || ''
      });
    } else {
      setFormPago({
        payment_number: planPagos.length + 1,
        concepto: '',
        monto: '',
        porcentaje: '',
        fecha_estimada: '',
        notas: ''
      });
    }
    setModalPago({ abierto: true, tipo, pago });
  };

  const cerrarModalPago = () => {
    setModalPago({ abierto: false, tipo: 'crear', pago: null });
    setFormPago({
      payment_number: '',
      concepto: '',
      monto: '',
      porcentaje: '',
      fecha_estimada: '',
      notas: ''
    });
  };

  const guardarPago = async () => {
    try {
      if (!formPago.concepto || !formPago.monto || !formPago.fecha_estimada) {
        alert('Por favor complete todos los campos requeridos');
        return;
      }

      const pagoData = {
        obra_id: obra.id,
        payment_number: parseInt(formPago.payment_number),
        concepto: formPago.concepto,
        monto: parseFloat(formPago.monto),
        porcentaje: formPago.porcentaje ? parseFloat(formPago.porcentaje) : null,
        fecha_estimada: formPago.fecha_estimada,
        notas: formPago.notas,
        status: 'pendiente'
      };

      if (modalPago.tipo === 'crear') {
        const { error } = await supabase
          .from('payment_schedule')
          .insert([pagoData]);
        
        if (error) throw error;
        alert('Pago agregado al plan correctamente');
      } else {
        const { error } = await supabase
          .from('payment_schedule')
          .update(pagoData)
          .eq('id', modalPago.pago.id);
        
        if (error) throw error;
        alert('Pago actualizado correctamente');
      }

      await cargarPagos();
      cerrarModalPago();
    } catch (error) {
      console.error('Error guardando pago:', error);
      alert('Error al guardar el pago: ' + error.message);
    }
  };

  const eliminarPago = async (pagoId) => {
    if (!confirm('¿Está seguro de eliminar este pago del plan?')) return;
    
    try {
      const { error } = await supabase
        .from('payment_schedule')
        .delete()
        .eq('id', pagoId);

      if (error) throw error;
      
      alert('Pago eliminado correctamente');
      await cargarPagos();
    } catch (error) {
      console.error('Error eliminando pago:', error);
      alert('Error al eliminar: ' + error.message);
    }
  };

  const abrirModalAbono = (pagoId) => {
    setModalAbono({ abierto: true, pagoId });
    setFormAbono({
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo_pago: 'transferencia',
      referencia: '',
      notas: ''
    });
  };

  const cerrarModalAbono = () => {
    setModalAbono({ abierto: false, pagoId: null });
    setFormAbono({
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo_pago: 'transferencia',
      referencia: '',
      notas: ''
    });
  };

  const registrarAbono = async () => {
    try {
      const pagoSchedule = planPagos.find(p => p.id === modalAbono.pagoId);
      if (!pagoSchedule) {
        alert('No se encontró el pago en el plan');
        return;
      }

      // Registrar el pago
      const { error: pagoError } = await supabase
        .from('payments')
        .insert([{
          obra_id: obra.id,
          payment_schedule_id: modalAbono.pagoId,
          monto: parseFloat(pagoSchedule.monto),
          fecha_pago: formAbono.fecha_pago,
          metodo_pago: formAbono.metodo_pago,
          referencia: formAbono.referencia,
          notas: formAbono.notas,
          registrado_por: 'admin'
        }]);

      if (pagoError) throw pagoError;

      // Actualizar el status del plan a 'pagado'
      const { error: updateError } = await supabase
        .from('payment_schedule')
        .update({ status: 'pagado' })
        .eq('id', modalAbono.pagoId);

      if (updateError) throw updateError;

      alert('Pago registrado correctamente');
      await cargarPagos();
      cerrarModalAbono();
    } catch (error) {
      console.error('Error registrando pago:', error);
      alert('Error al registrar el pago: ' + error.message);
    }
  };

  // NUEVAS FUNCIONES PARA EDITAR PAGOS REALIZADOS
  const abrirModalEditarPagoRealizado = (pago) => {
    setFormEditarPagoRealizado({
      monto: pago.monto,
      fecha_pago: pago.fecha_pago,
      metodo_pago: pago.metodo_pago,
      referencia: pago.referencia || '',
      notas: pago.notas || ''
    });
    setModalEditarPagoRealizado({ abierto: true, pago });
  };

  const cerrarModalEditarPagoRealizado = () => {
    setModalEditarPagoRealizado({ abierto: false, pago: null });
    setFormEditarPagoRealizado({
      monto: '',
      fecha_pago: '',
      metodo_pago: 'transferencia',
      referencia: '',
      notas: ''
    });
  };

  const guardarPagoRealizado = async () => {
    try {
      if (!formEditarPagoRealizado.monto || !formEditarPagoRealizado.fecha_pago) {
        alert('Por favor complete todos los campos requeridos');
        return;
      }

      const { error } = await supabase
        .from('payments')
        .update({
          monto: parseFloat(formEditarPagoRealizado.monto),
          fecha_pago: formEditarPagoRealizado.fecha_pago,
          metodo_pago: formEditarPagoRealizado.metodo_pago,
          referencia: formEditarPagoRealizado.referencia,
          notas: formEditarPagoRealizado.notas
        })
        .eq('id', modalEditarPagoRealizado.pago.id);

      if (error) throw error;

      alert('Pago actualizado correctamente');
      await cargarPagos();
      cerrarModalEditarPagoRealizado();
    } catch (error) {
      console.error('Error actualizando pago:', error);
      alert('Error al actualizar: ' + error.message);
    }
  };

  const eliminarPagoRealizado = async (pagoId, paymentScheduleId) => {
    if (!confirm('¿Está seguro de eliminar este pago registrado? Si es parte del plan, el hito volverá a estado pendiente.')) return;
    
    try {
      // Eliminar el pago
      const { error: deleteError } = await supabase
        .from('payments')
        .delete()
        .eq('id', pagoId);

      if (deleteError) throw deleteError;

      // Si estaba vinculado a un plan, actualizar el status a pendiente
      if (paymentScheduleId) {
        const { error: updateError } = await supabase
          .from('payment_schedule')
          .update({ status: 'pendiente' })
          .eq('id', paymentScheduleId);

        if (updateError) throw updateError;
      }

      alert('Pago eliminado correctamente');
      await cargarPagos();
    } catch (error) {
      console.error('Error eliminando pago:', error);
      alert('Error al eliminar: ' + error.message);
    }
  };

  const calcularDiasRestantes = (fechaEstimada) => {
    const hoy = new Date();
    const fecha = new Date(fechaEstimada);
    const diferencia = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
    return diferencia;
  };

  const obtenerColorUrgencia = (status, fechaEstimada) => {
    if (status === 'pagado') return 'bg-green-100 text-green-700';
    
    const diasRestantes = calcularDiasRestantes(fechaEstimada);
    
    if (diasRestantes < 0) return 'bg-red-100 text-red-700'; // Vencido
    if (diasRestantes <= 7) return 'bg-yellow-100 text-yellow-700'; // Próximo
    return 'bg-zinc-800 text-zinc-200'; // Normal
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-CL');
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(monto);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onVolver}
          className="flex items-center gap-2 text-zinc-300 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Obras
        </button>
      </div>

      {/* Pestañas */}
      <div className="border-b border-zinc-800">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'general', label: 'Información General' },
            { id: 'tareas', label: 'Tareas Asignadas' },
            { id: 'pagos', label: 'Plan de Pagos' },
            { id: 'gantt', label: 'Carta Gantt' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPestanaActiva(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${pestanaActiva === tab.id
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido según pestaña activa */}
      {pestanaActiva === 'general' && (
        <div className="bg-zinc-900 rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-2xl font-bold text-white">{obra.nombre_obra}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-zinc-500 mt-1" />
                <div>
                  <p className="text-sm text-zinc-400">Dirección</p>
                  <p className="font-medium">{obra.direccion}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-zinc-500 mt-1" />
                <div>
                  <p className="text-sm text-zinc-400">Período</p>
                  <p className="font-medium">
                    {formatearFecha(obra.fecha_inicio_plan)} - {formatearFecha(obra.fecha_fin_plan)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-zinc-500 mt-1" />
                <div>
                  <p className="text-sm text-zinc-400">Monto Contrato</p>
                  <p className="font-medium text-lg">{formatearMoneda(obra.monto_contrato)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-zinc-500 mt-1" />
                <div>
                  <p className="text-sm text-zinc-400">Cliente</p>
                  <p className="font-medium">{obra.cliente?.nombre || 'Sin asignar'}</p>
                  <p className="text-sm text-zinc-300">{obra.cliente?.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-zinc-500 mt-1" />
                <div>
                  <p className="text-sm text-zinc-400">Administrador de Obra</p>
                  <p className="font-medium">{obra.jefe_obra?.nombre || 'Sin asignar'}</p>
                  <p className="text-sm text-zinc-300">{obra.jefe_obra?.email}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-zinc-400 mb-2">Estado</p>
                <span className={`
                  inline-flex px-3 py-1 rounded-full text-sm font-medium
                  ${obra.estado === 'en_curso' ? 'bg-green-100 text-green-800' : ''}
                  ${obra.estado === 'planificada' ? 'bg-orange-500/20 text-orange-400' : ''}
                  ${obra.estado === 'pausada' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${obra.estado === 'entregada' ? 'bg-zinc-800 text-white' : ''}
                `}>
                  {obra.estado}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {pestanaActiva === 'tareas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Tareas Asignadas ({tareas.length})</h3>
          </div>

          {tareas.length === 0 ? (
            <div className="bg-zinc-900 rounded-lg shadow p-8 text-center text-zinc-400">
              No hay tareas asignadas a esta obra
            </div>
          ) : (
            <div className="grid gap-4">
              {tareas.map((tarea) => (
                <div key={tarea.id} className="bg-zinc-900 rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{tarea.descripcion_trabajo}</h4>
                      {tarea.actividad && (
                        <p className="text-sm text-zinc-300">Actividad: {tarea.actividad.nombre}</p>
                      )}
                    </div>
                    <span className={`
                      px-3 py-1 rounded-full text-sm font-medium
                      ${tarea.estado === 'finalizada' ? 'bg-green-100 text-green-800' : ''}
                      ${tarea.estado === 'en_progreso' ? 'bg-orange-500/20 text-orange-400' : ''}
                      ${tarea.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${tarea.estado === 'pausada' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {tarea.estado}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-400">Fecha Asignada</p>
                      <p className="font-medium">{formatearFecha(tarea.fecha_asignada)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400">Responsable</p>
                      <p className="font-medium">{tarea.responsable?.nombre || 'Sin asignar'}</p>
                    </div>
                    {tarea.meta_cantidad && (
                      <div>
                        <p className="text-zinc-400">Meta</p>
                        <p className="font-medium">{tarea.meta_cantidad}</p>
                      </div>
                    )}
                  </div>

                  {tarea.observaciones_seguridad_calidad && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded">
                      <p className="text-sm text-zinc-200">
                        <strong>Observaciones:</strong> {tarea.observaciones_seguridad_calidad}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {pestanaActiva === 'pagos' && (
        <div className="space-y-6">
          {/* Resumen Financiero */}
          <div className="bg-black border-b border-zinc-800 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-4">Resumen Financiero</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-zinc-400 text-sm mb-1">Total Contrato</p>
                <p className="text-3xl font-bold">{formatearMoneda(obra.monto_contrato)}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">Total Abonado (Real)</p>
                <p className="text-3xl font-bold text-green-300">{formatearMoneda(totalAbonado)}</p>
                <p className="text-sm mt-1">{porcentajePagado.toFixed(1)}% del contrato</p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">Saldo Pendiente</p>
                <p className="text-3xl font-bold text-yellow-300">{formatearMoneda(saldoPendiente)}</p>
              </div>
            </div>
            
            {/* Barra de progreso */}
            <div className="mt-4">
              <div className="w-full bg-orange-600 rounded-full h-3">
                <div
                  className="bg-green-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Próximos Pagos - Alertas */}
          {proximosPagos.length > 0 && (
            <div className="bg-zinc-900 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Próximos Pagos
              </h3>
              <div className="space-y-3">
                {proximosPagos.map((pago) => {
                  const diasRestantes = calcularDiasRestantes(pago.fecha_estimada);
                  const esUrgente = diasRestantes <= 7;
                  const esVencido = diasRestantes < 0;
                  
                  return (
                    <div
                      key={pago.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        esVencido ? 'bg-red-50 border-red-500' :
                        esUrgente ? 'bg-yellow-50 border-yellow-500' :
                        'bg-black border-zinc-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{pago.concepto}</p>
                          <p className="text-2xl font-bold mt-1">{formatearMoneda(pago.monto)}</p>
                          <p className="text-sm text-zinc-300 mt-1">
                            Fecha estimada: {formatearFecha(pago.fecha_estimada)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            esVencido ? 'text-red-700' :
                            esUrgente ? 'text-yellow-700' :
                            'text-zinc-200'
                          }`}>
                            {esVencido ? `Vencido hace ${Math.abs(diasRestantes)} días` :
                             esUrgente ? `En ${diasRestantes} días` :
                             `En ${diasRestantes} días`}
                          </p>
                          <button
                            onClick={() => abrirModalAbono(pago.id)}
                            className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          >
                            Registrar Pago
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Plan de Pagos */}
          <div className="bg-zinc-900 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Plan de Pagos</h3>
              <button
                onClick={() => abrirModalPago('crear')}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Plus className="w-4 h-4" />
                Nuevo Pago
              </button>
            </div>

            {loadingPagos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              </div>
            ) : planPagos.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">
                No hay pagos programados. Cree el plan de pagos del cliente.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">N°</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Concepto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Monto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">%</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Fecha Estimada</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Estado</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {planPagos.map((pago) => (
                      <tr key={pago.id} className="hover:bg-black">
                        <td className="px-4 py-3 text-sm">{pago.payment_number}</td>
                        <td className="px-4 py-3 text-sm font-medium">{pago.concepto}</td>
                        <td className="px-4 py-3 text-sm font-semibold">{formatearMoneda(pago.monto)}</td>
                        <td className="px-4 py-3 text-sm">{pago.porcentaje ? `${pago.porcentaje}%` : '-'}</td>
                        <td className="px-4 py-3 text-sm">{formatearFecha(pago.fecha_estimada)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${obtenerColorUrgencia(pago.status, pago.fecha_estimada)}`}>
                            {pago.status === 'pagado' ? 'Pagado' : 
                             calcularDiasRestantes(pago.fecha_estimada) < 0 ? 'Vencido' :
                             calcularDiasRestantes(pago.fecha_estimada) <= 7 ? 'Próximo' :
                             'Pendiente'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {pago.status !== 'pagado' && (
                              <button
                                onClick={() => abrirModalAbono(pago.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Registrar pago"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => abrirModalPago('editar', pago)}
                              className="p-1 text-orange-500 hover:bg-orange-500/10 rounded"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => eliminarPago(pago.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-black font-semibold">
                    <tr>
                      <td colSpan="2" className="px-4 py-3 text-sm text-zinc-200">TOTAL PLAN PROGRAMADO</td>
                      <td className="px-4 py-3 text-sm text-orange-400">{formatearMoneda(totalPlanProgramado)}</td>
                      <td colSpan="4" className="px-4 py-3 text-xs text-zinc-400">
                        (Suma de todos los hitos programados)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{planPagos.length}</p>
                <p className="text-sm text-zinc-300">Pagos Totales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{planPagos.filter(p => p.status === 'pagado').length}</p>
                <p className="text-sm text-zinc-300">Completados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{planPagos.filter(p => p.status === 'pendiente').length}</p>
                <p className="text-sm text-zinc-300">Pendientes</p>
              </div>
            </div>
          </div>

          {/* NUEVA SECCIÓN: Pagos Realizados (Historial Editable) */}
          <div className="bg-zinc-900 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Pagos Realizados (Historial Completo)</h3>
            
            {pagosRealizados.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">
                No hay pagos registrados aún.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Fecha Pago</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Monto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Método</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Referencia</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Vinculado a Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Notas</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pagosRealizados.map((pago) => {
                      const pagoVinculado = planPagos.find(p => p.id === pago.payment_schedule_id);
                      return (
                        <tr key={pago.id} className="hover:bg-black">
                          <td className="px-4 py-3 text-sm">{formatearFecha(pago.fecha_pago)}</td>
                          <td className="px-4 py-3 text-sm font-bold text-green-700">{formatearMoneda(pago.monto)}</td>
                          <td className="px-4 py-3 text-sm capitalize">{pago.metodo_pago}</td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{pago.referencia || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            {pagoVinculado ? (
                              <span className="text-orange-500">
                                Pago #{pagoVinculado.payment_number} - {pagoVinculado.concepto}
                              </span>
                            ) : (
                              <span className="text-zinc-500">No vinculado</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-300">{pago.notas || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => abrirModalEditarPagoRealizado(pago)}
                                className="p-1 text-orange-500 hover:bg-orange-500/10 rounded"
                                title="Editar pago"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => eliminarPagoRealizado(pago.id, pago.payment_schedule_id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Eliminar pago"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-green-50 font-semibold">
                    <tr>
                      <td className="px-4 py-3 text-sm text-zinc-200">TOTAL ABONADO</td>
                      <td className="px-4 py-3 text-sm text-green-700">{formatearMoneda(totalAbonado)}</td>
                      <td colSpan="5" className="px-4 py-3 text-xs text-zinc-400">
                        (Suma real de pagos recibidos)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {pestanaActiva === 'gantt' && (
        <GanttObra obraId={obra.id} nombreObra={obra.nombre_obra} />
      )}

      {/* Modal Crear/Editar Pago */}
      {modalPago.abierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {modalPago.tipo === 'crear' ? 'Nuevo Pago' : 'Editar Pago'}
              </h3>
              <button onClick={cerrarModalPago} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Número de Pago
                </label>
                <input
                  type="number"
                  value={formPago.payment_number}
                  onChange={(e) => setFormPago({ ...formPago, payment_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Concepto *
                </label>
                <input
                  type="text"
                  value={formPago.concepto}
                  onChange={(e) => setFormPago({ ...formPago, concepto: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Ej: Anticipo 30%"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1">
                    Monto *
                  </label>
                  <input
                    type="number"
                    value={formPago.monto}
                    onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1">
                    Porcentaje
                  </label>
                  <input
                    type="number"
                    value={formPago.porcentaje}
                    onChange={(e) => setFormPago({ ...formPago, porcentaje: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Fecha Estimada *
                </label>
                <input
                  type="date"
                  value={formPago.fecha_estimada}
                  onChange={(e) => setFormPago({ ...formPago, fecha_estimada: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Notas
                </label>
                <textarea
                  value={formPago.notas}
                  onChange={(e) => setFormPago({ ...formPago, notas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  rows="3"
                  placeholder="Notas adicionales..."
                ></textarea>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={guardarPago}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
              <button
                onClick={cerrarModalPago}
                className="px-4 py-2 border border-zinc-700 rounded-lg hover:bg-black"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Abono */}
      {modalAbono.abierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Registrar Pago</h3>
              <button onClick={cerrarModalAbono} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Fecha de Pago
                </label>
                <input
                  type="date"
                  value={formAbono.fecha_pago}
                  onChange={(e) => setFormAbono({ ...formAbono, fecha_pago: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Método de Pago
                </label>
                <select
                  value={formAbono.metodo_pago}
                  onChange={(e) => setFormAbono({ ...formAbono, metodo_pago: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Referencia / N° Comprobante
                </label>
                <input
                  type="text"
                  value={formAbono.referencia}
                  onChange={(e) => setFormAbono({ ...formAbono, referencia: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="N° de transferencia, cheque, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Notas
                </label>
                <textarea
                  value={formAbono.notas}
                  onChange={(e) => setFormAbono({ ...formAbono, notas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  rows="3"
                  placeholder="Observaciones adicionales..."
                ></textarea>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={registrarAbono}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                Confirmar Pago
              </button>
              <button
                onClick={cerrarModalAbono}
                className="px-4 py-2 border border-zinc-700 rounded-lg hover:bg-black"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NUEVO MODAL: Editar Pago Realizado */}
      {modalEditarPagoRealizado.abierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Editar Pago Realizado</h3>
              <button onClick={cerrarModalEditarPagoRealizado} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Monto *
                </label>
                <input
                  type="number"
                  value={formEditarPagoRealizado.monto}
                  onChange={(e) => setFormEditarPagoRealizado({ ...formEditarPagoRealizado, monto: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Fecha de Pago *
                </label>
                <input
                  type="date"
                  value={formEditarPagoRealizado.fecha_pago}
                  onChange={(e) => setFormEditarPagoRealizado({ ...formEditarPagoRealizado, fecha_pago: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Método de Pago
                </label>
                <select
                  value={formEditarPagoRealizado.metodo_pago}
                  onChange={(e) => setFormEditarPagoRealizado({ ...formEditarPagoRealizado, metodo_pago: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Referencia / N° Comprobante
                </label>
                <input
                  type="text"
                  value={formEditarPagoRealizado.referencia}
                  onChange={(e) => setFormEditarPagoRealizado({ ...formEditarPagoRealizado, referencia: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="N° de transferencia, cheque, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Notas
                </label>
                <textarea
                  value={formEditarPagoRealizado.notas}
                  onChange={(e) => setFormEditarPagoRealizado({ ...formEditarPagoRealizado, notas: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  rows="3"
                  placeholder="Observaciones adicionales..."
                ></textarea>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={guardarPagoRealizado}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
              <button
                onClick={cerrarModalEditarPagoRealizado}
                className="px-4 py-2 border border-zinc-700 rounded-lg hover:bg-black"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}