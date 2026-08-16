-- =====================================================
-- LITHIA•SITE - Sistema de Gestión de Obras
-- Base de datos para Grupo Lithia Constructores
-- Actualizado con correos corporativos @grupolithia.cl
-- =====================================================

-- Deshabilitar RLS para permitir operaciones desde la UI
ALTER TABLE IF EXISTS usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS obras DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS planificacion_actividades DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tareas_diarias DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS parte_diario DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS avance_fisico DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pagos_contrato DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tickets_cliente DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS asistencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fotos_avance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comentarios_fotos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_schedule DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tickets DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABLA: usuarios
-- =====================================================
DROP TABLE IF EXISTS usuarios CASCADE;
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  nombre TEXT NOT NULL,
  apellido TEXT,
  rut TEXT,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'administrador_obra', 'maestro', 'cliente')),
  especialidad TEXT,
  es_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: obras
-- =====================================================
DROP TABLE IF EXISTS obras CASCADE;
CREATE TABLE obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_obra TEXT NOT NULL,
  direccion TEXT NOT NULL,
  geo_lat DECIMAL(10, 8),
  geo_lng DECIMAL(11, 8),
  fecha_inicio_plan DATE NOT NULL,
  fecha_fin_plan DATE NOT NULL,
  monto_contrato DECIMAL(15, 2) NOT NULL,
  id_cliente UUID REFERENCES usuarios(id),
  id_jefe_obra UUID REFERENCES usuarios(id),
  estado TEXT DEFAULT 'planificada' CHECK (estado IN ('planificada', 'en_curso', 'pausada', 'entregada')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: planificacion_actividades (Plantillas de Actividades)
-- Estas son actividades reutilizables que se asignan a obras específicas
-- en tareas_diarias con fechas, cantidades y recursos ajustables
-- NUEVO: rendimiento_dia_hombre para calcular duración estimada
-- =====================================================
DROP TABLE IF EXISTS planificacion_actividades CASCADE;
CREATE TABLE planificacion_actividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  etapa TEXT,
  subsistema TEXT,
  materiales JSONB DEFAULT '[]'::jsonb,
  herramientas JSONB DEFAULT '[]'::jsonb,
  insumos JSONB DEFAULT '[]'::jsonb,
  rendimiento_dia_hombre DECIMAL(10, 2),
  unidad_medida TEXT DEFAULT 'm2',
  sistema_aplicable TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: tareas_diarias
-- Aquí se asignan las actividades a obras específicas con fechas y cantidades
-- Los materiales, herramientas e insumos se copian de la plantilla y se pueden
-- ajustar específicamente para esta tarea
-- =====================================================
DROP TABLE IF EXISTS tareas_diarias CASCADE;
CREATE TABLE tareas_diarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_obra UUID REFERENCES obras(id) ON DELETE CASCADE,
  id_actividad UUID REFERENCES planificacion_actividades(id) ON DELETE SET NULL,
  fecha_asignada DATE NOT NULL,
  responsable_trabajador UUID REFERENCES usuarios(id),
  descripcion_trabajo TEXT NOT NULL,
  recursos_necesarios TEXT,
  meta_cantidad DECIMAL(10, 2),
  observaciones_seguridad_calidad TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'pausada', 'finalizada')),
  materiales JSONB DEFAULT '[]'::jsonb,
  herramientas JSONB DEFAULT '[]'::jsonb,
  insumos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: asistencias (entrada/salida con GPS)
-- =====================================================
DROP TABLE IF EXISTS asistencias CASCADE;
CREATE TABLE asistencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maestro_id UUID REFERENCES usuarios(id),
  tarea_id UUID REFERENCES tareas_diarias(id),
  tipo TEXT CHECK (tipo IN ('entrada', 'salida')),
  fecha_hora TIMESTAMPTZ DEFAULT NOW(),
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  ubicacion_texto TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: fotos_avance
-- =====================================================
DROP TABLE IF EXISTS fotos_avance CASCADE;
CREATE TABLE fotos_avance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID REFERENCES tareas_diarias(id),
  maestro_id UUID REFERENCES usuarios(id),
  url_foto TEXT NOT NULL,
  descripcion TEXT,
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  fecha_hora TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: comentarios_fotos (observaciones de clientes)
-- =====================================================
DROP TABLE IF EXISTS comentarios_fotos CASCADE;
CREATE TABLE comentarios_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  foto_id UUID NOT NULL REFERENCES fotos_avance(id) ON DELETE CASCADE,
  obra_id UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  cliente_email TEXT NOT NULL,
  comentario TEXT NOT NULL,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  leido BOOLEAN DEFAULT false
);

