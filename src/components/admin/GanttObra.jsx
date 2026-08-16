import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Upload, Download, PlusCircle, Trash2, Save, Calendar } from 'lucide-react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { es } from 'date-fns/locale';

export default function GanttObra({ obraId, nombreObra }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState(ViewMode.Day);

  useEffect(() => {
    if (obraId) {
      cargarTareas();
    }
  }, [obraId]);

  // Cargar tareas desde Supabase
  const cargarTareas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tareas_obra')
        .select('*')
        .eq('id_obra', obraId)
        .order('start_date', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedTasks = data.map(t => ({
          id: t.task_id,
          name: t.name,
          start: t.start_date,
          end: t.end_date,
          dias: t.dias || calculateDays(t.start_date, t.end_date),
          progress: t.progress || 0,
          dependencies: t.dependencies || '',
          dbId: t.id
        }));
        setTasks(formattedTasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error cargando tareas:', error);
      alert('Error al cargar las tareas del Gantt');
    } finally {
      setLoading(false);
    }
  };

  // Guardar todas las tareas en Supabase
  const guardarTareas = async () => {
    try {
      setSaving(true);

      // Eliminar todas las tareas existentes de esta obra
      const { error: deleteError } = await supabase
        .from('tareas_obra')
        .delete()
        .eq('id_obra', obraId);

      if (deleteError) throw deleteError;

      // Insertar todas las tareas actualizadas
      if (tasks.length > 0) {
        const tasksToInsert = tasks.map(t => ({
          id_obra: obraId,
          task_id: t.id,
          name: t.name,
          start_date: t.start,
          end_date: t.end,
          dias: t.dias,
          progress: t.progress,
          dependencies: t.dependencies || ''
        }));

        const { error: insertError } = await supabase
          .from('tareas_obra')
          .insert(tasksToInsert);

        if (insertError) throw insertError;
      }

      alert('✅ Carta Gantt guardada correctamente');
      await cargarTareas(); // Recargar para obtener los IDs actualizados
    } catch (error) {
      console.error('Error guardando tareas:', error);
      alert('Error al guardar la carta Gantt: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Utilidades
  const isValidDateString = (dateStr) => dateStr && !isNaN(new Date(dateStr).getTime());

  const parseExcelDate = (val) => {
    if (typeof val === 'number') {
      const d = XLSX.SSF.parse_date_code(val);
      return new Date(d.y, d.m - 1, d.d);
    }
    if (typeof val === 'string') {
      const parts = val.split('-');
      if (parts.length === 3) {
        const [day, month, year] = parts.map(n => parseInt(n, 10));
        const fullYear = year < 100 ? 2000 + year : year;
        return new Date(fullYear, month - 1, day);
      }
      const parsed = new Date(val);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Importar desde Excel
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = file.name.endsWith('.csv')
        ? evt.target.result
        : new Uint8Array(evt.target.result);

      const wb = XLSX.read(data, {
        type: file.name.endsWith('.csv') ? 'string' : 'array'
      });

      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws);
      transformAndSetTasks(jsonData);
    };

    file.name.endsWith('.csv') ? reader.readAsText(file) : reader.readAsArrayBuffer(file);
  };

  const transformAndSetTasks = (jsonData) => {
    const formatted = jsonData.map((row, index) => {
      const startDate = parseExcelDate(row['Inicio'] || row['Start'] || row['start']);
      const dias = parseInt(row['Días'] || row['Dias'] || row['dias'] || 0);

      let endDate = startDate ? new Date(startDate) : null;
      if (startDate && dias > 0) endDate.setDate(startDate.getDate() + dias);

      let rawProgress = row['Progreso'] || row['Progress'] || row['progress'] || 0;
      let progress = 0;
      if (typeof rawProgress === 'number') {
        progress = rawProgress <= 1 ? Math.round(rawProgress * 100) : Math.round(rawProgress);
      } else if (typeof rawProgress === 'string') {
        progress = parseInt(rawProgress.replace('%', '').trim()) || 0;
      }

      return {
        id: String(row['id'] || index + 1),
        name: row['Nombre'] || row['name'] || row['Descripción del hito'] || row['Task'] || 'Sin nombre',
        start: startDate ? startDate.toISOString().split('T')[0] : '',
        end: endDate ? endDate.toISOString().split('T')[0] : '',
        dias: dias || 0,
        progress,
        dependencies: String(row['dependencies'] || row['Dependencias'] || '')
      };
    });

    setTasks(formatted);
  };

  // Edición manual
  const handleChange = (index, field, value) => {
    const updated = [...tasks];

    if (field === 'progress' || field === 'dias') {
      updated[index][field] = parseInt(value) || 0;
    } else {
      updated[index][field] = value;
    }

    // Recalcular días si start o end cambian
    if ((field === 'start' || field === 'end') && updated[index].start && updated[index].end) {
      updated[index].dias = calculateDays(updated[index].start, updated[index].end);
    }

    // Recalcular end si dias cambia
    if (field === 'dias' && updated[index].start) {
      const startDate = new Date(updated[index].start);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + updated[index].dias);
      updated[index].end = endDate.toISOString().split('T')[0];
    }

    setTasks(updated);
  };

  const handleAddTask = () => {
    const newTaskId = String(tasks.length + 1);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    setTasks([
      ...tasks,
      {
        id: newTaskId,
        name: 'Nueva tarea',
        start: today,
        end: tomorrowStr,
        dias: 1,
        progress: 0,
        dependencies: ''
      }
    ]);
  };

  const handleDeleteTask = (index) => {
    if (!confirm('¿Está seguro de eliminar esta tarea?')) return;
    setTasks(tasks.filter((_, i) => i !== index));
  };

  // Exportar a Excel
  const handleSaveExcel = () => {
    if (tasks.length === 0) return alert('No hay tareas para exportar');

    const exportData = tasks.map(t => ({
      id: t.id,
      Nombre: t.name,
      Inicio: t.start,
      Término: t.end,
      Días: t.dias,
      'Progreso (%)': t.progress,
      Dependencias: t.dependencies
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gantt');

    const fileName = `${nombreObra || 'obra'}_gantt_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(
      new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]),
      fileName
    );
  };

  // Gantt Task React
  const ganttTasks = tasks
    .filter(t => isValidDateString(t.start) && isValidDateString(t.end))
    .map(t => ({
      id: t.id,
      name: t.name,
      start: new Date(t.start),
      end: new Date(t.end),
      type: 'task',
      progress: t.progress,
      dependencies: t.dependencies ? t.dependencies.split(',').map(d => d.trim()) : []
    }));

  const handleTaskChange = (task) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === task.id
          ? {
              ...t,
              start: task.start.toISOString().split('T')[0],
              end: task.end.toISOString().split('T')[0],
              progress: parseInt(task.progress) || 0,
              dias: calculateDays(task.start.toISOString().split('T')[0], task.end.toISOString().split('T')[0])
            }
          : t
      )
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-zinc-900 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-500" />
          Carta Gantt: {nombreObra}
        </h3>

        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Importar Excel
            <input type="file" accept=".xlsx,.csv" hidden onChange={handleFileUpload} />
          </label>

          <button
            onClick={handleSaveExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            disabled={tasks.length === 0}
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>

          <button
            onClick={handleAddTask}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Nueva Tarea
          </button>

          <button
            onClick={guardarTareas}
            disabled={saving}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Controles de vista */}
      <div className="bg-zinc-900 p-4 rounded-lg shadow">
        <label className="text-sm font-medium text-zinc-200 mr-3">Vista:</label>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
        >
          <option value={ViewMode.Day}>Día</option>
          <option value={ViewMode.Week}>Semana</option>
          <option value={ViewMode.Month}>Mes</option>
        </select>
      </div>

      {/* Tabla de edición */}
      <div className="bg-zinc-900 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Inicio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Término</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Días</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Progreso (%)</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-zinc-400">
                    No hay tareas. Agrega una nueva tarea o importa desde Excel.
                  </td>
                </tr>
              ) : (
                tasks.map((t, i) => (
                  <tr key={t.id} className="hover:bg-black">
                    <td className="px-4 py-3">
                      <input
                        value={t.name}
                        onChange={(e) => handleChange(i, 'name', e.target.value)}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-orange-500"
                        placeholder="Nombre de la tarea"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={t.start}
                        onChange={(e) => handleChange(i, 'start', e.target.value)}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={t.end}
                        onChange={(e) => handleChange(i, 'end', e.target.value)}
                        className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-orange-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={t.dias}
                        onChange={(e) => handleChange(i, 'dias', e.target.value)}
                        className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-orange-500"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={t.progress}
                        onChange={(e) => handleChange(i, 'progress', e.target.value)}
                        className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-orange-500"
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteTask(i)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        title="Eliminar tarea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diagrama de Gantt */}
      {ganttTasks.length > 0 && (
        <div className="bg-zinc-900 rounded-lg shadow p-4">
          <h4 className="text-md font-semibold text-white mb-4">Diagrama de Gantt</h4>
          <div style={{ minHeight: '400px', overflowX: 'auto' }}>
            <Gantt
              tasks={ganttTasks}
              viewMode={viewMode}
              onDateChange={handleTaskChange}
              onProgressChange={handleTaskChange}
              listCellWidth="200px"
              columnWidth={viewMode === ViewMode.Month ? 300 : viewMode === ViewMode.Week ? 250 : 60}
              rowHeight={40}
              locale={es}
            />
          </div>
        </div>
      )}
    </div>
  );
}
