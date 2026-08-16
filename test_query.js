import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function testQuery() {
  const { data, error } = await supabase
    .from('asistencias')
    .select(`
      *,
      maestro:usuarios!asistencias_maestro_id_fkey(nombre, email),
      tarea:tareas_diarias(
        id,
        obra:obras(nombre_obra, direccion)
      )
    `)
    .limit(1);
  console.log('Error:', error);
  console.log('Data:', data);
}
testQuery();
