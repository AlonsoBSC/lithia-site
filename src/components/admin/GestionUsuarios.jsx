
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, UserPlus, Edit2, Trash2, Search, Mail, Phone, Briefcase } from 'lucide-react';

export default function GestionUsuarios() {
  const [activeTab, setActiveTab] = useState('maestros');
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    apellido: '',
    rut: '',
    telefono: '',
    especialidad: '',
    password: '',
    rol: 'maestro'
  });

  useEffect(() => {
    cargarUsuarios();
  }, [activeTab]);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rol', activeTab === 'maestros' ? 'maestro' : activeTab === 'administradores' ? 'administrador_obra' : 'cliente')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      alert('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // Actualizar usuario existente (sin cambiar contraseña)
        const userData = {
          email: formData.email.toLowerCase().trim(),
          nombre: formData.nombre.trim(),
          apellido: formData.apellido?.trim() || null,
          rut: formData.rut?.trim() || null,
          telefono: formData.telefono?.trim() || null,
          especialidad: formData.especialidad?.trim() || null,
          rol: activeTab === 'maestros' ? 'maestro' : activeTab === 'administradores' ? 'administrador_obra' : 'cliente'
        };

        console.log('Actualizando usuario:', editingUser.id, userData);

        const { error } = await supabase
          .from('usuarios')
          .update(userData)
          .eq('id', editingUser.id);

        if (error) {
          console.error('Error al actualizar:', error);
          throw error;
        }

        console.log('Usuario actualizado correctamente');
        alert('✅ Usuario actualizado correctamente');
      } else {
        // Crear nuevo usuario con contraseña usando Edge Function
        if (!formData.password || formData.password.length < 6) {
          alert('❌ La contraseña debe tener al menos 6 caracteres');
          return;
        }

        console.log('Preparando creación de usuario...');

        const emailToCheck = formData.email.toLowerCase().trim();

        // PASO 1: Verificar si el usuario ya existe en la tabla usuarios
        console.log('Verificando si el email ya existe:', emailToCheck);
        const { data: existingUser, error: checkError } = await supabase
          .from('usuarios')
          .select('email, nombre, apellido')
          .eq('email', emailToCheck)
          .maybeSingle();

        if (checkError) {
          console.error('Error al verificar email:', checkError);
          throw new Error('Error al verificar si el usuario existe');
        }

        if (existingUser) {
          console.log('Usuario ya existe:', existingUser);
          alert(`❌ Ya existe un usuario con el email ${emailToCheck}.\n\nUsuario: ${existingUser.nombre} ${existingUser.apellido}\n\nPor favor, usa otro email o edita el usuario existente.`);
          return;
        }

        console.log('Email disponible, procediendo con la creación...');

        // PASO 2: Crear usuario usando Edge Function

        const payload = {
          email: emailToCheck,
          password: formData.password,
          nombre: formData.nombre.trim(),
          apellido: formData.apellido?.trim() || null,
          rut: formData.rut?.trim() || null,
          telefono: formData.telefono?.trim() || null,
          especialidad: formData.especialidad?.trim() || null,
          rol: activeTab === 'maestros' ? 'maestro' : activeTab === 'administradores' ? 'administrador_obra' : 'cliente'
        };

        console.log('Creando usuario con payload:', { ...payload, password: '***' });

        const { data: result, error: functionError } = await supabase.functions.invoke('create-user-with-password', {
          body: payload
        });

        console.log('Function result:', result, 'Error:', functionError);

        if (functionError) {
          console.error('Error del servidor:', functionError);
          // Intentar parsear el mensaje de error si es un string JSON
          let errorMsg = functionError.message || 'Error al crear usuario';
          if (typeof errorMsg === 'string' && errorMsg.includes('{')) {
            try {
              const parsed = JSON.parse(errorMsg);
              errorMsg = parsed.error || parsed.message || errorMsg;
            } catch (e) {}
          }
          
          if (errorMsg.includes('already been registered') || (result && result.error && result.error.includes('already been registered'))) {
            alert('❌ Este email ya está registrado en el sistema de autenticación.\n\nSi crees que es un error, contacta al administrador del sistema.');
          } else {
            throw new Error(errorMsg);
          }
          return;
        }

        if (result && result.error) {
          console.error('Error en el resultado:', result);
          if (result.error.includes('already been registered')) {
            alert('❌ Este email ya está registrado en el sistema de autenticación.\n\nSi crees que es un error, contacta al administrador del sistema.');
          } else {
            throw new Error(result.error);
          }
          return;
        }

        console.log('Usuario creado exitosamente');
        alert('✅ Usuario creado correctamente con contraseña. Ya puede iniciar sesión.');
      }

      setShowModal(false);
      setEditingUser(null);
      setFormData({
        email: '',
        nombre: '',
        apellido: '',
        rut: '',
        telefono: '',
        especialidad: '',
        password: '',
        rol: 'maestro'
      });
      await cargarUsuarios();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      alert('❌ Error: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido || '',
      rut: user.rut || '',
      telefono: user.telefono || '',
      especialidad: user.especialidad || '',
      password: '', // No mostrar contraseña al editar
      rol: user.rol
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario? Esta acción NO se puede deshacer y eliminará:\n- El usuario de la base de datos\n- Todas sus asistencias registradas\n- Todas las tareas asignadas (se desasignarán)\n- Todas las fotos de avance subidas\n- Los tickets asociados')) return;

    try {
      // Eliminar datos relacionados primero
      await supabase.from('asistencias').delete().eq('maestro_id', userId);
      await supabase.from('fotos_avance').delete().eq('maestro_id', userId);
      await supabase.from('parte_diario').delete().eq('id_trabajador', userId);

      // Desasignar tareas (no eliminarlas, solo desasignar)
      await supabase.from('tareas_diarias').update({ responsable_trabajador: null }).eq('responsable_trabajador', userId);

      // Actualizar tickets (poner maestro_id en null en lugar de eliminarlos)
      await supabase.from('tickets').update({ maestro_id: null }).eq('maestro_id', userId);
      await supabase.from('tickets').update({ cliente_id: null }).eq('cliente_id', userId);

      // Actualizar obras donde sea jefe o cliente (no eliminar obras)
      await supabase.from('obras').update({ id_jefe_obra: null }).eq('id_jefe_obra', userId);
      await supabase.from('obras').update({ id_cliente: null }).eq('id_cliente', userId);

      // Finalmente eliminar el usuario
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      alert('✅ Usuario eliminado correctamente junto con sus datos asociados');
      cargarUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('❌ Error al eliminar usuario: ' + error.message);
    }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.telefono && u.telefono.includes(searchTerm))
  );

  const getRolLabel = () => {
    if (activeTab === 'maestros') return 'Maestro';
    if (activeTab === 'administradores') return 'Administrador de Obra';
    return 'Cliente';
  };

  const getEspecialidadLabel = () => {
    if (activeTab === 'maestros') return 'Especialidad';
    if (activeTab === 'administradores') return 'Área';
    return 'Empresa/Proyecto';
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      email: '',
      nombre: '',
      apellido: '',
      rut: '',
      telefono: '',
      especialidad: '',
      password: '',
      rol: activeTab === 'maestros' ? 'maestro' : activeTab === 'administradores' ? 'administrador_obra' : 'cliente'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-7 h-7" />
            Gestión de Usuarios
          </h2>
          <p className="text-zinc-300 mt-1">Administra maestros, administradores de obra y clientes</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({
              email: '',
              nombre: '',
              apellido: '',
              rut: '',
              telefono: '',
              especialidad: '',
              password: '',
              rol: activeTab === 'maestros' ? 'maestro' : activeTab === 'administradores' ? 'administrador_obra' : 'cliente'
            });
            setShowModal(true);
          }}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('maestros')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'maestros'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          Maestros
        </button>
        <button
          onClick={() => setActiveTab('administradores')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'administradores'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          Administradores
        </button>
        <button
          onClick={() => setActiveTab('clientes')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'clientes'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          Clientes
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Lista de usuarios */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-zinc-300 mt-4">Cargando usuarios...</p>
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-black rounded-lg">
          <Users className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
          <p className="text-zinc-300">No hay {activeTab === 'maestros' ? 'maestros' : activeTab === 'administradores' ? 'administradores' : 'clientes'} registrados</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-orange-500 hover:text-orange-400 font-medium"
          >
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {usuariosFiltrados.map((usuario) => (
            <div key={usuario.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <span className="text-orange-500 font-bold text-lg">
                      {usuario.nombre.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{usuario.nombre} {usuario.apellido}</h3>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(usuario)}
                    className="p-1 text-orange-500 hover:bg-orange-500/10 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(usuario.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{usuario.email}</span>
                </div>
                {usuario.telefono && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Phone className="w-4 h-4" />
                    <span>{usuario.telefono}</span>
                  </div>
                )}
                {usuario.especialidad && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Briefcase className="w-4 h-4" />
                    <span>{usuario.especialidad}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de creación/edición */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 rounded-lg max-w-md w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingUser ? 'Editar Usuario' : `Nuevo ${getRolLabel()}`}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="usuario@email.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Juan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Pérez"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  RUT
                </label>
                <input
                  type="text"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="12.345.678-9"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                  <p className="text-xs text-zinc-400 mt-1">
                    El usuario podrá iniciar sesión inmediatamente con esta contraseña
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">
                  {getEspecialidadLabel()}
                </label>
                <input
                  type="text"
                  value={formData.especialidad}
                  onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={
                    activeTab === 'maestros'
                      ? 'Ej: Albañilería'
                      : activeTab === 'administradores'
                      ? 'Ej: Construcción'
                      : 'Ej: Inmobiliaria XYZ'
                  }
                />
              </div>

              {!editingUser && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    ✅ El usuario podrá iniciar sesión inmediatamente con su email y contraseña
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 border-2 border-red-300 text-red-700 font-semibold rounded-lg hover:bg-red-50 transition-colors"
                >
                  ✕ Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  ✓ {editingUser ? 'Actualizar' : 'Aceptar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}