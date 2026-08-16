-- Tabla de inventario para gestionar herramientas, implementos y materiales
CREATE TABLE IF NOT EXISTS inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('herramienta', 'implemento', 'material')),
  estatus TEXT DEFAULT 'activo' CHECK (estatus IN ('activo', 'inactivo')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_inventario_categoria ON inventario(categoria);
CREATE INDEX IF NOT EXISTS idx_inventario_estatus ON inventario(estatus);

-- Insertar datos de ejemplo
INSERT INTO inventario (nombre, categoria, estatus) VALUES
('Martillo', 'herramienta', 'activo'),
('Taladro', 'herramienta', 'activo'),
('Sierra circular', 'herramienta', 'activo'),
('Casco de seguridad', 'implemento', 'activo'),
('Guantes de trabajo', 'implemento', 'activo'),
('Chaleco reflectante', 'implemento', 'activo'),
('Cemento (saco 50kg)', 'material', 'activo'),
('Arena (m³)', 'material', 'activo'),
('Ladrillos (unidad)', 'material', 'activo'),
('Pintura (galón)', 'material', 'activo')
ON CONFLICT (id) DO NOTHING;
