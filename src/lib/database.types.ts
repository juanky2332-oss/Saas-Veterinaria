// Generado por: supabase gen types typescript --project-id gfhavjcadkjuyyywnxsf
// Proyecto Clinicomatic (multi-tenant). Regenerar tras cada migración.

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      affiliates: {
        Row: {
          codigo: string
          comision_pct: number
          created_at: string
          datos_pago: Json | null
          email: string
          estado: string
          id: string
          nombre: string
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          codigo: string
          comision_pct?: number
          created_at?: string
          datos_pago?: Json | null
          email: string
          estado?: string
          id?: string
          nombre: string
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          codigo?: string
          comision_pct?: number
          created_at?: string
          datos_pago?: Json | null
          email?: string
          estado?: string
          id?: string
          nombre?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          affiliate_id: string
          comision: number
          confirmado_at: string | null
          created_at: string
          estado: string
          id: string
          importe_mrr: number
          organization_id: string | null
          plan: string | null
        }
        Insert: {
          affiliate_id: string
          comision?: number
          confirmado_at?: string | null
          created_at?: string
          estado?: string
          id?: string
          importe_mrr?: number
          organization_id?: string | null
          plan?: string | null
        }
        Update: {
          affiliate_id?: string
          comision?: number
          confirmado_at?: string | null
          created_at?: string
          estado?: string
          id?: string
          importe_mrr?: number
          organization_id?: string | null
          plan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          affiliate_id: string
          created_at: string
          estado: string
          id: string
          importe: number
          pagado_at: string | null
          periodo: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          estado?: string
          id?: string
          importe: number
          pagado_at?: string | null
          periodo?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          estado?: string
          id?: string
          importe?: number
          pagado_at?: string | null
          periodo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          orden: number
          slug: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          orden?: number
          slug: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          orden?: number
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          ai_brief: Json | null
          ai_generated: boolean
          ai_model: string | null
          category_id: string | null
          contenido_html: string | null
          created_at: string
          created_by: string | null
          excerpt: string | null
          featured_image_alt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          reading_time_min: number
          scheduled_at: string | null
          secondary_keywords: string[]
          slug: string
          status: string
          tags: string[]
          target_keyword: string | null
          titulo: string
          updated_at: string
          view_count: number
        }
        Insert: {
          ai_brief?: Json | null
          ai_generated?: boolean
          ai_model?: string | null
          category_id?: string | null
          contenido_html?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_min?: number
          scheduled_at?: string | null
          secondary_keywords?: string[]
          slug: string
          status?: string
          tags?: string[]
          target_keyword?: string | null
          titulo: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          ai_brief?: Json | null
          ai_generated?: boolean
          ai_model?: string | null
          category_id?: string | null
          contenido_html?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_min?: number
          scheduled_at?: string | null
          secondary_keywords?: string[]
          slug?: string
          status?: string
          tags?: string[]
          target_keyword?: string | null
          titulo?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          diagnostico: string | null
          doctora_id: string | null
          fecha: string
          id: string
          observaciones: string | null
          organization_id: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          diagnostico?: string | null
          doctora_id?: string | null
          fecha?: string
          id?: string
          observaciones?: string | null
          organization_id?: string
          patient_id: string
        }
        Update: {
          created_at?: string
          diagnostico?: string | null
          doctora_id?: string | null
          fecha?: string
          id?: string
          observaciones?: string | null
          organization_id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_doctora_id_fkey"
            columns: ["doctora_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_items: {
        Row: {
          cantidad: string | null
          duracion: string | null
          id: string
          medicamento: string
          observaciones: string | null
          organization_id: string
          posologia: string | null
          recipe_id: string
        }
        Insert: {
          cantidad?: string | null
          duracion?: string | null
          id?: string
          medicamento: string
          observaciones?: string | null
          organization_id?: string
          posologia?: string | null
          recipe_id: string
        }
        Update: {
          cantidad?: string | null
          duracion?: string | null
          id?: string
          medicamento?: string
          observaciones?: string | null
          organization_id?: string
          posologia?: string | null
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_calls: {
        Row: {
          created_at: string
          direccion: string
          duracion_seg: number | null
          ended_at: string | null
          estado: string
          from_number: string | null
          grabacion_url: string | null
          id: string
          organization_id: string
          patient_id: string | null
          resumen: string | null
          retell_call_id: string | null
          sentimiento: string | null
          to_number: string | null
          transcripcion: string | null
        }
        Insert: {
          created_at?: string
          direccion?: string
          duracion_seg?: number | null
          ended_at?: string | null
          estado?: string
          from_number?: string | null
          grabacion_url?: string | null
          id?: string
          organization_id?: string
          patient_id?: string | null
          resumen?: string | null
          retell_call_id?: string | null
          sentimiento?: string | null
          to_number?: string | null
          transcripcion?: string | null
        }
        Update: {
          created_at?: string
          direccion?: string
          duracion_seg?: number | null
          ended_at?: string | null
          estado?: string
          from_number?: string | null
          grabacion_url?: string | null
          id?: string
          organization_id?: string
          patient_id?: string | null
          resumen?: string | null
          retell_call_id?: string | null
          sentimiento?: string | null
          to_number?: string | null
          transcripcion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_calls_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      mutuas: {
        Row: {
          activo: boolean
          cif: string | null
          condiciones: string | null
          created_at: string
          descuento_pct: number | null
          email: string | null
          id: string
          nombre: string
          organization_id: string
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          cif?: string | null
          condiciones?: string | null
          created_at?: string
          descuento_pct?: number | null
          email?: string | null
          id?: string
          nombre: string
          organization_id?: string
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          cif?: string | null
          condiciones?: string | null
          created_at?: string
          descuento_pct?: number | null
          email?: string | null
          id?: string
          nombre?: string
          organization_id?: string
          telefono?: string | null
        }
        Relationships: []
      }
      proveedores: {
        Row: {
          activo: boolean
          categoria: string | null
          cif: string | null
          contacto: string | null
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          notas: string | null
          organization_id: string
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          categoria?: string | null
          cif?: string | null
          contacto?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          organization_id?: string
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          categoria?: string | null
          cif?: string | null
          contacto?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          organization_id?: string
          telefono?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          cliente_direccion: string | null
          cliente_nif: string | null
          cliente_nombre: string
          created_at: string
          estado: string
          fecha: string
          id: string
          invoice_id: string | null
          iva_total: number
          notas: string | null
          numero: string
          organization_id: string
          patient_id: string | null
          subtotal: number
          total: number
          updated_at: string
          validez: string | null
        }
        Insert: {
          cliente_direccion?: string | null
          cliente_nif?: string | null
          cliente_nombre: string
          created_at?: string
          estado?: string
          fecha?: string
          id?: string
          invoice_id?: string | null
          iva_total?: number
          notas?: string | null
          numero: string
          organization_id?: string
          patient_id?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          validez?: string | null
        }
        Update: {
          cliente_direccion?: string | null
          cliente_nif?: string | null
          cliente_nombre?: string
          created_at?: string
          estado?: string
          fecha?: string
          id?: string
          invoice_id?: string | null
          iva_total?: number
          notas?: string | null
          numero?: string
          organization_id?: string
          patient_id?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          validez?: string | null
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          cantidad: number
          descripcion: string
          descuento_pct: number
          id: string
          importe: number
          iva_pct: number
          organization_id: string
          precio_unitario: number
          quote_id: string
        }
        Insert: {
          cantidad?: number
          descripcion: string
          descuento_pct?: number
          id?: string
          importe?: number
          iva_pct?: number
          organization_id?: string
          precio_unitario?: number
          quote_id: string
        }
        Update: {
          cantidad?: number
          descripcion?: string
          descuento_pct?: number
          id?: string
          importe?: number
          iva_pct?: number
          organization_id?: string
          precio_unitario?: number
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      bonos: {
        Row: {
          caducidad: string | null
          created_at: string
          estado: string
          fecha_compra: string
          id: string
          nombre: string
          notas: string | null
          organization_id: string
          patient_id: string
          precio: number
          sesiones_total: number
          sesiones_usadas: number
          treatment_id: string | null
        }
        Insert: {
          caducidad?: string | null
          created_at?: string
          estado?: string
          fecha_compra?: string
          id?: string
          nombre: string
          notas?: string | null
          organization_id?: string
          patient_id: string
          precio?: number
          sesiones_total?: number
          sesiones_usadas?: number
          treatment_id?: string | null
        }
        Update: {
          caducidad?: string | null
          created_at?: string
          estado?: string
          fecha_compra?: string
          id?: string
          nombre?: string
          notas?: string | null
          organization_id?: string
          patient_id?: string
          precio?: number
          sesiones_total?: number
          sesiones_usadas?: number
          treatment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bonos_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      bono_tipos: {
        Row: {
          activo: boolean
          caducidad_meses: number | null
          created_at: string
          id: string
          nombre: string
          organization_id: string
          precio: number
          sesiones: number
          treatment_id: string | null
        }
        Insert: {
          activo?: boolean
          caducidad_meses?: number | null
          created_at?: string
          id?: string
          nombre: string
          organization_id?: string
          precio?: number
          sesiones?: number
          treatment_id?: string | null
        }
        Update: {
          activo?: boolean
          caducidad_meses?: number | null
          created_at?: string
          id?: string
          nombre?: string
          organization_id?: string
          precio?: number
          sesiones?: number
          treatment_id?: string | null
        }
        Relationships: []
      }
      bono_consumos: {
        Row: {
          appointment_id: string | null
          bono_id: string
          created_at: string
          fecha: string
          id: string
          notas: string | null
          organization_id: string
        }
        Insert: {
          appointment_id?: string | null
          bono_id: string
          created_at?: string
          fecha?: string
          id?: string
          notas?: string | null
          organization_id?: string
        }
        Update: {
          appointment_id?: string | null
          bono_id?: string
          created_at?: string
          fecha?: string
          id?: string
          notas?: string | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bono_consumos_bono_id_fkey"
            columns: ["bono_id"]
            isOneToOne: false
            referencedRelation: "bonos"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          abierta_por: string | null
          apertura: number
          cierre: number | null
          closed_at: string | null
          created_at: string
          estado: string
          fecha: string
          id: string
          notas: string | null
          organization_id: string
        }
        Insert: {
          abierta_por?: string | null
          apertura?: number
          cierre?: number | null
          closed_at?: string | null
          created_at?: string
          estado?: string
          fecha?: string
          id?: string
          notas?: string | null
          organization_id?: string
        }
        Update: {
          abierta_por?: string | null
          apertura?: number
          cierre?: number | null
          closed_at?: string | null
          created_at?: string
          estado?: string
          fecha?: string
          id?: string
          notas?: string | null
          organization_id?: string
        }
        Relationships: []
      }
      cash_movements: {
        Row: {
          concepto: string
          created_at: string
          fecha: string
          id: string
          importe: number
          invoice_id: string | null
          metodo: string
          organization_id: string
          patient_id: string | null
          session_id: string | null
          tipo: string
        }
        Insert: {
          concepto: string
          created_at?: string
          fecha?: string
          id?: string
          importe: number
          invoice_id?: string | null
          metodo?: string
          organization_id?: string
          patient_id?: string | null
          session_id?: string | null
          tipo?: string
        }
        Update: {
          concepto?: string
          created_at?: string
          fecha?: string
          id?: string
          importe?: number
          invoice_id?: string | null
          metodo?: string
          organization_id?: string
          patient_id?: string | null
          session_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cuotas: {
        Row: {
          activo: boolean
          concepto: string
          created_at: string
          id: string
          importe: number
          metodo: string | null
          organization_id: string
          patient_id: string | null
          periodicidad: string
          proximo_cobro: string | null
        }
        Insert: {
          activo?: boolean
          concepto: string
          created_at?: string
          id?: string
          importe: number
          metodo?: string | null
          organization_id?: string
          patient_id?: string | null
          periodicidad?: string
          proximo_cobro?: string | null
        }
        Update: {
          activo?: boolean
          concepto?: string
          created_at?: string
          id?: string
          importe?: number
          metodo?: string | null
          organization_id?: string
          patient_id?: string | null
          periodicidad?: string
          proximo_cobro?: string | null
        }
        Relationships: []
      }
      billing_settings: {
        Row: {
          color_documento: string | null
          direccion: string | null
          iva_default: number
          nif: string | null
          organization_id: string
          pie_documento: string | null
          plantilla: string
          proximo_numero: number
          razon_social: string | null
          serie: string
          updated_at: string
          verifacti_enabled: boolean
        }
        Insert: {
          color_documento?: string | null
          direccion?: string | null
          iva_default?: number
          nif?: string | null
          organization_id?: string
          pie_documento?: string | null
          plantilla?: string
          proximo_numero?: number
          razon_social?: string | null
          serie?: string
          updated_at?: string
          verifacti_enabled?: boolean
        }
        Update: {
          color_documento?: string | null
          direccion?: string | null
          iva_default?: number
          nif?: string | null
          organization_id?: string
          pie_documento?: string | null
          plantilla?: string
          proximo_numero?: number
          razon_social?: string | null
          serie?: string
          updated_at?: string
          verifacti_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "billing_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          cliente_direccion: string | null
          cliente_nif: string | null
          cliente_nombre: string
          created_at: string
          estado: string
          fecha: string
          forma_pago: string | null
          id: string
          iva_total: number
          notas: string | null
          numero: string
          organization_id: string
          patient_id: string | null
          rectifica_id: string | null
          subtotal: number
          tipo: string
          total: number
          updated_at: string
          vencimiento: string | null
          verifacti_enviado_at: string | null
          verifacti_estado: string | null
          verifacti_id: string | null
          verifacti_qr: string | null
          verifacti_url: string | null
        }
        Insert: {
          cliente_direccion?: string | null
          cliente_nif?: string | null
          cliente_nombre: string
          created_at?: string
          estado?: string
          fecha?: string
          forma_pago?: string | null
          id?: string
          iva_total?: number
          notas?: string | null
          numero: string
          organization_id?: string
          patient_id?: string | null
          rectifica_id?: string | null
          subtotal?: number
          tipo?: string
          total?: number
          updated_at?: string
          vencimiento?: string | null
          verifacti_enviado_at?: string | null
          verifacti_estado?: string | null
          verifacti_id?: string | null
          verifacti_qr?: string | null
          verifacti_url?: string | null
        }
        Update: {
          cliente_direccion?: string | null
          cliente_nif?: string | null
          cliente_nombre?: string
          created_at?: string
          estado?: string
          fecha?: string
          forma_pago?: string | null
          id?: string
          iva_total?: number
          notas?: string | null
          numero?: string
          organization_id?: string
          patient_id?: string | null
          rectifica_id?: string | null
          subtotal?: number
          tipo?: string
          total?: number
          updated_at?: string
          vencimiento?: string | null
          verifacti_enviado_at?: string | null
          verifacti_estado?: string | null
          verifacti_id?: string | null
          verifacti_qr?: string | null
          verifacti_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          cantidad: number
          descripcion: string
          descuento_pct: number
          id: string
          importe: number
          invoice_id: string
          iva_pct: number
          organization_id: string
          precio_unitario: number
        }
        Insert: {
          cantidad?: number
          descripcion: string
          descuento_pct?: number
          id?: string
          importe?: number
          invoice_id: string
          iva_pct?: number
          organization_id?: string
          precio_unitario?: number
        }
        Update: {
          cantidad?: number
          descripcion?: string
          descuento_pct?: number
          id?: string
          importe?: number
          invoice_id?: string
          iva_pct?: number
          organization_id?: string
          precio_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_integrations: {
        Row: {
          activo: boolean
          config: Json
          created_at: string
          external_id: string | null
          id: string
          organization_id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          config?: Json
          created_at?: string
          external_id?: string | null
          id?: string
          organization_id?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          config?: Json
          created_at?: string
          external_id?: string | null
          id?: string
          organization_id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          activo: boolean
          created_at: string
          hash_key: string
          id: string
          nombre: string
          organization_id: string
          scopes: string[]
          ultima_uso_at: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          hash_key: string
          id?: string
          nombre: string
          organization_id?: string
          scopes?: string[]
          ultima_uso_at?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          hash_key?: string
          id?: string
          nombre?: string
          organization_id?: string
          scopes?: string[]
          ultima_uso_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          doctora_id: string
          estado: Database["public"]["Enums"]["estado_cita"]
          fin: string
          id: string
          inicio: string
          notas: string | null
          organization_id: string
          origen: Database["public"]["Enums"]["origen_cita"]
          patient_id: string
          sala: number
          treatment_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctora_id: string
          estado?: Database["public"]["Enums"]["estado_cita"]
          fin: string
          id?: string
          inicio: string
          notas?: string | null
          organization_id: string
          origen?: Database["public"]["Enums"]["origen_cita"]
          patient_id: string
          sala?: number
          treatment_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctora_id?: string
          estado?: Database["public"]["Enums"]["estado_cita"]
          fin?: string
          id?: string
          inicio?: string
          notas?: string | null
          organization_id?: string
          origen?: Database["public"]["Enums"]["origen_cita"]
          patient_id?: string
          sala?: number
          treatment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctora_id_fkey"
            columns: ["doctora_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          accion: string
          creado_at: string
          detalle: Json | null
          entidad: string
          entidad_id: string | null
          id: string
          organization_id: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          creado_at?: string
          detalle?: Json | null
          entidad: string
          entidad_id?: string | null
          id?: string
          organization_id: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          creado_at?: string
          detalle?: Json | null
          entidad?: string
          entidad_id?: string | null
          id?: string
          organization_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_reports: {
        Row: {
          appointment_id: string | null
          contenido: Json
          created_at: string
          doctora_id: string
          firmado_at: string | null
          id: string
          organization_id: string
          patient_id: string
          transcripcion_origen: Database["public"]["Enums"]["transcripcion_origen"]
          updated_at: string
          version: number
        }
        Insert: {
          appointment_id?: string | null
          contenido?: Json
          created_at?: string
          doctora_id: string
          firmado_at?: string | null
          id?: string
          organization_id: string
          patient_id: string
          transcripcion_origen?: Database["public"]["Enums"]["transcripcion_origen"]
          updated_at?: string
          version?: number
        }
        Update: {
          appointment_id?: string | null
          contenido?: Json
          created_at?: string
          doctora_id?: string
          firmado_at?: string | null
          id?: string
          organization_id?: string
          patient_id?: string
          transcripcion_origen?: Database["public"]["Enums"]["transcripcion_origen"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinical_reports_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_reports_doctora_id_fkey"
            columns: ["doctora_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_templates: {
        Row: {
          activo: boolean
          archivo_path: string | null
          created_at: string
          cuerpo_richtext: string
          especialidad: string | null
          id: string
          organization_id: string
          tipo: string
          titulo: string
          updated_at: string
          variables: Json
        }
        Insert: {
          activo?: boolean
          archivo_path?: string | null
          created_at?: string
          cuerpo_richtext?: string
          especialidad?: string | null
          id?: string
          organization_id?: string
          tipo?: string
          titulo: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          activo?: boolean
          archivo_path?: string | null
          created_at?: string
          cuerpo_richtext?: string
          especialidad?: string | null
          id?: string
          organization_id?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "consent_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          created_at: string
          firmado_at: string | null
          hash_sha256: string | null
          id: string
          organization_id: string
          origen: Database["public"]["Enums"]["origen_consentimiento"]
          patient_id: string
          pdf_path: string | null
          template_id: string | null
          titulo: string
        }
        Insert: {
          created_at?: string
          firmado_at?: string | null
          hash_sha256?: string | null
          id?: string
          organization_id: string
          origen?: Database["public"]["Enums"]["origen_consentimiento"]
          patient_id: string
          pdf_path?: string | null
          template_id?: string | null
          titulo: string
        }
        Update: {
          created_at?: string
          firmado_at?: string | null
          hash_sha256?: string | null
          id?: string
          organization_id?: string
          origen?: Database["public"]["Enums"]["origen_consentimiento"]
          patient_id?: string
          pdf_path?: string | null
          template_id?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "consent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunities: {
        Row: {
          color: string | null
          created_at: string
          email: string | null
          ghl_opportunity_id: string | null
          id: string
          nombre_contacto: string
          notas: string | null
          organization_id: string
          origen: string | null
          patient_id: string | null
          stage_id: string
          sync_estado: string | null
          telefono: string | null
          ultima_sync_at: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          email?: string | null
          ghl_opportunity_id?: string | null
          id?: string
          nombre_contacto: string
          notas?: string | null
          organization_id?: string
          origen?: string | null
          patient_id?: string | null
          stage_id: string
          sync_estado?: string | null
          telefono?: string | null
          ultima_sync_at?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          email?: string | null
          ghl_opportunity_id?: string | null
          id?: string
          nombre_contacto?: string
          notas?: string | null
          organization_id?: string
          origen?: string | null
          patient_id?: string | null
          stage_id?: string
          sync_estado?: string | null
          telefono?: string | null
          ultima_sync_at?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipelines: {
        Row: {
          created_at: string
          ghl_pipeline_id: string | null
          id: string
          nombre: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          ghl_pipeline_id?: string | null
          id?: string
          nombre: string
          organization_id: string
        }
        Update: {
          created_at?: string
          ghl_pipeline_id?: string | null
          id?: string
          nombre?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipelines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_stages: {
        Row: {
          color: string
          created_at: string
          ghl_stage_id: string | null
          id: string
          nombre: string
          orden: number
          organization_id: string
          pipeline_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          ghl_stage_id?: string | null
          id?: string
          nombre: string
          orden?: number
          organization_id?: string
          pipeline_id: string
        }
        Update: {
          color?: string
          created_at?: string
          ghl_stage_id?: string | null
          id?: string
          nombre?: string
          orden?: number
          organization_id?: string
          pipeline_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_stages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "crm_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_products: {
        Row: {
          activo: boolean
          caducidad: string | null
          categoria: string
          coste: number | null
          created_at: string
          id: string
          lote: string | null
          nombre: string
          organization_id: string
          proveedor: string | null
          umbral_alerta: number
          unidades: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          caducidad?: string | null
          categoria?: string
          coste?: number | null
          created_at?: string
          id?: string
          lote?: string | null
          nombre: string
          organization_id: string
          proveedor?: string | null
          umbral_alerta?: number
          unidades?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          caducidad?: string | null
          categoria?: string
          coste?: number | null
          created_at?: string
          id?: string
          lote?: string | null
          nombre?: string
          organization_id?: string
          proveedor?: string | null
          umbral_alerta?: number
          unidades?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          accent_color: string | null
          brand_color: string | null
          created_at: string
          current_period_end: string | null
          especialidad: string | null
          features: Json
          id: string
          logo_path: string | null
          max_usuarios: number
          nombre: string
          owner_id: string | null
          payment_provider: string | null
          plan: string
          referral_code: string | null
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          timezone: string
          trial_ends_at: string
          updated_at: string
          vertical: string
        }
        Insert: {
          accent_color?: string | null
          brand_color?: string | null
          created_at?: string
          current_period_end?: string | null
          especialidad?: string | null
          features?: Json
          id?: string
          logo_path?: string | null
          max_usuarios?: number
          nombre: string
          owner_id?: string | null
          payment_provider?: string | null
          plan?: string
          referral_code?: string | null
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          timezone?: string
          trial_ends_at?: string
          updated_at?: string
          vertical?: string
        }
        Update: {
          accent_color?: string | null
          brand_color?: string | null
          created_at?: string
          current_period_end?: string | null
          especialidad?: string | null
          features?: Json
          id?: string
          logo_path?: string | null
          max_usuarios?: number
          nombre?: string
          owner_id?: string | null
          payment_provider?: string | null
          plan?: string
          referral_code?: string | null
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          timezone?: string
          trial_ends_at?: string
          updated_at?: string
          vertical?: string
        }
        Relationships: []
      }
      patient_metrics: {
        Row: {
          altura: number | null
          created_at: string
          fecha: string
          grasa_pct: number | null
          id: string
          imc: number | null
          notas: string | null
          organization_id: string
          patient_id: string
          peso: number | null
          tension_dia: number | null
          tension_sis: number | null
        }
        Insert: {
          altura?: number | null
          created_at?: string
          fecha?: string
          grasa_pct?: number | null
          id?: string
          imc?: number | null
          notas?: string | null
          organization_id?: string
          patient_id: string
          peso?: number | null
          tension_dia?: number | null
          tension_sis?: number | null
        }
        Update: {
          altura?: number | null
          created_at?: string
          fecha?: string
          grasa_pct?: number | null
          id?: string
          imc?: number | null
          notas?: string | null
          organization_id?: string
          patient_id?: string
          peso?: number | null
          tension_dia?: number | null
          tension_sis?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_metrics_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_photos: {
        Row: {
          created_at: string
          etiqueta: string | null
          id: string
          organization_id: string
          patient_id: string
          storage_path: string
          tomada_at: string
          treatment_id: string | null
        }
        Insert: {
          created_at?: string
          etiqueta?: string | null
          id?: string
          organization_id: string
          patient_id: string
          storage_path: string
          tomada_at?: string
          treatment_id?: string | null
        }
        Update: {
          created_at?: string
          etiqueta?: string | null
          id?: string
          organization_id?: string
          patient_id?: string
          storage_path?: string
          tomada_at?: string
          treatment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_photos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_photos_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_photos_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_treatments: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_treatment"]
          id: string
          organization_id: string
          patient_id: string
          periodicidad_meses: number
          proxima_recomendada_at: string | null
          treatment_id: string
          ultima_sesion_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_treatment"]
          id?: string
          organization_id: string
          patient_id: string
          periodicidad_meses: number
          proxima_recomendada_at?: string | null
          treatment_id: string
          ultima_sesion_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_treatment"]
          id?: string
          organization_id?: string
          patient_id?: string
          periodicidad_meses?: number
          proxima_recomendada_at?: string | null
          treatment_id?: string
          ultima_sesion_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_treatments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          alergias: string | null
          antecedentes: string | null
          apellidos: string
          created_at: string
          deleted_at: string | null
          direccion: string | null
          dni: string | null
          email: string | null
          fecha_nacimiento: string | null
          ghl_contact_id: string | null
          grupo_sanguineo: string | null
          id: string
          medicacion: string | null
          mutua: string | null
          nombre: string
          num_poliza: string | null
          observaciones: string | null
          organization_id: string
          origen: string | null
          profesion: string | null
          recordatorios_wa: boolean
          sexo: Database["public"]["Enums"]["sexo_paciente"] | null
          telefono: string
          updated_at: string
        }
        Insert: {
          alergias?: string | null
          antecedentes?: string | null
          apellidos: string
          created_at?: string
          deleted_at?: string | null
          direccion?: string | null
          dni?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          ghl_contact_id?: string | null
          grupo_sanguineo?: string | null
          id?: string
          medicacion?: string | null
          mutua?: string | null
          nombre: string
          num_poliza?: string | null
          observaciones?: string | null
          organization_id?: string
          origen?: string | null
          profesion?: string | null
          recordatorios_wa?: boolean
          sexo?: Database["public"]["Enums"]["sexo_paciente"] | null
          telefono: string
          updated_at?: string
        }
        Update: {
          alergias?: string | null
          antecedentes?: string | null
          apellidos?: string
          created_at?: string
          deleted_at?: string | null
          direccion?: string | null
          dni?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          ghl_contact_id?: string | null
          grupo_sanguineo?: string | null
          id?: string
          medicacion?: string | null
          mutua?: string | null
          nombre?: string
          num_poliza?: string | null
          observaciones?: string | null
          organization_id?: string
          origen?: string | null
          profesion?: string | null
          recordatorios_wa?: boolean
          sexo?: Database["public"]["Enums"]["sexo_paciente"] | null
          telefono?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          is_superadmin: boolean
          nombre: string
          organization_id: string | null
          rol: Database["public"]["Enums"]["rol_usuario"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id: string
          is_superadmin?: boolean
          nombre: string
          organization_id?: string | null
          rol?: Database["public"]["Enums"]["rol_usuario"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          is_superadmin?: boolean
          nombre?: string
          organization_id?: string | null
          rol?: Database["public"]["Enums"]["rol_usuario"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          clave: string
          organization_id: string
          valor: Json
        }
        Insert: {
          clave: string
          organization_id: string
          valor: Json
        }
        Update: {
          clave?: string
          organization_id?: string
          valor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          appointment_id: string | null
          cantidad: number
          creado_at: string
          id: string
          motivo: string | null
          organization_id: string
          product_id: string
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          usuario_id: string
        }
        Insert: {
          appointment_id?: string | null
          cantidad: number
          creado_at?: string
          id?: string
          motivo?: string | null
          organization_id: string
          product_id: string
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
          usuario_id: string
        }
        Update: {
          appointment_id?: string | null
          cantidad?: number
          creado_at?: string
          id?: string
          motivo?: string | null
          organization_id?: string
          product_id?: string
          tipo?: Database["public"]["Enums"]["tipo_movimiento"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_stock_bajo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          activo: boolean
          categoria: Database["public"]["Enums"]["categoria_tratamiento"]
          created_at: string
          duracion_min: number
          id: string
          nombre: string
          organization_id: string
          periodicidad_meses: number | null
          precio_orientativo: number | null
        }
        Insert: {
          activo?: boolean
          categoria?: Database["public"]["Enums"]["categoria_tratamiento"]
          created_at?: string
          duracion_min?: number
          id?: string
          nombre: string
          organization_id: string
          periodicidad_meses?: number | null
          precio_orientativo?: number | null
        }
        Update: {
          activo?: boolean
          categoria?: Database["public"]["Enums"]["categoria_tratamiento"]
          created_at?: string
          duracion_min?: number
          id?: string
          nombre?: string
          organization_id?: string
          periodicidad_meses?: number | null
          precio_orientativo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "treatments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_conversations: {
        Row: {
          created_at: string
          crm_opportunity_id: string | null
          estado_agente: Database["public"]["Enums"]["estado_agente_wa"]
          id: string
          no_leidos: number
          organization_id: string
          patient_id: string | null
          telefono: string
          ultima_entrada_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          crm_opportunity_id?: string | null
          estado_agente?: Database["public"]["Enums"]["estado_agente_wa"]
          id?: string
          no_leidos?: number
          organization_id?: string
          patient_id?: string | null
          telefono: string
          ultima_entrada_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          crm_opportunity_id?: string | null
          estado_agente?: Database["public"]["Enums"]["estado_agente_wa"]
          id?: string
          no_leidos?: number
          organization_id?: string
          patient_id?: string | null
          telefono?: string
          ultima_entrada_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_conversations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_messages: {
        Row: {
          conversation_id: string
          creado_at: string
          cuerpo: string | null
          direccion: Database["public"]["Enums"]["direccion_mensaje"]
          enviado_por: Database["public"]["Enums"]["enviado_por_tipo"]
          estado_envio: string | null
          id: string
          media_path: string | null
          organization_id: string
          plantilla_nombre: string | null
          tipo: Database["public"]["Enums"]["tipo_mensaje"]
          wa_message_id: string | null
        }
        Insert: {
          conversation_id: string
          creado_at?: string
          cuerpo?: string | null
          direccion: Database["public"]["Enums"]["direccion_mensaje"]
          enviado_por?: Database["public"]["Enums"]["enviado_por_tipo"]
          estado_envio?: string | null
          id?: string
          media_path?: string | null
          organization_id?: string
          plantilla_nombre?: string | null
          tipo?: Database["public"]["Enums"]["tipo_mensaje"]
          wa_message_id?: string | null
        }
        Update: {
          conversation_id?: string
          creado_at?: string
          cuerpo?: string | null
          direccion?: Database["public"]["Enums"]["direccion_mensaje"]
          enviado_por?: Database["public"]["Enums"]["enviado_por_tipo"]
          estado_envio?: string | null
          id?: string
          media_path?: string | null
          organization_id?: string
          plantilla_nombre?: string | null
          tipo?: Database["public"]["Enums"]["tipo_mensaje"]
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wa_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "wa_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_recomendaciones_pendientes: {
        Row: {
          dias_vencido: number | null
          patient_apellidos: string | null
          patient_id: string | null
          patient_nombre: string | null
          patient_telefono: string | null
          proxima_recomendada_at: string | null
          treatment_id: string | null
          treatment_nombre: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_treatments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      v_stock_bajo: {
        Row: {
          categoria: string | null
          id: string | null
          nombre: string | null
          proveedor: string | null
          umbral_alerta: number | null
          unidades: number | null
        }
        Insert: {
          categoria?: string | null
          id?: string | null
          nombre?: string | null
          proveedor?: string | null
          umbral_alerta?: number | null
          unidades?: number | null
        }
        Update: {
          categoria?: string | null
          id?: string | null
          nombre?: string | null
          proveedor?: string | null
          umbral_alerta?: number | null
          unidades?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      crear_paciente_desde_oportunidad: {
        Args: { oportunidad_id: string }
        Returns: string
      }
      create_organization_with_owner: {
        Args: {
          p_org_name: string
          p_slug: string
          p_user_name: string
          p_vertical: string
        }
        Returns: string
      }
      get_user_org_id: { Args: never; Returns: string }
      seed_default_pipeline: { Args: { p_org: string }; Returns: undefined }
      siguiente_numero_factura: { Args: never; Returns: string }
      registrar_auditoria: {
        Args: {
          p_accion: string
          p_detalle?: Json
          p_entidad: string
          p_entidad_id?: string
        }
        Returns: undefined
      }
      user_has_role: {
        Args: { roles: Database["public"]["Enums"]["rol_usuario"][] }
        Returns: boolean
      }
    }
    Enums: {
      categoria_tratamiento:
        | "facial"
        | "corporal"
        | "capilar"
        | "otro"
        | "dental"
        | "medicina"
        | "fisioterapia"
        | "bienestar"
      direccion_mensaje: "in" | "out"
      enviado_por_tipo: "agente_ia" | "humano" | "sistema"
      estado_agente_wa: "activo" | "pausado" | "humano"
      estado_cita:
        | "pendiente"
        | "confirmada"
        | "completada"
        | "cancelada"
        | "no_show"
      estado_treatment: "activo" | "pausado" | "finalizado"
      origen_cita: "manual" | "widget" | "whatsapp" | "crm"
      origen_consentimiento: "digital" | "papel_subido"
      rol_usuario: "admin" | "profesional" | "recepcion" | "owner" | "contable"
      sexo_paciente: "femenino" | "masculino" | "otro"
      tipo_mensaje: "texto" | "plantilla" | "media"
      tipo_movimiento: "entrada" | "salida" | "ajuste"
      transcripcion_origen: "voz" | "escrito"
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
  public: {
    Enums: {
      categoria_tratamiento: [
        "facial",
        "corporal",
        "capilar",
        "otro",
        "dental",
        "medicina",
        "fisioterapia",
        "bienestar",
      ],
      direccion_mensaje: ["in", "out"],
      enviado_por_tipo: ["agente_ia", "humano", "sistema"],
      estado_agente_wa: ["activo", "pausado", "humano"],
      estado_cita: [
        "pendiente",
        "confirmada",
        "completada",
        "cancelada",
        "no_show",
      ],
      estado_treatment: ["activo", "pausado", "finalizado"],
      origen_cita: ["manual", "widget", "whatsapp", "crm"],
      origen_consentimiento: ["digital", "papel_subido"],
      rol_usuario: ["admin", "profesional", "recepcion", "owner", "contable"],
      sexo_paciente: ["femenino", "masculino", "otro"],
      tipo_mensaje: ["texto", "plantilla", "media"],
      tipo_movimiento: ["entrada", "salida", "ajuste"],
      transcripcion_origen: ["voz", "escrito"],
    },
  },
} as const
