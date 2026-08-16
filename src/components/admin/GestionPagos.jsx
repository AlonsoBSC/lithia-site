import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, Plus, Edit2, Trash2, CheckCircle, Clock, AlertCircle, Search, X, Calendar } from 'lucide-react';

export default function GestionPagos() {
  const [obras, setObras] = useState([]);
  const [obraSeleccionada, setObraSeleccionada] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [pagosRealizados, setPagosRealizados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalPago, setModalPago] = useState(false);
  const [modalRegistro, setModalRegistro] = useState(false);
  const [pagoEditando, setPagoEditando] = useState(null);
  const [pagoRegistrar, setPagoRegistrar] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const [formPago, setFormPago] = useState({
    payment_number: 1,
    concepto: '',
    porcentaje: 0,
    monto: 0,
    fecha_estimada: '',
    status: 'pendiente'
  });

  const [formRegistro, setFormRegistro] = useState({
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: 'transferencia',
    monto_recibido: 0,
    notas: ''
  });

  useEffect(() => {
    cargarObras();
  }, []);

  useEffect(() => {
    if (obraSeleccionada) {
      cargarPagos(obraSeleccionada.id);
      cargarPagosRealizados(obraSeleccionada.id);
    }
  }, [obraSeleccionada]);

  const cargarObras = async () => {
    try {
      const { data, error } = await supabase
        .from('obras')
        .select('*, cliente:id_cliente(nombre, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setObras(data || []);
      if (data && data.length > 0) {
        setObraSeleccionada(data[0]);
      }
    } catch (error) {
      console.error('Error al cargar obras:', error);
    }
  };

  const cargarPagos = async (obraId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_schedule')
        .select('*')
        .eq('obra_id', obraId)
        .order('payment_number', { ascending: true });

      if (error) throw error;
      setPagos(data || []);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarPagosRealizados = async (obraId) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('obra_id', obraId)
        .order('fecha_pago', { ascending: false });

      if (error) throw error;
      setPagosRealizados(data || []);
    } catch (error) {
      console.error('Error al cargar pagos realizados:', error);
    }
  };

  const abrirModalNuevoPago = () => {
    const ultimoPago = pagos.length > 0 ? Math.max(...pagos.map(p => p.payment_number)) : 0;
    setFormPago({
      payment_number: ultimoPago + 1,
      concepto: '',
      porcentaje: 0,
      monto: 0,
      fecha_estimada: '',
      status: 'pendiente'
    });
    setPagoEditando(null);
    setModalPago(true);
  };

  const abrirModalEditarPago = (pago) => {
    setFormPago({
      payment_number: pago.payment_number,
      concepto: pago.concepto,
      porcentaje: pago.porcentaje,
      monto: pago.monto,
      fecha_estimada: pago.fecha_estimada,
      status: pago.status
    });
    setPagoEditando(pago);
    setModalPago(true);
  };
  const [modalObra, setModalObra] = useState(false);
  const [formObra, setFormObra] = useState({
  nombre: '',
  monto_contrato: 0,
  fecha_inicio: '',
  fecha_fin: ''
  });
  const abrirModalEditarObra = (obra) => {
  setFormObra({
    nombre: obra.nombre,
    monto_contrato: obra.monto_contrato,
    fecha_inicio: obra.fecha_inicio || '',
    fecha_fin: obra.fecha_fin || ''
  });
  setModalObra(true);
};
const actualizarObra = async (e) => {
  e.preventDefault();
  try {
    const { error } = await supabase
      .from('obras')
      .update({
        nombre: formObra.nombre,
        monto_contrato: parseFloat(formObra.monto_contrato),
        fecha_inicio: formObra.fecha_inicio,
        fecha_fin: formObra.fecha_fin
      })
      .eq('id', obraSeleccionada.id);

    if (error) throw error;

    // Recalcular pagos programados
    const { data: pagosExistentes } = await supabase
      .from('payment_schedule')
      .select('*')
      .eq('obra_id', obraSeleccionada.id);

    for (const pago of pagosExistentes) {
      const nuevoMonto = (pago.porcentaje / 100) * parseFloat(formObra.monto_contrato);
      await supabase
        .from('payment_schedule')
        .update({ monto: nuevoMonto })
        .eq('id', pago.id);
    }

    setModalObra(false);
    cargarObras();
    cargarPagos(obraSeleccionada.id);
    alert('Obra y pagos actualizados correctamente');
  } catch (error) {
    console.error('Error al actualizar obra:', error);
    alert('Error al actualizar la obra');
  }
};

  const guardarPago = async (e) => {
    e.preventDefault();
    try {
      const datosPago = {
        obra_id: obraSeleccionada.id,
        payment_number: formPago.payment_number,
        concepto: formPago.concepto,
        porcentaje: parseFloat(formPago.porcentaje),
        monto: parseFloat(formPago.monto),
        fecha_estimada: formPago.fecha_estimada,
        status: formPago.status
      };

      if (pagoEditando) {
        const { error } = await supabase
          .from('payment_schedule')
          .update(datosPago)
          .eq('id', pagoEditando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payment_schedule')
          .insert([datosPago]);
        if (error) throw error;
      }

      setModalPago(false);
      cargarPagos(obraSeleccionada.id);
    } catch (error) {
      console.error('Error al guardar pago:', error);
      alert('Error al guardar el pago');
    }
  };

  const eliminarPago = async (pagoId) => {
    if (!confirm('¿Estás seguro de eliminar este pago programado?')) return;
    
    try {
      const { error } = await supabase
        .from('payment_schedule')
        .delete()
        .eq('id', pagoId);

      if (error) throw error;
      cargarPagos(obraSeleccionada.id);
    } catch (error) {
      console.error('Error al eliminar pago:', error);
      alert('Error al eliminar el pago');
    }
  };

  const abrirModalRegistrarPago = (pago) => {
    setPagoRegistrar(pago);
    setFormRegistro({
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo_pago: 'transferencia',
      monto_recibido: pago.monto,
      notas: ''
    });
    setModalRegistro(true);
  };

  const registrarPago = async (e) => {
    e.preventDefault();
    try {
      // Insertar el pago en la tabla payments
      const { error: errorPago } = await supabase
        .from('payments')
        .insert([{
          obra_id: obraSeleccionada.id,
          payment_schedule_id: pagoRegistrar.id,
          monto: parseFloat(formRegistro.monto_recibido),
          fecha_pago: formRegistro.fecha_pago,
          metodo_pago: formRegistro.metodo_pago,
          notas: formRegistro.notas
        }]);

      if (errorPago) throw errorPago;

      // Actualizar el estado del hito en payment_schedule
      const { error: errorSchedule } = await supabase
        .from('payment_schedule')
        .update({ status: 'pagado' })
        .eq('id', pagoRegistrar.id);

      if (errorSchedule) throw errorSchedule;

      setModalRegistro(false);
      cargarPagos(obraSeleccionada.id);
      cargarPagosRealizados(obraSeleccionada.id);
      alert('Pago registrado exitosamente');
    } catch (error) {
      console.error('Error al registrar pago:', error);
      alert('Error al registrar el pago');
    }
  };

  const calcularMontoPorPorcentaje = (porcentaje) => {
    if (obraSeleccionada && obraSeleccionada.monto_contrato) {
      return (parseFloat(porcentaje) / 100) * parseFloat(obraSeleccionada.monto_contrato);
    }
    return 0;
  };

  const calcularResumen = () => {
    const total = parseFloat(obraSeleccionada?.monto_contrato || 0);
    // CORREGIDO: Usa pagosRealizados (tabla payments) para calcular el total abonado
    const abonado = pagosRealizados.reduce((sum, p) => sum + parseFloat(p.monto), 0);
    const pendiente = total - abonado;
    const porcentajeAbonado = total > 0 ? (abonado / total) * 100 : 0;

    return { total, abonado, pendiente, porcentajeAbonado };
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(valor);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    return new Date(fecha).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const obtenerEstadoPago = (pago) => {
    if (pago.status === 'pagado') {
      return { texto: 'Pagado', color: 'bg-green-500/20 text-green-400', icono: CheckCircle };
    }
    
    if (pago.fecha_estimada) {
      const hoy = new Date();
      const fechaProgramada = new Date(pago.fecha_estimada);
      const diferenciaDias = Math.ceil((fechaProgramada - hoy) / (1000 * 60 * 60 * 24));

      if (diferenciaDias < 0) {
        return { texto: 'Vencido', color: 'bg-red-500/20 text-red-400', icono: AlertCircle };
      } else if (diferenciaDias <= 7) {
        return { texto: 'Próximo', color: 'bg-yellow-500/20 text-yellow-400', icono: Clock };
      }
    }

    return { texto: 'Pendiente', color: 'bg-zinc-800 text-white', icono: Clock };
  };

  const obrasFiltradas = obras.filter(obra => 
    (obra.nombre_obra || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (obra.cliente?.nombre || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const resumen = calcularResumen();

  if (loading && !obraSeleccionada) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Pagos</h1>
          <p className="text-zinc-300 mt-1">Administra los pagos de cada obra</p>
        </div>
      </div>

      {/* Selector de Obra */}
      <div className="bg-zinc-900 rounded-lg shadow-sm p-6 mb-6">
        <label className="block text-sm font-medium text-zinc-200 mb-2">
          Seleccionar Obra
        </label>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por obra o cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <select
          value={obraSeleccionada?.id || ''}
          onChange={(e) =>
            setObraSeleccionada(obras.find((o) => o.id === e.target.value))
          }
          className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          {obrasFiltradas.map((obra) => (
            <option key={obra.id} value={obra.id}>
              {obra.nombre_obra} - {obra.cliente?.nombre} ({obra.estado})
            </option>
          ))}
        </select>
        {obraSeleccionada && (
          <div className="mt-4 p-4 bg-black rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-zinc-300">Cliente:</span>
                <p className="font-semibold text-orange-500">{obraSeleccionada.cliente?.nombre}</p>
              </div>
              <div>
                <span className="text-zinc-300">Ubicación:</span>
                <p className="font-semibold text-orange-500">{obraSeleccionada.direccion}</p>
              </div>
              <div>
                <span className="text-zinc-300">Precio Total:</span>
                <p className="font-semibold text-orange-500">
                  {formatearMoneda(obraSeleccionada.monto_contrato)}
                </p>
              </div>
            </div>

            {/* Botón Editar Obra */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => abrirModalEditarObra(obraSeleccionada)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Editar Obra
              </button>
            </div>
          </div>
        )}
      </div>

      {obraSeleccionada && (
        <>
          {/* Resumen Financiero */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-zinc-900 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-300">Monto Total</p>
                  <p className="text-2xl font-bold text-white">{formatearMoneda(resumen.total)}</p>
                </div>
                <DollarSign className="w-10 h-10 text-orange-500" />
              </div>
            </div>

            <div className="bg-zinc-900 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-300">Total Abonado</p>
                  <p className="text-2xl font-bold text-green-600">{formatearMoneda(resumen.abonado)}</p>
                  <p className="text-xs text-zinc-400">{resumen.porcentajeAbonado.toFixed(1)}%</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-zinc-900 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-300">Saldo Pendiente</p>
                  <p className="text-2xl font-bold text-orange-600">{formatearMoneda(resumen.pendiente)}</p>
                  <p className="text-xs text-zinc-400">{(100 - resumen.porcentajeAbonado).toFixed(1)}%</p>
                </div>
                <Clock className="w-10 h-10 text-orange-500" />
              </div>
            </div>

            <div className="bg-zinc-900 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-300">Pagos Totales</p>
                  <p className="text-2xl font-bold text-white">{pagos.length}</p>
                  <p className="text-xs text-zinc-400">
                    {pagos.filter(p => p.status === 'pagado').length} completados
                  </p>
                </div>
                <Calendar className="w-10 h-10 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Barra de Progreso */}
          <div className="bg-zinc-900 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-zinc-200">Progreso de Pagos</span>
              <span className="text-sm font-bold text-orange-500">{resumen.porcentajeAbonado.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-zinc-9000 to-green-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${resumen.porcentajeAbonado}%` }}
              />
            </div>
          </div>

          {/* Tabla de Pagos */}
          <div className="bg-zinc-900 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Plan de Pagos</h2>
              <button
                onClick={abrirModalNuevoPago}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                <Plus className="w-5 h-5" />
                Nuevo Pago
              </button>
            </div>

            <table className="min-w-full divide-y divide-zinc-700">
              <thead className="bg-black">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Concepto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Fecha Estimada</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900 divide-y divide-zinc-700 text-white">
                {pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td className="px-6 py-4 text-sm">{pago.payment_number}</td>
                    <td className="px-6 py-4 text-sm">{pago.concepto}</td>
                    <td className="px-6 py-4 text-sm text-orange-500">{formatearMoneda(pago.monto)}</td>
                    <td className="px-6 py-4 text-sm">{pago.fecha_estimada}</td>
                    <td className="px-6 py-4 text-sm">
                      {pago.status === 'pagado' ? (
                        <span className="text-green-600 font-semibold">Pagado</span>
                      ) : (
                        <span className="text-orange-600 font-semibold">Pendiente</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => abrirModalEditarPago(pago)}
                        className="text-orange-500 hover:text-orange-400"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => eliminarPago(pago.id)}
                        className="text-red-600 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {pago.status !== 'pagado' && (
                        <button
                          onClick={() => abrirModalRegistrarPago(pago)}
                          className="text-green-600 hover:text-green-400"
                        >
                          Registrar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
                className="w-full border border-zinc-700 p-2 rounded bg-zinc-800 text-white"
              />
              <input
                type="number"
                value={formObra.monto_contrato}
                onChange={(e) => setFormObra({ ...formObra, monto_contrato: e.target.value })}
                placeholder="Monto contrato"
                className="w-full border border-zinc-700 p-2 rounded bg-zinc-800 text-white"
              />
              <input
                type="date"
                value={formObra.fecha_inicio}
                onChange={(e) => setFormObra({ ...formObra, fecha_inicio: e.target.value })}
                className="w-full border border-zinc-700 p-2 rounded bg-zinc-800 text-white"
              />
              <input
                type="date"
                value={formObra.fecha_fin}
                onChange={(e) => setFormObra({ ...formObra, fecha_fin: e.target.value })}
                className="w-full border border-zinc-700 p-2 rounded bg-zinc-800 text-white"
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

      {/* Modal Crear/Editar Pago */}
      {modalPago && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {pagoEditando ? 'Editar Pago' : 'Nuevo Pago'}
              </h3>
              <button onClick={() => setModalPago(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={guardarPago} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Número de Pago
                </label>
                <input
                  type="number"
                  value={formPago.payment_number}
                  onChange={(e) => setFormPago({ ...formPago, payment_number: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Concepto
                </label>
                <input
                  type="text"
                  value={formPago.concepto}
                  onChange={(e) => setFormPago({ ...formPago, concepto: e.target.value })}
                  placeholder="Ej: Anticipo, Avance Cimientos, Finiquito"
                  className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1">
                    Porcentaje (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPago.porcentaje}
                    onChange={(e) => {
                      const porcentaje = e.target.value;
                      setFormPago({
                        ...formPago,
                        porcentaje: porcentaje,
                        monto: calcularMontoPorPorcentaje(porcentaje)
                      });
                    }}
                    className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1">
                    Monto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPago.monto}
                    onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Fecha Estimada
                </label>
                <input
                  type="date"
                  value={formPago.fecha_estimada}
                  onChange={(e) => setFormPago({ ...formPago, fecha_estimada: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalPago(false)}
                  className="flex-1 px-4 py-2 border border-zinc-700 text-zinc-200 rounded-lg hover:bg-black"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  {pagoEditando ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Pago */}
      {modalRegistro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                Registrar Pago Recibido
              </h3>
              <button onClick={() => setModalRegistro(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            {pagoRegistrar && (
              <div className="bg-orange-500/10 p-4 rounded-lg mb-4">
                <p className="text-sm text-zinc-300">Concepto:</p>
                <p className="font-semibold text-white">{pagoRegistrar.concepto}</p>
                <p className="text-2xl font-bold text-orange-500 mt-2">
                  {formatearMoneda(pagoRegistrar.monto)}
                </p>
              </div>
            )}

            <form onSubmit={registrarPago} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Fecha de Pago
                </label>
                <input
                  type="date"
                  value={formRegistro.fecha_pago}
                  onChange={(e) => setFormRegistro({ ...formRegistro, fecha_pago: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Monto Recibido
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formRegistro.monto_recibido}
                  onChange={(e) => setFormRegistro({ ...formRegistro, monto_recibido: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Método de Pago
                </label>
                <select
                  value={formRegistro.metodo_pago}
                  onChange={(e) => setFormRegistro({ ...formRegistro, metodo_pago: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="transferencia">Transferencia</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="cheque">Cheque</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={formRegistro.notas}
                  onChange={(e) => setFormRegistro({ ...formRegistro, notas: e.target.value })}
                  placeholder="Número de comprobante, observaciones..."
                  rows="3"
                  className="w-full px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalRegistro(false)}
                  className="flex-1 px-4 py-2 border border-zinc-700 text-zinc-200 rounded-lg hover:bg-black"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
