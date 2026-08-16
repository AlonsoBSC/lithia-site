import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== INICIANDO CREACIÓN DE USUARIO ===');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Faltan variables de entorno: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    }

    console.log('Inicializando cliente Supabase con service role...');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { email, password, nombre, apellido, rut, telefono, especialidad, rol } = await req.json();

    console.log('Datos recibidos:', {
      email,
      nombre,
      apellido,
      rol,
      rut,
      telefono: telefono ? '***' : null,
      especialidad
    });

    // Validar datos requeridos
    if (!email || !password || !nombre || !rol) {
      const missing = [];
      if (!email) missing.push('email');
      if (!password) missing.push('password');
      if (!nombre) missing.push('nombre');
      if (!rol) missing.push('rol');
      throw new Error(`Faltan campos requeridos: ${missing.join(', ')}`);
    }

    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verificar si el usuario ya existe en la tabla usuarios
    console.log('Verificando si el email ya existe en tabla usuarios...');
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, nombre, apellido')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (checkError) {
      console.error('Error al verificar email en tabla usuarios:', checkError);
      throw new Error(`Error al verificar email: ${checkError.message}`);
    }

    if (existingUser) {
      console.log('Usuario ya existe en tabla usuarios:', existingUser);
      throw new Error(`Ya existe un usuario con el email ${normalizedEmail}`);
    }

    console.log('Email disponible, procediendo con creación en auth...');

    // Crear usuario en auth.users
    console.log('Creando usuario en auth.users...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        nombre: nombre.trim(),
        apellido: apellido?.trim() || null,
        rol: rol
      }
    });

    if (authError) {
      console.error('Error al crear usuario en auth:', authError);
      throw new Error(`Error al crear usuario en auth: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario en auth');
    }

    console.log('Usuario creado en auth con ID:', authData.user.id);

    // Insertar en tabla usuarios
    console.log('Insertando en tabla usuarios...');
    const userData = {
      id: authData.user.id,
      auth_id: authData.user.id,
      email: normalizedEmail,
      nombre: nombre.trim(),
      apellido: apellido?.trim() || null,
      rut: rut?.trim() || null,
      telefono: telefono?.trim() || null,
      especialidad: especialidad?.trim() || null,
      rol: rol,
      es_admin: false
    };

    console.log('Datos a insertar:', { ...userData, id: '***' });

    const { error: dbError } = await supabaseAdmin
      .from('usuarios')
      .insert(userData);

    if (dbError) {
      console.error('Error al insertar en tabla usuarios:', dbError);
      console.error('Detalle del error:', JSON.stringify(dbError));

      // Intentar eliminar el usuario de auth si falló la inserción en la BD
      console.log('ROLLBACK: Eliminando usuario de auth debido al error...');
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('Usuario eliminado de auth exitosamente');
      } catch (deleteError) {
        console.error('Error al eliminar usuario de auth:', deleteError);
      }

      throw new Error(`Error al crear usuario en base de datos: ${dbError.message}`);
    }

    console.log('✅ Usuario creado exitosamente en tabla usuarios');
    console.log('=== CREACIÓN COMPLETADA ===');

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user.id,
        email: normalizedEmail,
        message: 'Usuario creado correctamente'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ ERROR EN EDGE FUNCTION:', error);
    console.error('Stack trace:', error.stack);

    return new Response(
      JSON.stringify({
        error: error.message || 'Error desconocido',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