-- =====================================================
-- TABLA: tickets (generados automáticamente por observaciones)
-- Prioridad ALTA automática para que el maestro corrija inmediatamente
-- =====================================================
DROP TABLE IF EXISTS tickets CASCADE;
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  foto_id UUID REFERENCES fotos_avance(id) ON DELETE CASCADE,
  obra_id UUID REFERENCES obras(id) ON DELETE CASCADE,
  maestro_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  observacion TEXT NOT NULL,
  prioridad TEXT DEFAULT 'ALTA' CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA', 'URGENTE')),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'resuelto', 'rechazado')),
  respuesta_maestro TEXT,
  foto_respuesta TEXT,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_resolucion TIMESTAMPTZ
);

-- =====================================================
-- TABLA: payment_schedule (plan de pagos personalizado)
-- =====================================================
DROP TABLE IF EXISTS payment_schedule CASCADE;
CREATE TABLE payment_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES obras(id) ON DELETE CASCADE,
  payment_number INTEGER NOT NULL,
  concepto TEXT NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  porcentaje DECIMAL(5,2),
  fecha_estimada DATE,
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado', 'vencido')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: payments (pagos realizados)
-- =====================================================
DROP TABLE IF EXISTS payments CASCADE;
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES obras(id) ON DELETE CASCADE,
  payment_schedule_id UUID REFERENCES payment_schedule(id) ON DELETE SET NULL,
  monto DECIMAL(12,2) NOT NULL,
  fecha_pago TIMESTAMPTZ DEFAULT NOW(),
  metodo_pago TEXT DEFAULT 'transferencia' CHECK (metodo_pago IN ('efectivo', 'transferencia', 'cheque', 'tarjeta')),
  referencia TEXT,
  comprobante_url TEXT,
  notas TEXT,
  registrado_por TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: parte_diario
