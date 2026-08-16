-- =====================================================
-- TABLA: tareas_obra (Carta Gantt por obra)
-- Cada obra tiene su propio conjunto de tareas Gantt
-- =====================================================
DROP TABLE IF EXISTS tareas_obra CASCADE;

CREATE TABLE tareas_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_obra UUID NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  dias INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  dependencies TEXT DEFAULT '',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_tareas_obra_obra ON tareas_obra(id_obra);
CREATE INDEX IF NOT EXISTS idx_tareas_obra_dates ON tareas_obra(start_date, end_date);

-- Deshabilitar RLS para permitir operaciones desde la UI
ALTER TABLE tareas_obra DISABLE ROW LEVEL SECURITY;

-- Comentario
COMMENT ON TABLE tareas_obra IS 'Tareas del diagrama de Gantt asociadas a cada obra';
COMMENT ON COLUMN tareas_obra.task_id IS 'Identificador único de la tarea dentro del proyecto';
COMMENT ON COLUMN tareas_obra.dependencies IS 'IDs de tareas dependientes separados por comas';
COMMENT ON COLUMN tareas_obra.progress IS 'Porcentaje de avance de la tarea (0-100)';
