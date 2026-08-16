export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      asistencias: {
        Row: {
          created_at: string | null
          fecha_hora: string | null
          id: string
          latitud: number | null
          longitud: number | null
          maestro_id: string | null
          notas: string | null
          tarea_id: string | null
          tipo: string | null
          ubicacion_texto: string | null
        }
        Insert: {
          created_at?: string | null
          fecha_hora?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          maestro_id?: string | null
          notas?: string | null
          tarea_id?: string | null
          tipo?: string | null
          ubicacion_texto?: string | null
        }
        Update: {
          created_at?: string | null
          fecha_hora?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          maestro_id?: string | null
          notas?: string | null
          tarea_id?: string | null
          tipo?: string | null
          ubicacion_texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asistencias_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas_diarias"
            referencedColumns: ["id"]
          },
        ]
      }
      avance_fisico: {
        Row: {
          cantidad_ejecutada_acumulada: number | null
          created_at: string | null
          fecha: string
          id: string
          id_actividad: string | null
          porcentaje_avance_calculado: number | null
        }
        Insert: {
          cantidad_ejecutada_acumulada?: number | null
          created_at?: string | null
          fecha: string
          id?: string
          id_actividad?: string | null
          porcentaje_avance_calculado?: number | null
        }
        Update: {
          cantidad_ejecutada_acumulada?: number | null
          created_at?: string | null
          fecha?: string
          id?: string
          id_actividad?: string | null
          porcentaje_avance_calculado?: number | null
        }
        Relationships: []
      }
      comentarios_fotos: {
        Row: {
          cliente_email: string
          comentario: string
          fecha: string | null
          foto_id: string
          id: string
          leido: boolean | null
          obra_id: string
        }
        Insert: {
          cliente_email: string
          comentario: string
          fecha?: string | null
          foto_id: string
          id?: string
          leido?: boolean | null
          obra_id: string
        }
        Update: {
          cliente_email?: string
          comentario?: string
          fecha?: string | null
          foto_id?: string
          id?: string
          leido?: boolean | null
          obra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_fotos_foto_id_fkey"
            columns: ["foto_id"]
            isOneToOne: false
            referencedRelation: "fotos_avance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_fotos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_avance: {
        Row: {
          created_at: string | null
          descripcion: string | null
          fecha_hora: string | null
          id: string
          latitud: number | null
          longitud: number | null
          maestro_id: string | null
          tarea_id: string | null
          url_foto: string
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          fecha_hora?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          maestro_id?: string | null
          tarea_id?: string | null
          url_foto: string
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          fecha_hora?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          maestro_id?: string | null
          tarea_id?: string | null
          url_foto?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_avance_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_avance_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas_diarias"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario: {
        Row: {
          categoria: string
          created_at: string | null
          estatus: string | null
          id: string
          nombre: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          estatus?: string | null
          id?: string
          nombre: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          estatus?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      mensajes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          leido: boolean | null
          obra_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          leido?: boolean | null
          obra_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          leido?: boolean | null
          obra_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          created_at: string | null
          direccion: string
          estado: string | null
          fecha_fin_plan: string
          fecha_inicio_plan: string
          geo_lat: number | null
          geo_lng: number | null
          id: string
          id_cliente: string | null
          id_jefe_obra: string | null
          monto_contrato: number
          nombre_obra: string
        }
        Insert: {
          created_at?: string | null
          direccion: string
          estado?: string | null
          fecha_fin_plan: string
          fecha_inicio_plan: string
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          id_cliente?: string | null
          id_jefe_obra?: string | null
          monto_contrato: number
          nombre_obra: string
        }
        Update: {
          created_at?: string | null
          direccion?: string
          estado?: string | null
          fecha_fin_plan?: string
          fecha_inicio_plan?: string
          geo_lat?: number | null
          geo_lng?: number | null
          id?: string
          id_cliente?: string | null
          id_jefe_obra?: string | null
          monto_contrato?: number
          nombre_obra?: string
        }
        Relationships: [
          {
            foreignKeyName: "obras_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_id_jefe_obra_fkey"
            columns: ["id_jefe_obra"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos_contrato: {
        Row: {
          comprobante: string | null
          created_at: string | null
          descripcion_hito: string
          estado: string | null
          fecha_comprometida: string | null
          fecha_pagada: string | null
          id: string
          id_obra: string | null
          monto: number
          porcentaje: number | null
        }
        Insert: {
          comprobante?: string | null
          created_at?: string | null
          descripcion_hito: string
          estado?: string | null
          fecha_comprometida?: string | null
          fecha_pagada?: string | null
          id?: string
          id_obra?: string | null
          monto: number
          porcentaje?: number | null
        }
        Update: {
          comprobante?: string | null
          created_at?: string | null
          descripcion_hito?: string
          estado?: string | null
          fecha_comprometida?: string | null
          fecha_pagada?: string | null
          id?: string
          id_obra?: string | null
          monto?: number
          porcentaje?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_contrato_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      parte_diario: {
        Row: {
          cantidad_ejecutada_real: number | null
          comentario_trabajador: string | null
          created_at: string | null
          fecha: string
          firma_trabajador: string | null
          fotos: string[] | null
          gps_llegada_lat: number | null
          gps_llegada_lng: number | null
          gps_salida_lat: number | null
          gps_salida_lng: number | null
          hora_llegada: string | null
          hora_salida: string | null
          id: string
          id_obra: string | null
          id_tarea: string | null
          id_trabajador: string | null
          validado_por_jefe_obra: boolean | null
        }
        Insert: {
          cantidad_ejecutada_real?: number | null
          comentario_trabajador?: string | null
          created_at?: string | null
          fecha: string
          firma_trabajador?: string | null
          fotos?: string[] | null
          gps_llegada_lat?: number | null
          gps_llegada_lng?: number | null
          gps_salida_lat?: number | null
          gps_salida_lng?: number | null
          hora_llegada?: string | null
          hora_salida?: string | null
          id?: string
          id_obra?: string | null
          id_tarea?: string | null
          id_trabajador?: string | null
          validado_por_jefe_obra?: boolean | null
        }
        Update: {
          cantidad_ejecutada_real?: number | null
          comentario_trabajador?: string | null
          created_at?: string | null
          fecha?: string
          firma_trabajador?: string | null
          fotos?: string[] | null
          gps_llegada_lat?: number | null
          gps_llegada_lng?: number | null
          gps_salida_lat?: number | null
          gps_salida_lng?: number | null
          hora_llegada?: string | null
          hora_salida?: string | null
          id?: string
          id_obra?: string | null
          id_tarea?: string | null
          id_trabajador?: string | null
          validado_por_jefe_obra?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "parte_diario_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parte_diario_id_tarea_fkey"
            columns: ["id_tarea"]
            isOneToOne: false
            referencedRelation: "tareas_diarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parte_diario_id_trabajador_fkey"
            columns: ["id_trabajador"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedule: {
        Row: {
          concepto: string
          created_at: string | null
          fecha_estimada: string | null
          id: string
          monto: number
          notas: string | null
          obra_id: string | null
          payment_number: number
          porcentaje: number | null
          status: string | null
        }
        Insert: {
          concepto: string
          created_at?: string | null
          fecha_estimada?: string | null
          id?: string
          monto: number
          notas?: string | null
          obra_id?: string | null
          payment_number: number
          porcentaje?: number | null
          status?: string | null
        }
        Update: {
          concepto?: string
          created_at?: string | null
          fecha_estimada?: string | null
          id?: string
          monto?: number
          notas?: string | null
          obra_id?: string | null
          payment_number?: number
          porcentaje?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedule_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          comprobante_url: string | null
          created_at: string | null
          fecha_pago: string | null
          id: string
          metodo_pago: string | null
          monto: number
          notas: string | null
          obra_id: string | null
          payment_schedule_id: string | null
          referencia: string | null
          registrado_por: string | null
        }
        Insert: {
          comprobante_url?: string | null
          created_at?: string | null
          fecha_pago?: string | null
          id?: string
          metodo_pago?: string | null
          monto: number
          notas?: string | null
          obra_id?: string | null
          payment_schedule_id?: string | null
          referencia?: string | null
          registrado_por?: string | null
        }
        Update: {
          comprobante_url?: string | null
          created_at?: string | null
          fecha_pago?: string | null
          id?: string
          metodo_pago?: string | null
          monto?: number
          notas?: string | null
          obra_id?: string | null
          payment_schedule_id?: string | null
          referencia?: string | null
          registrado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_schedule_id_fkey"
            columns: ["payment_schedule_id"]
            isOneToOne: false
            referencedRelation: "payment_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      planificacion_actividades: {
        Row: {
          created_at: string | null
          descripcion: string | null
          etapa: string | null
          herramientas: Json | null
          id: string
          insumos: Json | null
          materiales: Json | null
          nombre: string
          observaciones: string | null
          rendimiento_dia_hombre: number | null
          sistema_aplicable: string | null
          subsistema: string | null
          unidad_medida: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          etapa?: string | null
          herramientas?: Json | null
          id?: string
          insumos?: Json | null
          materiales?: Json | null
          nombre: string
          observaciones?: string | null
          rendimiento_dia_hombre?: number | null
          sistema_aplicable?: string | null
          subsistema?: string | null
          unidad_medida?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          etapa?: string | null
          herramientas?: Json | null
          id?: string
          insumos?: Json | null
          materiales?: Json | null
          nombre?: string
          observaciones?: string | null
          rendimiento_dia_hombre?: number | null
          sistema_aplicable?: string | null
          subsistema?: string | null
          unidad_medida?: string | null
        }
        Relationships: []
      }
      tareas_diarias: {
        Row: {
          created_at: string | null
          descripcion_trabajo: string
          estado: string | null
          fecha_asignada: string
          herramientas: Json | null
          id: string
          id_actividad: string | null
          id_obra: string | null
          insumos: Json | null
          materiales: Json | null
          meta_cantidad: number | null
          observaciones_seguridad_calidad: string | null
          recursos_necesarios: string | null
          responsable_trabajador: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion_trabajo: string
          estado?: string | null
          fecha_asignada: string
          herramientas?: Json | null
          id?: string
          id_actividad?: string | null
          id_obra?: string | null
          insumos?: Json | null
          materiales?: Json | null
          meta_cantidad?: number | null
          observaciones_seguridad_calidad?: string | null
          recursos_necesarios?: string | null
          responsable_trabajador?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion_trabajo?: string
          estado?: string | null
          fecha_asignada?: string
          herramientas?: Json | null
          id?: string
          id_actividad?: string | null
          id_obra?: string | null
          insumos?: Json | null
          materiales?: Json | null
          meta_cantidad?: number | null
          observaciones_seguridad_calidad?: string | null
          recursos_necesarios?: string | null
          responsable_trabajador?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tareas_diarias_id_actividad_fkey"
            columns: ["id_actividad"]
            isOneToOne: false
            referencedRelation: "planificacion_actividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_diarias_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_diarias_responsable_trabajador_fkey"
            columns: ["responsable_trabajador"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas_obra: {
        Row: {
          created_at: string | null
          dependencies: string | null
          dias: number | null
          end_date: string
          id: string
          id_obra: string
          name: string
          notas: string | null
          progress: number | null
          start_date: string
          task_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dependencies?: string | null
          dias?: number | null
          end_date: string
          id?: string
          id_obra: string
          name: string
          notas?: string | null
          progress?: number | null
          start_date: string
          task_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dependencies?: string | null
          dias?: number | null
          end_date?: string
          id?: string
          id_obra?: string
          name?: string
          notas?: string | null
          progress?: number | null
          start_date?: string
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tareas_obra_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          cliente_id: string | null
          estado: string | null
          fecha_actualizacion: string | null
          fecha_creacion: string | null
          fecha_resolucion: string | null
          foto_id: string | null
          foto_respuesta: string | null
          id: string
          maestro_id: string | null
          obra_id: string | null
          observacion: string
          prioridad: string | null
          respuesta_maestro: string | null
        }
        Insert: {
          cliente_id?: string | null
          estado?: string | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          fecha_resolucion?: string | null
          foto_id?: string | null
          foto_respuesta?: string | null
          id?: string
          maestro_id?: string | null
          obra_id?: string | null
          observacion: string
          prioridad?: string | null
          respuesta_maestro?: string | null
        }
        Update: {
          cliente_id?: string | null
          estado?: string | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          fecha_resolucion?: string | null
          foto_id?: string | null
          foto_respuesta?: string | null
          id?: string
          maestro_id?: string | null
          obra_id?: string | null
          observacion?: string
          prioridad?: string | null
          respuesta_maestro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_foto_id_fkey"
            columns: ["foto_id"]
            isOneToOne: false
            referencedRelation: "fotos_avance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_maestro_id_fkey"
            columns: ["maestro_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets_cliente: {
        Row: {
          created_at: string | null
          estado: string | null
          evidencia_foto: string | null
          fecha: string
          id: string
          id_obra: string | null
          mensaje_cliente: string
          responsable_interno: string | null
          respuesta: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          evidencia_foto?: string | null
          fecha: string
          id?: string
          id_obra?: string | null
          mensaje_cliente: string
          responsable_interno?: string | null
          respuesta?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          evidencia_foto?: string | null
          fecha?: string
          id?: string
          id_obra?: string | null
          mensaje_cliente?: string
          responsable_interno?: string | null
          respuesta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_cliente_id_obra_fkey"
            columns: ["id_obra"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_cliente_responsable_interno_fkey"
            columns: ["responsable_interno"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          apellido: string | null
          auth_id: string | null
          created_at: string | null
          email: string
          es_admin: boolean | null
          especialidad: string | null
          id: string
          nombre: string
          rol: string
          rut: string | null
          telefono: string | null
        }
        Insert: {
          apellido?: string | null
          auth_id?: string | null
          created_at?: string | null
          email: string
          es_admin?: boolean | null
          especialidad?: string | null
          id?: string
          nombre: string
          rol: string
          rut?: string | null
          telefono?: string | null
        }
        Update: {
          apellido?: string | null
          auth_id?: string | null
          created_at?: string | null
          email?: string
          es_admin?: boolean | null
          especialidad?: string | null
          id?: string
          nombre?: string
          rol?: string
          rut?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth_users: {
        Args: {
          page_limit?: number
          page_offset?: number
          search_email?: string
        }
        Returns: {
          created_at: string
          email: string
          email_confirmed_at: string
          id: string
          last_sign_in_at: string
          total_count: number
        }[]
      }
      get_storage_buckets: {
        Args: never
        Returns: {
          allowed_mime_types: string[]
          avif_autodetection: boolean
          created_at: string
          file_size_limit: number
          id: string
          name: string
          owner: string
          public: boolean
          updated_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