-- =====================================================
DROP TABLE IF EXISTS parte_diario CASCADE;
CREATE TABLE parte_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_obra UUID REFERENCES obras(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  id_trabajador UUID REFERENCES usuarios(id),
  hora_llegada TIME,
  gps_llegada TEXT,
  hora_salida TIME,
  gps_salida TEXT,
  cantidad_ejecutada_real DECIMAL(10, 2),
  comentario_trabajador TEXT,
  fotos TEXT,
  firma_trabajador TEXT,
  validado_por_jefe_obra BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: avance_fisico
-- =====================================================
DROP TABLE IF EXISTS avance_fisico CASCADE;
CREATE TABLE avance_fisico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_actividad UUID REFERENCES planificacion_actividades(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  cantidad_ejecutada_acumulada DECIMAL(10, 2),
  porcentaje_avance_calculado DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: pagos_contrato
-- =====================================================
DROP TABLE IF EXISTS pagos_contrato CASCADE;
CREATE TABLE pagos_contrato (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_obra UUID REFERENCES obras(id) ON DELETE CASCADE,
  descripcion_hito TEXT NOT NULL,
  porcentaje DECIMAL(5, 2) NOT NULL,
  monto DECIMAL(15, 2) NOT NULL,
  fecha_comprometida DATE,
  fecha_pagada DATE,
  comprobante TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: tickets_cliente
-- =====================================================
DROP TABLE IF EXISTS tickets_cliente CASCADE;
CREATE TABLE tickets_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_obra UUID REFERENCES obras(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  mensaje_cliente TEXT NOT NULL,
  estado TEXT DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_curso', 'cerrado')),
  responsable_interno UUID REFERENCES usuarios(id),
  evidencia_foto TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUPABASE STORAGE: Bucket para fotos de avance
-- =====================================================

-- Crear el bucket (solo si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fotos-avance',
  'fotos-avance',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLÍTICAS DE ACCESO AL BUCKET fotos-avance
-- =====================================================

-- Permitir que cualquier usuario (anon) pueda SUBIR fotos
DROP POLICY IF EXISTS "Permitir subida anónima" ON storage.objects;
CREATE POLICY "Permitir subida anónima"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'fotos-avance');

-- Permitir que cualquier usuario (anon) pueda VER fotos (lectura pública)
DROP POLICY IF EXISTS "Lectura pública fotos" ON storage.objects;
CREATE POLICY "Lectura pública fotos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'fotos-avance');

-- Permitir actualizar fotos
DROP POLICY IF EXISTS "Permitir actualización" ON storage.objects;
CREATE POLICY "Permitir actualización"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'fotos-avance')
WITH CHECK (bucket_id = 'fotos-avance');

-- Permitir eliminar fotos
DROP POLICY IF EXISTS "Permitir eliminación" ON storage.objects;
CREATE POLICY "Permitir eliminación"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'fotos-avance');

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_asistencias_maestro ON asistencias(maestro_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_tarea ON asistencias(tarea_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_fotos_tarea ON fotos_avance(tarea_id);
CREATE INDEX IF NOT EXISTS idx_fotos_maestro ON fotos_avance(maestro_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_fotos_foto ON comentarios_fotos(foto_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_fotos_obra ON comentarios_fotos(obra_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_fotos_cliente ON comentarios_fotos(cliente_email);
CREATE INDEX IF NOT EXISTS idx_tickets_maestro ON tickets(maestro_id);
CREATE INDEX IF NOT EXISTS idx_tickets_obra ON tickets(obra_id);
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_payment_schedule_obra ON payment_schedule(obra_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedule_status ON payment_schedule(status);
CREATE INDEX IF NOT EXISTS idx_payments_obra ON payments(obra_id);
CREATE INDEX IF NOT EXISTS idx_payments_fecha ON payments(fecha_pago);
CREATE INDEX IF NOT EXISTS idx_tareas_obra ON tareas_diarias(id_obra);
CREATE INDEX IF NOT EXISTS idx_tareas_actividad ON tareas_diarias(id_actividad);

-- =====================================================
-- DATOS INICIALES - Usuario administrador
-- =====================================================
INSERT INTO usuarios (id, nombre, email, telefono, rol, es_admin) VALUES
('a1745908-1495-4c74-93d8-e2bd8c0b3a4d', 'Administrador Lithia', 'julian.gomez@grupolithia.cl', '+56912345678', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- DATOS INICIALES - 67 Actividades completas desde Excel
-- =====================================================
DELETE FROM planificacion_actividades;

-- Obras Preliminares (6)
INSERT INTO planificacion_actividades (nombre, etapa, subsistema, materiales, herramientas, unidad_medida, rendimiento_dia_hombre, sistema_aplicable, observaciones) VALUES
('OP-001: Replanteo de ejes con estacas y lienza', 'Obras preliminares', 'Replanteo', '["Estacas madera 2x2", "lienza"]'::jsonb, '["Huincha", "nivel manguera", "martillo"]'::jsonb, 'ml', 60, 'Todos', 'Verificar plano topográfico'),
('OP-002: Limpieza y despeje de terreno', 'Obras preliminares', 'Limpieza', '["Sacos para escombros"]'::jsonb, '["Pala", "carretilla", "guantes"]'::jsonb, 'm²', 80, 'Todos', 'Retiro a acopio temporal'),
('OP-003: Excavación manual para fundaciones corridas', 'Obras preliminares', 'Movimiento tierra', '[]'::jsonb, '["Pala", "picota", "carretilla"]'::jsonb, 'm³', 3, 'Radier / Pilotes', 'Profundidad según cálculo'),
('OP-004: Excavación puntual para pilotes', 'Obras preliminares', 'Movimiento tierra', '[]'::jsonb, '["Pala", "combo", "balde"]'::jsonb, 'ud', 6, 'Pilotes', 'Respetar diámetro de pilote'),
('OP-005: Compactación con placa vibratoria por capas', 'Obras preliminares', 'Compactación', '["Rebose de ripio o estabilizado"]'::jsonb, '["Placa vibratoria", "regadera"]'::jsonb, 'm²', 50, 'Todos', 'Capas de 20 cm máx.'),
('OP-006: Instalación de bodega y baño químico', 'Obras preliminares', 'Instalación de faenas', '["Paneles", "techumbre liviana"]'::jsonb, '["Taladro", "atornillador", "EPP"]'::jsonb, 'ud', 1, 'Todos', 'Coordinar punto eléctrico y agua'),

-- Fundaciones Radier (4)
('F-RAD-001: Armado de moldaje perimetral para radier', 'Fundaciones', 'Radier', '["Madera pino 1x4", "estacas"]'::jsonb, '["Martillo", "serrucho", "clavos"]'::jsonb, 'ml', 30, 'Radier', 'Aplomar esquinas'),
('F-RAD-002: Colocación de malla ACMA Q188', 'Fundaciones', 'Radier', '["Malla ACMA Q188"]'::jsonb, '["Alicate", "separadores plásticos"]'::jsonb, 'm²', 40, 'Radier', 'Traslapo 20 cm'),
('F-RAD-003: Vertido de hormigón H-20 y nivelación', 'Fundaciones', 'Radier', '["Hormigón H-20"]'::jsonb, '["Regla aluminio", "vibrador", "palas"]'::jsonb, 'm²', 20, 'Radier', 'Curado 7 días'),
('F-RAD-004: Instalación de pernos de anclaje M12', 'Fundaciones', 'Radier', '["Pernos de anclaje M12"]'::jsonb, '["Llave ajustable", "martillo"]'::jsonb, 'ud', 15, 'Radier', 'Revisar alineación con muro'),

-- Fundaciones Pilotes (3)
('F-PIL-001: Armado de estribos y jaula de pilote', 'Fundaciones', 'Pilotes hormigón', '["Fierro Ø10 mm"]'::jsonb, '["Alicate", "huincha", "mesa armado"]'::jsonb, 'ud', 8, 'Pilotes', 'Respetar recubrimiento'),
('F-PIL-002: Colado de pilote con vibrador', 'Fundaciones', 'Pilotes hormigón', '["Hormigón H-25"]'::jsonb, '["Vibrador", "balde", "embudo"]'::jsonb, 'ud', 5, 'Pilotes', 'Curado húmedo'),
('F-PIL-003: Colocación de viga de amarre sobre pilotes', 'Fundaciones', 'Pilotes hormigón', '["Hormigón H-20", "fierro Ø12"]'::jsonb, '["Nivel", "moldaje", "vibrador"]'::jsonb, 'ml', 8, 'Pilotes', 'Alinear con ejes de muros'),

-- Fundaciones Piso Elevado (3)
('F-PEM-001: Instalación de sobrecimientos/poyos para piso elevado', 'Fundaciones', 'Piso elevado', '["Hormigón H-20"]'::jsonb, '["Plomada", "nivel"]'::jsonb, 'ud', 10, 'Piso elevado', 'Separación según cálculo'),
('F-PEM-002: Montaje de vigas de piso en pino 2x8', 'Fundaciones', 'Piso elevado', '["Vigas pino estructural"]'::jsonb, '["Atornillador", "tornillos tirafondo"]'::jsonb, 'ml', 25, 'Piso elevado', 'Aplicar protector madera'),
('F-PEM-003: Instalación de entarimado OSB 18 mm', 'Fundaciones', 'Piso elevado', '["OSB estructural 18 mm"]'::jsonb, '["Atornillador", "tornillos punta broca"]'::jsonb, 'm²', 20, 'Piso elevado', 'Dejar junta 3 mm'),

-- Estructura Metalcom (5)
('EST-M-001: Corte de perfiles C90x30 mm según plano', 'Estructura', 'Metalcom', '["Perfil C90x30 mm"]'::jsonb, '["Esmeril angular", "disco corte"]'::jsonb, 'ml', 25, 'Metalcom', 'Cortes limpios'),
('EST-M-002: Anclaje de solera a sobrecimiento con tarugos', 'Estructura', 'Metalcom', '["Solera C90x30", "tarugos"]'::jsonb, '["Taladro percutor", "broca 8 mm"]'::jsonb, 'ml', 15, 'Metalcom / Radier', 'Cada 60 cm'),
('EST-M-003: Montaje de montantes cada 40 cm', 'Estructura', 'Metalcom', '["Montantes C90x30"]'::jsonb, '["Atornillador", "tornillo autoperforante 8x1½"]'::jsonb, 'm²', 12, 'Metalcom', 'Revisar plomo'),
('EST-M-004: Instalación de diagonales de rigidización', 'Estructura', 'Metalcom', '["Perfil C40"]'::jsonb, '["Atornillador", "escuadra"]'::jsonb, 'ml', 20, 'Metalcom', 'Obligatorio en muros largos'),
('EST-M-005: Fijación de OSB 11.1 mm a estructura', 'Estructura', 'Metalcom', '["OSB 11.1 mm"]'::jsonb, '["Atornillador", "tornillos cabeza trompeta"]'::jsonb, 'm²', 15, 'Metalcom / SIP', 'Separar 3 mm'),

-- Estructura Madera (3)
('EST-MAD-001: Corte de pies derechos pino seco 2x4', 'Estructura', 'Madera', '["Pino 2x4"]'::jsonb, '["Sierra circular", "EPP"]'::jsonb, 'ml', 30, 'Madera', 'Desfogue de humedad'),
('EST-MAD-002: Montaje de marco perimetral de muro', 'Estructura', 'Madera', '["Pino 2x4"]'::jsonb, '["Clavadora neumática", "compresor"]'::jsonb, 'm²', 10, 'Madera', 'Usar escuadras metálicas'),
('EST-MAD-003: Instalación de diafragma OSB 11.1 mm', 'Estructura', 'Madera', '["OSB 11.1 mm"]'::jsonb, '["Clavos helicoidales", "martillo"]'::jsonb, 'm²', 14, 'Madera', 'Clavar cada 15 cm'),

-- Muros y Tabiques (6)
('MT-001: Armado de tabique interior Metalcom 60x30', 'Muros y tabiques', 'Tabique interior', '["Perfil 60x30"]'::jsonb, '["Atornillador", "tijera hojalatero"]'::jsonb, 'm²', 12, 'Todos', 'A 40 cm eje-eje'),
('MT-002: Instalación de lana poliéster 50 mm', 'Muros y tabiques', 'Aislación', '["Lana poliéster Fixiterm 50 mm"]'::jsonb, '["Cúter", "guantes", "mascarilla"]'::jsonb, 'm²', 25, 'Todos', 'No comprimir lana'),
('MT-003: Instalación de yeso-cartón 10 mm', 'Muros y tabiques', 'Forro interior', '["Placa yeso-cartón 10 mm"]'::jsonb, '["Atornillador", "tornillo yeso 6x1"]'::jsonb, 'm²', 18, 'Todos', 'Juntas desencontradas'),
('MT-004: Aplicación de pasta en juntas y tornillos', 'Muros y tabiques', 'Empaste', '["Pasta de juntas"]'::jsonb, '["Espátula 4 pulgadas", "lija 180"]'::jsonb, 'm²', 30, 'Todos', '2 a 3 manos'),
('MT-005: Instalación de fibrocemento 6 mm en fachada', 'Muros y tabiques', 'Forro exterior', '["Placa fibrocemento 6 mm"]'::jsonb, '["Atornillador", "tornillo punta broca"]'::jsonb, 'm²', 12, 'Todos', 'Sellar uniones'),
('MT-006: Aplicación de membrana hidrófuga', 'Muros y tabiques', 'Barrera hídrica', '["Membrana hidrófuga"]'::jsonb, '["Cutter", "corchetera"]'::jsonb, 'm²', 35, 'Todos', 'Solape 10 cm'),

-- Aberturas (4)
('AB-001: Instalación de marco MDF interior', 'Aberturas', 'Puertas', '["Marco MDF"]'::jsonb, '["Nivel", "cuñas", "atornillador"]'::jsonb, 'ud', 4, 'Todos', 'Revisar plomo'),
('AB-002: Colocación de hoja puerta MDF', 'Aberturas', 'Puertas', '["Puerta MDF prensada"]'::jsonb, '["Taladro", "destornillador", "bisagras"]'::jsonb, 'ud', 6, 'Todos', '3 bisagras'),
('AB-003: Instalación de ventana termopanel PVC', 'Aberturas', 'Ventanas', '["Ventana PVC termopanel"]'::jsonb, '["Nivel", "espuma expansiva", "pistola silicona"]'::jsonb, 'ud', 3, 'Todos', 'Sellar perimetral'),
('AB-004: Instalación de chapas y manillas', 'Aberturas', 'Herrajes', '["Chapa", "manilla"]'::jsonb, '["Atornillador", "formón"]'::jsonb, 'ud', 10, 'Todos', 'Probar cierre'),

-- Techumbre (6)
('TCH-001: Montaje de cerchas metálicas en cumbrera', 'Techumbre', 'Cerchas', '["Cercha metálica"]'::jsonb, '["Andamio", "eslinga", "atornillador"]'::jsonb, 'ud', 4, 'Todos', 'Usar EPP altura'),
('TCH-002: Instalación de OSB 11.1 mm en techumbre', 'Techumbre', 'Cubierta', '["OSB 11.1 mm"]'::jsonb, '["Atornillador", "tornillos"]'::jsonb, 'm²', 15, 'Todos', 'Junta sobre cercha'),
('TCH-003: Colocación de fieltro asfáltico', 'Techumbre', 'Cubierta', '["Fieltro asfáltico"]'::jsonb, '["Cúter", "martillo", "clavos teja"]'::jsonb, 'm²', 30, 'Todos', 'Solape 10 cm'),
('TCH-004: Instalación de teja asfáltica IKO Cambridge', 'Techumbre', 'Cubierta', '["Teja asfáltica IKO"]'::jsonb, '["Martillo", "clavos para teja", "línea tiza"]'::jsonb, 'm²', 15, 'Todos', 'No instalar con lluvia'),
('TCH-005: Instalación de cielo yeso-cartón 10 mm', 'Techumbre', 'Cielos', '["Placa yeso-cartón 10 mm"]'::jsonb, '["Atornillador", "andamio", "tornillos yeso"]'::jsonb, 'm²', 16, 'Todos', 'Respetar modulación'),
('TCH-006: Colocación de cornisas EPS en cielo', 'Techumbre', 'Cornisas', '["Cornisas EPS"]'::jsonb, '["Caja de ingletes", "serrucho chico", "adhesivo de montaje", "sellador acrílico"]'::jsonb, 'ml', 25, 'Todos', 'Cortes a 45°'),

-- Terminaciones Interiores Pisos (8)
('TI-P-001: Colocación de cerámica 45x45 cm en piso', 'Terminaciones interiores', 'Piso cerámico', '["Cerámica 45x45"]'::jsonb, '["Cortadora cerámica", "llana dentada", "crucetas"]'::jsonb, 'm²', 12, 'Radier / Piso entarimado nivelado', 'Usar adhesivo Bekron DA'),
('TI-P-002: Instalación de porcelanato 60x60 rectificado', 'Terminaciones interiores', 'Piso porcelanato', '["Porcelanato 60x60"]'::jsonb, '["Cortador", "llana 10 mm", "crucetas niveladoras"]'::jsonb, 'm²', 10, 'Radier / Piso firme', 'Usar adhesivo porcelanato'),
('TI-P-003: Instalación de piso vinílico SPC click 5 mm', 'Terminaciones interiores', 'Piso vinílico', '["Piso SPC"]'::jsonb, '["Cutter", "martillo goma", "separadores"]'::jsonb, 'm²', 20, 'Radier / Piso entarimado', 'Base nivelada y limpia'),
('TI-P-004: Instalación de piso flotante laminado 8 mm', 'Terminaciones interiores', 'Piso flotante', '["Piso flotante laminado"]'::jsonb, '["Cutter", "serrucho inglete", "espuma base"]'::jsonb, 'm²', 18, 'Radier / Madera', 'Dejar junta perimetral 8 mm'),
('PISO-CER-BAÑO: Cerámica antideslizante en baño 33x33', 'Terminaciones interiores', 'Piso cerámico', '["Cerámica antideslizante"]'::jsonb, '["Cortadora", "llana dentada", "crucetas"]'::jsonb, 'm²', 10, 'Radier / Piso baño', 'Dejar pendiente a sumidero'),
('PISO-CER-COC: Cerámica cocina 45x45', 'Terminaciones interiores', 'Piso cerámico', '["Cerámica 45x45"]'::jsonb, '["Cortadora", "llana", "crucetas"]'::jsonb, 'm²', 11, 'Radier', 'Usar adhesivo flexible'),
('PISO-POR-LIV: Porcelanato en living 60x60', 'Terminaciones interiores', 'Piso porcelanato', '["Porcelanato 60x60"]'::jsonb, '["Cortadora", "niveladores", "mazo goma"]'::jsonb, 'm²', 10, 'Radier', 'Mantener juntas 2 mm'),
('PISO-VIN-DOR: Piso vinílico en dormitorio', 'Terminaciones interiores', 'Piso vinílico', '["Piso vinílico SPC"]'::jsonb, '["Cutter", "martillo goma", "separadores"]'::jsonb, 'm²', 20, 'Radier / Madera', 'Base limpia'),

-- Terminaciones Interiores Muros/Pintura (5)
('TI-M-001: Aplicación de pasta muro interior', 'Terminaciones interiores', 'Pintura', '["Pasta muro Ceresita"]'::jsonb, '["Espátula metálica", "lija 180"]'::jsonb, 'm²', 35, 'Todos', '2 manos'),
('TI-M-002: Pintura látex interior 1ª mano', 'Terminaciones interiores', 'Pintura', '["Pintura látex interior"]'::jsonb, '["Rodillo 1/2", "brocha 2 pulgadas", "bandeja"]'::jsonb, 'm²', 40, 'Todos', 'Diluir 10% agua'),
('TI-M-003: Pintura látex interior 2ª mano', 'Terminaciones interiores', 'Pintura', '["Pintura látex interior"]'::jsonb, '["Rodillo 1/2", "brocha 2 pulgadas"]'::jsonb, 'm²', 45, 'Todos', 'No pintar con humedad'),
('TI-M-004: Instalación de guardapolvos MDF 9 cm', 'Terminaciones interiores', 'Molduras', '["Guardapolvo MDF 9 cm"]'::jsonb, '["Ingleteadora", "clavos sin cabeza", "adhesivo"]'::jsonb, 'ml', 20, 'Todos', 'Sellar juntas'),
('PISO-FLO-DOR: Piso flotante en dormitorio', 'Terminaciones interiores', 'Piso flotante', '["Piso flotante 8 mm"]'::jsonb, '["Sierra inglete", "espuma base"]'::jsonb, 'm²', 18, 'Radier / Madera', 'Dejar dilatación'),

-- Terminaciones Exteriores (4)
('TE-001: Aplicación de basecoat sobre placa', 'Terminaciones exteriores', 'EIFS', '["Basecoat EIFS"]'::jsonb, '["Llana acero", "balde mezcla"]'::jsonb, 'm²', 25, 'Todos', 'Espesor uniforme'),
('TE-002: Colocación de malla fibra de vidrio', 'Terminaciones exteriores', 'EIFS', '["Malla fibra vidrio"]'::jsonb, '["Llana", "cortante"]'::jsonb, 'm²', 30, 'Todos', 'Solape 10 cm'),
('TE-003: Aplicación de revestimiento texturado', 'Terminaciones exteriores', 'Revestimiento', '["Revestimiento acrílico"]'::jsonb, '["Llana plástico", "rodillo"]'::jsonb, 'm²', 20, 'Todos', 'No aplicar bajo lluvia'),
('TE-004: Pintura elastomérica exterior', 'Terminaciones exteriores', 'Pintura', '["Pintura elastomérica"]'::jsonb, '["Rodillo exterior", "andamio"]'::jsonb, 'm²', 35, 'Todos', 'Sobre imprimación'),

-- Instalaciones Sanitarias (6)
('IS-001: Instalación de cañería PPR agua fría', 'Instalaciones sanitarias', 'Agua potable', '["Tubo PPR 20 mm"]'::jsonb, '["Soldadora PPR", "tijera corte", "EPP"]'::jsonb, 'ml', 25, 'Todos', 'Prueba de presión'),
('IS-002: Instalación de cañería PPR agua caliente', 'Instalaciones sanitarias', 'Agua potable', '["Tubo PPR 20 mm"]'::jsonb, '["Soldadora PPR", "tijera corte"]'::jsonb, 'ml', 25, 'Todos', 'Aislar en exterior'),
('IS-003: Instalación de tubo PVC 110 mm desagüe', 'Instalaciones sanitarias', 'Desagüe', '["Tubo PVC 110"]'::jsonb, '["Serrucho PVC", "pegamento", "lija"]'::jsonb, 'ml', 15, 'Todos', 'Pendiente 2%'),
('IS-004: Instalación de WC completo', 'Instalaciones sanitarias', 'Artefactos', '["WC con estanque"]'::jsonb, '["Llave inglesa", "teflón", "silicona"]'::jsonb, 'ud', 4, 'Todos', 'Probar fugas'),
('IS-005: Instalación de lavamanos y grifería', 'Instalaciones sanitarias', 'Artefactos', '["Lavamanos", "grifería"]'::jsonb, '["Llave ajustable", "teflón"]'::jsonb, 'ud', 5, 'Todos', 'Sellar con silicona'),
('IS-006: Instalación de caldera mural gas', 'Instalaciones sanitarias', 'Calefón / caldera', '["Caldera mural"]'::jsonb, '["Taladro", "tarugos", "llave gas", "detector fugas"]'::jsonb, 'ud', 2, 'Todos', 'Con maestro SEC'),

-- Instalaciones Eléctricas (5)
('IE-001: Instalación de tubo conduit PVC 20 mm', 'Instalaciones eléctricas', 'Canalización', '["Tubo PVC 20 mm"]'::jsonb, '["Serrucho", "pegamento PVC", "prensa"]'::jsonb, 'ml', 30, 'Todos', 'No dejar codos ciegos'),
('IE-002: Tendido de conductores THHN 2,5 mm²', 'Instalaciones eléctricas', 'Cableado', '["Cable THHN 2,5"]'::jsonb, '["Wincha pasa cable", "alicate"]'::jsonb, 'ml', 35, 'Todos', 'Identificar colores'),
('IE-003: Instalación de enchufes y interruptores', 'Instalaciones eléctricas', 'Artefactos', '["Enchufes", "interruptores"]'::jsonb, '["Destornillador", "tester"]'::jsonb, 'ud', 15, 'Todos', 'Probar continuidad'),
('IE-004: Instalación de tablero general y automáticos', 'Instalaciones eléctricas', 'Tablero', '["Tablero", "automáticos"]'::jsonb, '["Destornillador", "prensa terminales"]'::jsonb, 'ud', 1, 'Todos', 'Rotular circuitos'),
('IE-005: Instalación de luminarias LED empotradas', 'Instalaciones eléctricas', 'Iluminación', '["Luminaria LED"]'::jsonb, '["Taladro copa", "destornillador"]'::jsonb, 'ud', 10, 'Todos', 'Probar encendido'),

-- Obras Exteriores (4)
('OE-001: Instalación de malla ACMA sobre postes', 'Obras exteriores', 'Cierros', '["Malla ACMA"]'::jsonb, '["Alicate", "amarras", "combo"]'::jsonb, 'ml', 20, 'Todos', 'Postes a 2,5 m'),
('OE-002: Construcción de radier de acceso 10 cm', 'Obras exteriores', 'Radier exterior', '["Hormigón H-20", "malla"]'::jsonb, '["Regla", "paleta", "vibrador"]'::jsonb, 'm²', 15, 'Todos', 'Pendiente hacia exterior'),
('OE-003: Instalación de canaletas PVC y bajadas', 'Obras exteriores', 'Canaletas', '["Canaleta PVC", "bajadas"]'::jsonb, '["Taladro", "tornillos", "silicona"]'::jsonb, 'ml', 18, 'Todos', 'Probar escurrimiento'),
('OE-004: Colocación de pastelones 50x50', 'Obras exteriores', 'Paisajismo', '["Pastelones"]'::jsonb, '["Cuerda", "nivel", "goma"]'::jsonb, 'm²', 12, 'Todos', 'Base compactada');

-- =====================================================
-- FIN DEL SCHEMA
-- =====================================================
