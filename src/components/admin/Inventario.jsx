import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Inventario() {
  const [categoria, setCategoria] = useState('herramienta');
  const [items, setItems] = useState([]);
  const [formNombre, setFormNombre] = useState('');
  const [formEstatus, setFormEstatus] = useState('activo');
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    cargarItems();
  }, [categoria]);

  const cargarItems = async () => {
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .eq('categoria', categoria)
      .order('nombre', { ascending: true });

    if (error) {
      console.error(error);
      setMessage('Error al cargar inventario');
    } else {
      setItems(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nombre = formNombre.trim();

    if (!nombre || nombre.length < 3) {
      setMessage('El nombre debe tener al menos 3 caracteres');
      return;
    }

    if (editingItem) {
      const { error } = await supabase
        .from('inventario')
        .update({ nombre, estatus: formEstatus })
        .eq('id', editingItem.id);

      if (error) {
        setMessage('Error al actualizar ítem');
      } else {
        setMessage('Ítem actualizado correctamente');
      }
    } else {
      const { error } = await supabase
        .from('inventario')
        .insert([{ nombre, categoria, estatus: formEstatus }]);

      if (error) {
        setMessage('Error al agregar ítem');
      } else {
        setMessage('Ítem agregado correctamente');
      }
    }

    setFormNombre('');
    setFormEstatus('activo');
    setEditingItem(null);
    cargarItems();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este ítem?')) return;
    const { error } = await supabase.from('inventario').delete().eq('id', id);
    if (error) {
      setMessage('Error al eliminar ítem');
    } else {
      setMessage('Ítem eliminado');
      cargarItems();
    }
  };

  const handleEdit = (item) => {
    setFormNombre(item.nombre);
    setFormEstatus(item.estatus || 'activo');
    setEditingItem(item);
  };

  const handleExport = async () => {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .eq('categoria', categoria);

      if (error) throw error;

      // Filtrar por búsqueda actual
      const exportItems = data
        .filter((item) => item.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
        .map((item) => ({
          Nombre: item.nombre,
          Estatus: item.estatus,
          Categoría: item.categoria,
          'Fecha de creación': new Date(item.created_at).toLocaleDateString('es-CL'),
        }));

      // Generar archivo Excel usando xlsx
      const XLSX = (await import('xlsx')).default;
      const worksheet = XLSX.utils.json_to_sheet(exportItems);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

      const fecha = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      XLSX.writeFile(workbook, `inventario_${categoria}_${fecha}.xlsx`);

      setMessage('Archivo exportado correctamente');
    } catch (err) {
      console.error('Error al exportar:', err);
      setMessage('Error al exportar a Excel');
    }
  };

  const filteredItems = items.filter((item) =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="space-y-6 text-white">
      <h2 className="text-2xl font-bold text-white">Inventario</h2>

      {/* Tabs */}
      <div className="flex gap-2">
        {['herramienta', 'implemento', 'material'].map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategoria(cat);
              setCurrentPage(1);
              setSearchTerm('');
              setMessage('');
            }}
            className={`px-4 py-2 rounded-lg font-medium ${
              categoria === cat ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-200'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          value={formNombre}
          onChange={(e) => setFormNombre(e.target.value)}
          placeholder={`Nombre de ${categoria}`}
          className="px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white"
        />
        <select
          value={formEstatus}
          onChange={(e) => setFormEstatus(e.target.value)}
          className="px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white"
        >
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <button
          type="submit"
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {editingItem ? 'Actualizar' : 'Agregar'}
        </button>
      </form>

      {/* Mensaje */}
      {message && (
        <div className="flex items-center gap-2 text-sm text-zinc-200 bg-zinc-800 px-4 py-2 rounded-lg">
          {message.includes('Error') ? (
            <AlertCircle className="w-4 h-4 text-red-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          )}
          {message}
        </div>
      )}

      {/* Búsqueda y Exportar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Buscar por nombre..."
          className="flex-1 px-4 py-2 border border-zinc-700 rounded-lg bg-zinc-800 text-white"
        />
        <button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar a Excel
        </button>
      </div>

      {/* Lista */}
      <ul className="divide-y divide-zinc-700 mt-4">
        {paginatedItems.map((item) => (
          <li key={item.id} className="flex justify-between items-center py-2">
            <div>
              <span className="font-medium">{item.nombre}</span>
              <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                item.estatus === 'activo'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {item.estatus}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(item)} className="text-orange-500 hover:underline">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1 ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
