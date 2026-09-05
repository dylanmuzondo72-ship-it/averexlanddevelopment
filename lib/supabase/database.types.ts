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
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json
          resource_id: string | null
          resource_type: string
          summary: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          resource_id?: string | null
          resource_type: string
          summary: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          resource_id?: string | null
          resource_type?: string
          summary?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          alternative_phone: string | null
          archived_at: string | null
          assigned_to: string | null
          billing_address: string | null
          client_reference: string
          client_type: Database["public"]["Enums"]["client_type"]
          company_name: string | null
          contact_person: string | null
          created_at: string
          created_by: string
          display_name: string
          email: string | null
          id: string
          notes: string | null
          phone: string
          physical_address: string | null
          status: Database["public"]["Enums"]["client_status"]
          tax_number: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          alternative_phone?: string | null
          archived_at?: string | null
          assigned_to?: string | null
          billing_address?: string | null
          client_reference: string
          client_type: Database["public"]["Enums"]["client_type"]
          company_name?: string | null
          contact_person?: string | null
          created_at?: string
          created_by: string
          display_name: string
          email?: string | null
          id?: string
          notes?: string | null
          phone: string
          physical_address?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tax_number?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          alternative_phone?: string | null
          archived_at?: string | null
          assigned_to?: string | null
          billing_address?: string | null
          client_reference?: string
          client_type?: Database["public"]["Enums"]["client_type"]
          company_name?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string
          display_name?: string
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string
          physical_address?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tax_number?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string
          alternative_email: string | null
          alternative_phone: string | null
          banking_details: Json
          ceo_name: string
          client_prefix: string
          company_name: string
          created_at: string
          default_currency: string
          default_invoice_due_days: number
          default_invoice_terms: string
          default_quote_terms: string
          default_quote_validity_days: number
          default_tax_label: string
          default_tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          default_tax_rate: number
          ecocash_details: Json
          google_maps_embed_url: string | null
          google_maps_query: string | null
          id: string
          invoice_prefix: string
          land_listing_prefix: string
          logo_path: string | null
          payment_prefix: string
          primary_email: string
          primary_phone: string
          quote_prefix: string
          receipt_prefix: string
          slogan: string
          social_links: Json
          tax_details: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address: string
          alternative_email?: string | null
          alternative_phone?: string | null
          banking_details?: Json
          ceo_name: string
          client_prefix?: string
          company_name: string
          created_at?: string
          default_currency?: string
          default_invoice_due_days?: number
          default_invoice_terms?: string
          default_quote_terms?: string
          default_quote_validity_days?: number
          default_tax_label?: string
          default_tax_mode?: Database["public"]["Enums"]["document_tax_mode"]
          default_tax_rate?: number
          ecocash_details?: Json
          google_maps_embed_url?: string | null
          google_maps_query?: string | null
          id?: string
          invoice_prefix?: string
          land_listing_prefix?: string
          logo_path?: string | null
          payment_prefix?: string
          primary_email: string
          primary_phone: string
          quote_prefix?: string
          receipt_prefix?: string
          slogan: string
          social_links?: Json
          tax_details?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string
          alternative_email?: string | null
          alternative_phone?: string | null
          banking_details?: Json
          ceo_name?: string
          client_prefix?: string
          company_name?: string
          created_at?: string
          default_currency?: string
          default_invoice_due_days?: number
          default_invoice_terms?: string
          default_quote_terms?: string
          default_quote_validity_days?: number
          default_tax_label?: string
          default_tax_mode?: Database["public"]["Enums"]["document_tax_mode"]
          default_tax_rate?: number
          ecocash_details?: Json
          google_maps_embed_url?: string | null
          google_maps_query?: string | null
          id?: string
          invoice_prefix?: string
          land_listing_prefix?: string
          logo_path?: string | null
          payment_prefix?: string
          primary_email?: string
          primary_phone?: string
          quote_prefix?: string
          receipt_prefix?: string
          slogan?: string
          social_links?: Json
          tax_details?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          discount_total: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          id: string
          invoice_id: string
          item_type: Database["public"]["Enums"]["document_item_type"]
          line_subtotal: number
          line_total: number
          position: number
          quantity: number
          tax_applicable: boolean
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          discount_total?: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          id?: string
          invoice_id: string
          item_type?: Database["public"]["Enums"]["document_item_type"]
          line_subtotal: number
          line_total: number
          position: number
          quantity: number
          tax_applicable?: boolean
          unit?: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          discount_total?: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          id?: string
          invoice_id?: string
          item_type?: Database["public"]["Enums"]["document_item_type"]
          line_subtotal?: number
          line_total?: number
          position?: number
          quantity?: number
          tax_applicable?: boolean
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          balance_due: number
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          client_snapshot: Json
          company_snapshot: Json
          created_at: string
          created_by: string
          currency: string
          discount_total: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          due_date: string
          grand_total: number
          id: string
          invoice_number: string | null
          issue_date: string
          issued_at: string | null
          issued_by: string | null
          lock_version: number
          notes: string | null
          payment_state: Database["public"]["Enums"]["payment_state"]
          snapshot_frozen_at: string | null
          snapshot_version: number
          source_quotation_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subject: string
          subtotal: number
          tax_label: string
          tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          tax_rate: number
          tax_total: number
          taxable_subtotal: number
          terms_conditions: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          amount_paid?: number
          balance_due?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id: string
          client_snapshot: Json
          company_snapshot: Json
          created_at?: string
          created_by: string
          currency: string
          discount_total?: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          due_date: string
          grand_total?: number
          id?: string
          invoice_number?: string | null
          issue_date: string
          issued_at?: string | null
          issued_by?: string | null
          lock_version?: number
          notes?: string | null
          payment_state?: Database["public"]["Enums"]["payment_state"]
          snapshot_frozen_at?: string | null
          snapshot_version?: number
          source_quotation_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subject: string
          subtotal?: number
          tax_label?: string
          tax_mode?: Database["public"]["Enums"]["document_tax_mode"]
          tax_rate?: number
          tax_total?: number
          taxable_subtotal?: number
          terms_conditions?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          amount_paid?: number
          balance_due?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id?: string
          client_snapshot?: Json
          company_snapshot?: Json
          created_at?: string
          created_by?: string
          currency?: string
          discount_total?: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          due_date?: string
          grand_total?: number
          id?: string
          invoice_number?: string | null
          issue_date?: string
          issued_at?: string | null
          issued_by?: string | null
          lock_version?: number
          notes?: string | null
          payment_state?: Database["public"]["Enums"]["payment_state"]
          snapshot_frozen_at?: string | null
          snapshot_version?: number
          source_quotation_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subject?: string
          subtotal?: number
          tax_label?: string
          tax_mode?: Database["public"]["Enums"]["document_tax_mode"]
          tax_rate?: number
          tax_total?: number
          taxable_subtotal?: number
          terms_conditions?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_source_quotation_id_fkey"
            columns: ["source_quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      land_developments: {
        Row: {
          address: string | null
          archived_at: string | null
          city_town: string | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          development_type: string
          id: string
          internal_notes: string | null
          land_size_unit: string | null
          latitude: number | null
          location: string
          longitude: number | null
          name: string
          province: string | null
          reference_number: string
          slug: string
          status: Database["public"]["Enums"]["land_development_status"]
          total_land_size: number | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          city_town?: string | null
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          development_type: string
          id?: string
          internal_notes?: string | null
          land_size_unit?: string | null
          latitude?: number | null
          location: string
          longitude?: number | null
          name: string
          province?: string | null
          reference_number: string
          slug: string
          status?: Database["public"]["Enums"]["land_development_status"]
          total_land_size?: number | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          city_town?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          development_type?: string
          id?: string
          internal_notes?: string | null
          land_size_unit?: string | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          name?: string
          province?: string | null
          reference_number?: string
          slug?: string
          status?: Database["public"]["Enums"]["land_development_status"]
          total_land_size?: number | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "land_developments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_developments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      land_media: {
        Row: {
          alt_text: string | null
          approval_status: Database["public"]["Enums"]["land_media_approval"]
          archived_at: string | null
          caption: string | null
          created_at: string
          created_by: string
          crop_data: Json
          development_id: string | null
          file_size: number
          id: string
          is_cover: boolean
          land_unit_id: string | null
          media_type: Database["public"]["Enums"]["land_media_type"]
          mime_type: string
          original_filename: string
          rotation: number
          sort_order: number
          storage_bucket: string
          storage_path: string
          updated_at: string
          updated_by: string
          visibility: Database["public"]["Enums"]["land_media_visibility"]
        }
        Insert: {
          alt_text?: string | null
          approval_status?: Database["public"]["Enums"]["land_media_approval"]
          archived_at?: string | null
          caption?: string | null
          created_at?: string
          created_by: string
          crop_data?: Json
          development_id?: string | null
          file_size: number
          id?: string
          is_cover?: boolean
          land_unit_id?: string | null
          media_type: Database["public"]["Enums"]["land_media_type"]
          mime_type: string
          original_filename: string
          rotation?: number
          sort_order?: number
          storage_bucket: string
          storage_path: string
          updated_at?: string
          updated_by: string
          visibility?: Database["public"]["Enums"]["land_media_visibility"]
        }
        Update: {
          alt_text?: string | null
          approval_status?: Database["public"]["Enums"]["land_media_approval"]
          archived_at?: string | null
          caption?: string | null
          created_at?: string
          created_by?: string
          crop_data?: Json
          development_id?: string | null
          file_size?: number
          id?: string
          is_cover?: boolean
          land_unit_id?: string | null
          media_type?: Database["public"]["Enums"]["land_media_type"]
          mime_type?: string
          original_filename?: string
          rotation?: number
          sort_order?: number
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
          updated_by?: string
          visibility?: Database["public"]["Enums"]["land_media_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "land_media_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_media_development_id_fkey"
            columns: ["development_id"]
            isOneToOne: false
            referencedRelation: "land_developments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_media_land_unit_id_fkey"
            columns: ["land_unit_id"]
            isOneToOne: false
            referencedRelation: "land_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_media_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      land_units: {
        Row: {
          archived_at: string | null
          asking_price: number | null
          availability_status: Database["public"]["Enums"]["land_unit_availability_status"]
          created_at: string
          created_by: string
          currency: string
          description: string | null
          development_id: string
          id: string
          internal_notes: string | null
          internal_reference: string
          land_size: number
          land_size_unit: string
          location_description: string | null
          property_type: Database["public"]["Enums"]["land_unit_property_type"]
          slug: string
          stand_number: string
          title: string | null
          updated_at: string
          updated_by: string
          verification_status: Database["public"]["Enums"]["land_unit_verification_status"]
        }
        Insert: {
          archived_at?: string | null
          asking_price?: number | null
          availability_status?: Database["public"]["Enums"]["land_unit_availability_status"]
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          development_id: string
          id?: string
          internal_notes?: string | null
          internal_reference: string
          land_size: number
          land_size_unit: string
          location_description?: string | null
          property_type: Database["public"]["Enums"]["land_unit_property_type"]
          slug: string
          stand_number: string
          title?: string | null
          updated_at?: string
          updated_by: string
          verification_status?: Database["public"]["Enums"]["land_unit_verification_status"]
        }
        Update: {
          archived_at?: string | null
          asking_price?: number | null
          availability_status?: Database["public"]["Enums"]["land_unit_availability_status"]
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          development_id?: string
          id?: string
          internal_notes?: string | null
          internal_reference?: string
          land_size?: number
          land_size_unit?: string
          location_description?: string | null
          property_type?: Database["public"]["Enums"]["land_unit_property_type"]
          slug?: string
          stand_number?: string
          title?: string | null
          updated_at?: string
          updated_by?: string
          verification_status?: Database["public"]["Enums"]["land_unit_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "land_units_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_units_development_id_fkey"
            columns: ["development_id"]
            isOneToOne: false
            referencedRelation: "land_developments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "land_units_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          allocated_amount: number
          created_at: string
          id: string
          invoice_id: string
          payment_id: string
        }
        Insert: {
          allocated_amount: number
          created_at?: string
          id?: string
          invoice_id: string
          payment_id: string
        }
        Update: {
          allocated_amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          file_size: number
          id: string
          mime_type: string
          original_filename: string
          payment_id: string
          storage_path: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_size: number
          id?: string
          mime_type: string
          original_filename: string
          payment_id: string
          storage_path: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_size?: number
          id?: string
          mime_type?: string
          original_filename?: string
          payment_id?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          currency: string
          external_reference: string | null
          id: string
          notes: string | null
          other_method_description: string | null
          payment_date: string
          payment_method: string
          payment_reference: string
          recorded_by: string
          reversal_reason: string | null
          reversed_at: string | null
          reversed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          currency: string
          external_reference?: string | null
          id?: string
          notes?: string | null
          other_method_description?: string | null
          payment_date: string
          payment_method: string
          payment_reference: string
          recorded_by: string
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          currency?: string
          external_reference?: string | null
          id?: string
          notes?: string | null
          other_method_description?: string | null
          payment_date?: string
          payment_method?: string
          payment_reference?: string
          recorded_by?: string
          reversal_reason?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          last_seen_at: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          last_seen_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          last_seen_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Relationships: []
      }
      quotation_items: {
        Row: {
          created_at: string
          description: string
          discount_total: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          id: string
          item_type: Database["public"]["Enums"]["document_item_type"]
          line_subtotal: number
          line_total: number
          position: number
          quantity: number
          quotation_id: string
          tax_applicable: boolean
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          discount_total?: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          id?: string
          item_type?: Database["public"]["Enums"]["document_item_type"]
          line_subtotal: number
          line_total: number
          position: number
          quantity: number
          quotation_id: string
          tax_applicable?: boolean
          unit?: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          discount_total?: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          id?: string
          item_type?: Database["public"]["Enums"]["document_item_type"]
          line_subtotal?: number
          line_total?: number
          position?: number
          quantity?: number
          quotation_id?: string
          tax_applicable?: boolean
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          accepted_at: string | null
          assigned_to: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          client_snapshot: Json
          company_snapshot: Json
          converted_at: string | null
          created_at: string
          created_by: string
          currency: string
          discount_total: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expired_at: string | null
          expiry_date: string
          grand_total: number
          id: string
          introduction: string | null
          issue_date: string
          lock_version: number
          notes: string | null
          quote_number: string
          rejected_at: string | null
          revision_number: number
          root_quotation_id: string | null
          sent_at: string | null
          snapshot_frozen_at: string | null
          snapshot_version: number
          status: Database["public"]["Enums"]["quotation_status"]
          subject: string
          subtotal: number
          supersedes_quotation_id: string | null
          tax_label: string
          tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          tax_rate: number
          tax_total: number
          taxable_subtotal: number
          terms_conditions: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_to?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id: string
          client_snapshot: Json
          company_snapshot: Json
          converted_at?: string | null
          created_at?: string
          created_by: string
          currency: string
          discount_total?: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          expired_at?: string | null
          expiry_date: string
          grand_total?: number
          id?: string
          introduction?: string | null
          issue_date: string
          lock_version?: number
          notes?: string | null
          quote_number: string
          rejected_at?: string | null
          revision_number?: number
          root_quotation_id?: string | null
          sent_at?: string | null
          snapshot_frozen_at?: string | null
          snapshot_version?: number
          status?: Database["public"]["Enums"]["quotation_status"]
          subject: string
          subtotal?: number
          supersedes_quotation_id?: string | null
          tax_label?: string
          tax_mode?: Database["public"]["Enums"]["document_tax_mode"]
          tax_rate?: number
          tax_total?: number
          taxable_subtotal?: number
          terms_conditions?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          accepted_at?: string | null
          assigned_to?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id?: string
          client_snapshot?: Json
          company_snapshot?: Json
          converted_at?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          discount_total?: number
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          expired_at?: string | null
          expiry_date?: string
          grand_total?: number
          id?: string
          introduction?: string | null
          issue_date?: string
          lock_version?: number
          notes?: string | null
          quote_number?: string
          rejected_at?: string | null
          revision_number?: number
          root_quotation_id?: string | null
          sent_at?: string | null
          snapshot_frozen_at?: string | null
          snapshot_version?: number
          status?: Database["public"]["Enums"]["quotation_status"]
          subject?: string
          subtotal?: number
          supersedes_quotation_id?: string | null
          tax_label?: string
          tax_mode?: Database["public"]["Enums"]["document_tax_mode"]
          tax_rate?: number
          tax_total?: number
          taxable_subtotal?: number
          terms_conditions?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_root_quotation_id_fkey"
            columns: ["root_quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_supersedes_quotation_id_fkey"
            columns: ["supersedes_quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          allocation_snapshot: Json
          client_id: string
          client_snapshot: Json
          company_snapshot: Json
          created_at: string
          currency: string
          external_reference: string | null
          id: string
          invoice_total: number
          issued_at: string
          issued_by: string
          payment_amount: number
          payment_date: string
          payment_id: string
          payment_method: string
          receipt_number: string
          remaining_balance: number
          reversed_at: string | null
          status: string
          total_paid_after: number
        }
        Insert: {
          allocation_snapshot: Json
          client_id: string
          client_snapshot: Json
          company_snapshot: Json
          created_at?: string
          currency: string
          external_reference?: string | null
          id?: string
          invoice_total: number
          issued_at?: string
          issued_by: string
          payment_amount: number
          payment_date: string
          payment_id: string
          payment_method: string
          receipt_number: string
          remaining_balance: number
          reversed_at?: string | null
          status?: string
          total_paid_after: number
        }
        Update: {
          allocation_snapshot?: Json
          client_id?: string
          client_snapshot?: Json
          company_snapshot?: Json
          created_at?: string
          currency?: string
          external_reference?: string | null
          id?: string
          invoice_total?: number
          issued_at?: string
          issued_by?: string
          payment_amount?: number
          payment_date?: string
          payment_id?: string
          payment_method?: string
          receipt_number?: string
          remaining_balance?: number
          reversed_at?: string | null
          status?: string
          total_paid_after?: number
        }
        Relationships: [
          {
            foreignKeyName: "receipts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      set_land_media_cover: { Args: { target_id: string }; Returns: undefined };
      move_land_media: { Args: { target_id: string; move_direction: number }; Returns: undefined };
      admin_update_profile: {
        Args: {
          new_full_name: string
          new_phone: string
          new_role: Database["public"]["Enums"]["app_role"]
          new_status: Database["public"]["Enums"]["profile_status"]
          target_profile_id: string
        }
        Returns: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          last_seen_at: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_invoice: {
        Args: {
          expected_lock_version: number
          requested_cancellation_reason: string
          target_invoice_id: string
        }
        Returns: {
          amount_paid: number
          balance_due: number
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          client_snapshot: Json
          company_snapshot: Json
          created_at: string
          created_by: string
          currency: string
          discount_total: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          due_date: string
          grand_total: number
          id: string
          invoice_number: string | null
          issue_date: string
          issued_at: string | null
          issued_by: string | null
          lock_version: number
          notes: string | null
          payment_state: Database["public"]["Enums"]["payment_state"]
          snapshot_frozen_at: string | null
          snapshot_version: number
          source_quotation_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subject: string
          subtotal: number
          tax_label: string
          tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          tax_rate: number
          tax_total: number
          taxable_subtotal: number
          terms_conditions: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      convert_quotation_to_invoice: {
        Args: { expected_lock_version: number; target_quotation_id: string }
        Returns: {
          amount_paid: number
          balance_due: number
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          client_snapshot: Json
          company_snapshot: Json
          created_at: string
          created_by: string
          currency: string
          discount_total: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          due_date: string
          grand_total: number
          id: string
          invoice_number: string | null
          issue_date: string
          issued_at: string | null
          issued_by: string | null
          lock_version: number
          notes: string | null
          payment_state: Database["public"]["Enums"]["payment_state"]
          snapshot_frozen_at: string | null
          snapshot_version: number
          source_quotation_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subject: string
          subtotal: number
          tax_label: string
          tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          tax_rate: number
          tax_total: number
          taxable_subtotal: number
          terms_conditions: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_client: {
        Args: {
          new_alternative_phone?: string
          new_assigned_to?: string
          new_billing_address?: string
          new_client_type: Database["public"]["Enums"]["client_type"]
          new_company_name?: string
          new_contact_person?: string
          new_display_name: string
          new_email?: string
          new_notes?: string
          new_phone?: string
          new_physical_address?: string
          new_tax_number?: string
        }
        Returns: {
          alternative_phone: string | null
          archived_at: string | null
          assigned_to: string | null
          billing_address: string | null
          client_reference: string
          client_type: Database["public"]["Enums"]["client_type"]
          company_name: string | null
          contact_person: string | null
          created_at: string
          created_by: string
          display_name: string
          email: string | null
          id: string
          notes: string | null
          phone: string
          physical_address: string | null
          status: Database["public"]["Enums"]["client_status"]
          tax_number: string | null
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "clients"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_invoice: {
        Args: {
          new_client_id: string
          new_currency: string
          new_discount_type: Database["public"]["Enums"]["discount_type"]
          new_discount_value: number
          new_due_date: string
          new_issue_date: string
          new_items: Json
          new_notes: string
          new_subject: string
          new_tax_label: string
          new_tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          new_tax_rate: number
          new_terms_conditions: string
        }
        Returns: {
          amount_paid: number
          balance_due: number
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          client_snapshot: Json
          company_snapshot: Json
          created_at: string
          created_by: string
          currency: string
          discount_total: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          due_date: string
          grand_total: number
          id: string
          invoice_number: string | null
          issue_date: string
          issued_at: string | null
          issued_by: string | null
          lock_version: number
          notes: string | null
          payment_state: Database["public"]["Enums"]["payment_state"]
          snapshot_frozen_at: string | null
          snapshot_version: number
          source_quotation_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subject: string
          subtotal: number
          tax_label: string
          tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          tax_rate: number
          tax_total: number
          taxable_subtotal: number
          terms_conditions: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_land_development: {
        Args: {
          new_address?: string
          new_city_town?: string
          new_description?: string
          new_development_type: string
          new_internal_notes?: string
          new_land_size_unit?: string
          new_location: string
          new_name: string
          new_province?: string
          new_slug: string
          new_total_land_size?: number
        }
        Returns: {
          address: string | null
          archived_at: string | null
          city_town: string | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          development_type: string
          id: string
          internal_notes: string | null
          land_size_unit: string | null
          latitude: number | null
          location: string
          longitude: number | null
          name: string
          province: string | null
          reference_number: string
          slug: string
          status: Database["public"]["Enums"]["land_development_status"]
          total_land_size: number | null
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "land_developments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_land_unit: {
        Args: {
          new_asking_price?: number
          new_currency?: string
          new_description?: string
          new_development_id: string
          new_internal_notes?: string
          new_land_size: number
          new_land_size_unit: string
          new_location_description?: string
          new_property_type: Database["public"]["Enums"]["land_unit_property_type"]
          new_slug: string
          new_stand_number: string
          new_title?: string
        }
        Returns: {
          archived_at: string | null
          asking_price: number | null
          availability_status: Database["public"]["Enums"]["land_unit_availability_status"]
          created_at: string
          created_by: string
          currency: string
          description: string | null
          development_id: string
          id: string
          internal_notes: string | null
          internal_reference: string
          land_size: number
          land_size_unit: string
          location_description: string | null
          property_type: Database["public"]["Enums"]["land_unit_property_type"]
          slug: string
          stand_number: string
          title: string | null
          updated_at: string
          updated_by: string
          verification_status: Database["public"]["Enums"]["land_unit_verification_status"]
        }
        SetofOptions: {
          from: "*"
          to: "land_units"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_quotation: {
        Args: {
          new_assigned_to: string
          new_client_id: string
          new_currency: string
          new_discount_type: Database["public"]["Enums"]["discount_type"]
          new_discount_value: number
          new_expiry_date: string
          new_introduction: string
          new_issue_date: string
          new_items: Json
          new_notes: string
          new_subject: string
          new_tax_label: string
          new_tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          new_tax_rate: number
          new_terms_conditions: string
        }
        Returns: {
          accepted_at: string | null
          assigned_to: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          client_snapshot: Json
          company_snapshot: Json
          converted_at: string | null
          created_at: string
          created_by: string
          currency: string
          discount_total: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expired_at: string | null
          expiry_date: string
          grand_total: number
          id: string
          introduction: string | null
          issue_date: string
          lock_version: number
          notes: string | null
          quote_number: string
          rejected_at: string | null
          revision_number: number
          root_quotation_id: string | null
          sent_at: string | null
          snapshot_frozen_at: string | null
          snapshot_version: number
          status: Database["public"]["Enums"]["quotation_status"]
          subject: string
          subtotal: number
          supersedes_quotation_id: string | null
          tax_label: string
          tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          tax_rate: number
          tax_total: number
          taxable_subtotal: number
          terms_conditions: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "quotations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_quotation_revision: {
        Args: { expected_lock_version: number; target_quotation_id: string }
        Returns: {
          accepted_at: string | null
          assigned_to: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          client_snapshot: Json
          company_snapshot: Json
          converted_at: string | null
          created_at: string
          created_by: string
          currency: string
          discount_total: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expired_at: string | null
          expiry_date: string
          grand_total: number
          id: string
          introduction: string | null
          issue_date: string
          lock_version: number
          notes: string | null
          quote_number: string
          rejected_at: string | null
          revision_number: number
          root_quotation_id: string | null
          sent_at: string | null
          snapshot_frozen_at: string | null
          snapshot_version: number
          status: Database["public"]["Enums"]["quotation_status"]
          subject: string
          subtotal: number
          supersedes_quotation_id: string | null
          tax_label: string
          tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          tax_rate: number
          tax_total: number
          taxable_subtotal: number
          terms_conditions: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "quotations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      dashboard_overview: { Args: never; Returns: Json }
      find_client_duplicates: {
        Args: {
          candidate_email?: string
          candidate_phone?: string
          excluded_client_id?: string
        }
        Returns: {
          client_reference: string
          display_name: string
          email: string
          id: string
          phone: string
        }[]
      }
      get_client_activity: {
        Args: { result_limit?: number; target_client_id: string }
        Returns: {
          action: string
          actor_id: string
          actor_name: string
          created_at: string
          id: string
          summary: string
        }[]
      }
      get_client_details: {
        Args: { target_client_id: string }
        Returns: {
          alternative_phone: string
          archived_at: string
          assigned_name: string
          assigned_to: string
          billing_address: string
          client_reference: string
          client_type: Database["public"]["Enums"]["client_type"]
          company_name: string
          contact_person: string
          created_at: string
          created_by: string
          created_by_name: string
          display_name: string
          email: string
          id: string
          notes: string
          phone: string
          physical_address: string
          status: Database["public"]["Enums"]["client_status"]
          tax_number: string
          updated_at: string
          updated_by: string
          updated_by_name: string
        }[]
      }
      get_document_activity: {
        Args: {
          document_kind: string
          result_limit?: number
          target_document_id: string
        }
        Returns: {
          action: string
          actor_name: string
          created_at: string
          id: string
          summary: string
        }[]
      }
      issue_invoice: {
        Args: { expected_lock_version: number; target_invoice_id: string }
        Returns: {
          amount_paid: number
          balance_due: number
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          client_snapshot: Json
          company_snapshot: Json
          created_at: string
          created_by: string
          currency: string
          discount_total: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          due_date: string
          grand_total: number
          id: string
          invoice_number: string | null
          issue_date: string
          issued_at: string | null
          issued_by: string | null
          lock_version: number
          notes: string | null
          payment_state: Database["public"]["Enums"]["payment_state"]
          snapshot_frozen_at: string | null
          snapshot_version: number
          source_quotation_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subject: string
          subtotal: number
          tax_label: string
          tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          tax_rate: number
          tax_total: number
          taxable_subtotal: number
          terms_conditions: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      list_document_assignees: {
        Args: never
        Returns: {
          display_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      list_document_clients: {
        Args: {
          document_kind: string
          result_limit?: number
          search_term?: string
        }
        Returns: {
          client_reference: string
          company_name: string
          display_name: string
          email: string
          id: string
          phone: string
        }[]
      }
      record_document_print: {
        Args: { document_kind: string; target_document_id: string }
        Returns: undefined
      }
      record_payment: {
        Args: {
          new_amount: number
          new_currency: string
          new_external_reference?: string
          new_notes?: string
          new_other_method_description?: string
          new_payment_date: string
          new_payment_method: string
          target_invoice_id: string
        }
        Returns: Json
      }
      refresh_invoice_snapshots: {
        Args: { expected_lock_version: number; target_invoice_id: string }
        Returns: {
          amount_paid: number
          balance_due: number
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          client_snapshot: Json
          company_snapshot: Json
          created_at: string
          created_by: string
          currency: string
          discount_total: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          due_date: string
          grand_total: number
          id: string
          invoice_number: string | null
          issue_date: string
          issued_at: string | null
          issued_by: string | null
          lock_version: number
          notes: string | null
          payment_state: Database["public"]["Enums"]["payment_state"]
          snapshot_frozen_at: string | null
          snapshot_version: number
          source_quotation_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subject: string
          subtotal: number
          tax_label: string
          tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          tax_rate: number
          tax_total: number
          taxable_subtotal: number
          terms_conditions: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      refresh_quotation_snapshots: {
        Args: { expected_lock_version: number; target_quotation_id: string }
        Returns: {
          accepted_at: string | null
          assigned_to: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          client_snapshot: Json
          company_snapshot: Json
          converted_at: string | null
          created_at: string
          created_by: string
          currency: string
          discount_total: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expired_at: string | null
          expiry_date: string
          grand_total: number
          id: string
          introduction: string | null
          issue_date: string
          lock_version: number
          notes: string | null
          quote_number: string
          rejected_at: string | null
          revision_number: number
          root_quotation_id: string | null
          sent_at: string | null
          snapshot_frozen_at: string | null
          snapshot_version: number
          status: Database["public"]["Enums"]["quotation_status"]
          subject: string
          subtotal: number
          supersedes_quotation_id: string | null
          tax_label: string
          tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          tax_rate: number
          tax_total: number
          taxable_subtotal: number
          terms_conditions: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "quotations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reverse_payment: {
        Args: { reason: string; target_payment_id: string }
        Returns: Json
      }
      search_activity_logs: {
        Args: {
          action_filter?: string
          actor_filter?: string
          date_from?: string
          date_to?: string
          page_offset?: number
          page_size?: number
          resource_filter?: string
          search_term?: string
        }
        Returns: {
          action: string
          actor_id: string
          actor_name: string
          created_at: string
          id: string
          metadata: Json
          resource_id: string
          resource_type: string
          summary: string
          total_count: number
        }[]
      }
      search_clients: {
        Args: {
          page_offset?: number
          page_size?: number
          search_term?: string
          sort_order?: string
          status_filter?: Database["public"]["Enums"]["client_status"]
          type_filter?: Database["public"]["Enums"]["client_type"]
        }
        Returns: {
          alternative_phone: string
          archived_at: string
          assigned_name: string
          assigned_to: string
          billing_address: string
          client_reference: string
          client_type: Database["public"]["Enums"]["client_type"]
          company_name: string
          contact_person: string
          created_at: string
          created_by: string
          display_name: string
          email: string
          id: string
          notes: string
          phone: string
          physical_address: string
          status: Database["public"]["Enums"]["client_status"]
          tax_number: string
          total_count: number
          updated_at: string
          updated_by: string
        }[]
      }
      search_invoices: {
        Args: {
          date_from?: string
          date_to?: string
          page_offset?: number
          page_size?: number
          search_term?: string
          sort_order?: string
          status_filter?: string
        }
        Returns: {
          amount_paid: number
          balance_due: number
          client_id: string
          client_name: string
          created_at: string
          created_by: string
          currency: string
          due_date: string
          effective_status: string
          grand_total: number
          id: string
          invoice_number: string
          issue_date: string
          lock_version: number
          source_quotation_id: string
          source_quote_number: string
          stored_status: Database["public"]["Enums"]["invoice_status"]
          subject: string
          total_count: number
          updated_at: string
        }[]
      }
      search_quotations: {
        Args: {
          assigned_filter?: string
          date_from?: string
          date_to?: string
          page_offset?: number
          page_size?: number
          search_term?: string
          sort_order?: string
          status_filter?: string
        }
        Returns: {
          assigned_name: string
          assigned_to: string
          client_id: string
          client_name: string
          created_at: string
          created_by: string
          currency: string
          effective_status: string
          expiry_date: string
          grand_total: number
          id: string
          issue_date: string
          lock_version: number
          quote_number: string
          revision_number: number
          stored_status: Database["public"]["Enums"]["quotation_status"]
          subject: string
          total_count: number
          updated_at: string
        }[]
      }
      search_staff_profiles: {
        Args: {
          page_offset?: number
          page_size?: number
          role_filter?: Database["public"]["Enums"]["app_role"]
          search_term?: string
          status_filter?: Database["public"]["Enums"]["profile_status"]
        }
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          last_seen_at: string
          phone: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["profile_status"]
          total_count: number
          updated_at: string
        }[]
      }
      set_client_archived: {
        Args: { should_archive: boolean; target_client_id: string }
        Returns: {
          alternative_phone: string | null
          archived_at: string | null
          assigned_to: string | null
          billing_address: string | null
          client_reference: string
          client_type: Database["public"]["Enums"]["client_type"]
          company_name: string | null
          contact_person: string | null
          created_at: string
          created_by: string
          display_name: string
          email: string | null
          id: string
          notes: string | null
          phone: string
          physical_address: string | null
          status: Database["public"]["Enums"]["client_status"]
          tax_number: string | null
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "clients"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      touch_profile_last_seen: { Args: never; Returns: string }
      transition_quotation: {
        Args: {
          expected_lock_version: number
          requested_cancellation_reason?: string
          requested_status: Database["public"]["Enums"]["quotation_status"]
          target_quotation_id: string
        }
        Returns: {
          accepted_at: string | null
          assigned_to: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          client_snapshot: Json
          company_snapshot: Json
          converted_at: string | null
          created_at: string
          created_by: string
          currency: string
          discount_total: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expired_at: string | null
          expiry_date: string
          grand_total: number
          id: string
          introduction: string | null
          issue_date: string
          lock_version: number
          notes: string | null
          quote_number: string
          rejected_at: string | null
          revision_number: number
          root_quotation_id: string | null
          sent_at: string | null
          snapshot_frozen_at: string | null
          snapshot_version: number
          status: Database["public"]["Enums"]["quotation_status"]
          subject: string
          subtotal: number
          supersedes_quotation_id: string | null
          tax_label: string
          tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          tax_rate: number
          tax_total: number
          taxable_subtotal: number
          terms_conditions: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "quotations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_client: {
        Args: {
          new_alternative_phone?: string
          new_assigned_to?: string
          new_billing_address?: string
          new_client_type: Database["public"]["Enums"]["client_type"]
          new_company_name?: string
          new_contact_person?: string
          new_display_name: string
          new_email?: string
          new_notes?: string
          new_phone?: string
          new_physical_address?: string
          new_tax_number?: string
          target_client_id: string
        }
        Returns: {
          alternative_phone: string | null
          archived_at: string | null
          assigned_to: string | null
          billing_address: string | null
          client_reference: string
          client_type: Database["public"]["Enums"]["client_type"]
          company_name: string | null
          contact_person: string | null
          created_at: string
          created_by: string
          display_name: string
          email: string | null
          id: string
          notes: string | null
          phone: string
          physical_address: string | null
          status: Database["public"]["Enums"]["client_status"]
          tax_number: string | null
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "clients"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_company_settings: {
        Args: {
          new_address: string
          new_alternative_email: string
          new_alternative_phone: string
          new_banking_details: Json
          new_ceo_name: string
          new_client_prefix: string
          new_company_name: string
          new_default_currency: string
          new_default_invoice_terms: string
          new_default_quote_terms: string
          new_default_tax_rate: number
          new_ecocash_details: Json
          new_google_maps_embed_url: string
          new_google_maps_query: string
          new_invoice_prefix: string
          new_land_listing_prefix: string
          new_logo_path: string
          new_primary_email: string
          new_primary_phone: string
          new_quote_prefix: string
          new_receipt_prefix: string
          new_slogan: string
          new_social_links: Json
          new_tax_details: Json
          target_settings_id: string
        }
        Returns: {
          address: string
          alternative_email: string | null
          alternative_phone: string | null
          banking_details: Json
          ceo_name: string
          client_prefix: string
          company_name: string
          created_at: string
          default_currency: string
          default_invoice_due_days: number
          default_invoice_terms: string
          default_quote_terms: string
          default_quote_validity_days: number
          default_tax_label: string
          default_tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          default_tax_rate: number
          ecocash_details: Json
          google_maps_embed_url: string | null
          google_maps_query: string | null
          id: string
          invoice_prefix: string
          land_listing_prefix: string
          logo_path: string | null
          payment_prefix: string
          primary_email: string
          primary_phone: string
          quote_prefix: string
          receipt_prefix: string
          slogan: string
          social_links: Json
          tax_details: Json
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "company_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_document_defaults: {
        Args: {
          new_invoice_due_days: number
          new_quote_validity_days: number
          new_tax_label: string
          new_tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          target_settings_id: string
        }
        Returns: {
          address: string
          alternative_email: string | null
          alternative_phone: string | null
          banking_details: Json
          ceo_name: string
          client_prefix: string
          company_name: string
          created_at: string
          default_currency: string
          default_invoice_due_days: number
          default_invoice_terms: string
          default_quote_terms: string
          default_quote_validity_days: number
          default_tax_label: string
          default_tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          default_tax_rate: number
          ecocash_details: Json
          google_maps_embed_url: string | null
          google_maps_query: string | null
          id: string
          invoice_prefix: string
          land_listing_prefix: string
          logo_path: string | null
          payment_prefix: string
          primary_email: string
          primary_phone: string
          quote_prefix: string
          receipt_prefix: string
          slogan: string
          social_links: Json
          tax_details: Json
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "company_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_invoice: {
        Args: {
          expected_lock_version: number
          new_client_id: string
          new_currency: string
          new_discount_type: Database["public"]["Enums"]["discount_type"]
          new_discount_value: number
          new_due_date: string
          new_issue_date: string
          new_items: Json
          new_notes: string
          new_subject: string
          new_tax_label: string
          new_tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          new_tax_rate: number
          new_terms_conditions: string
          target_invoice_id: string
        }
        Returns: {
          amount_paid: number
          balance_due: number
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          client_snapshot: Json
          company_snapshot: Json
          created_at: string
          created_by: string
          currency: string
          discount_total: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          due_date: string
          grand_total: number
          id: string
          invoice_number: string | null
          issue_date: string
          issued_at: string | null
          issued_by: string | null
          lock_version: number
          notes: string | null
          payment_state: Database["public"]["Enums"]["payment_state"]
          snapshot_frozen_at: string | null
          snapshot_version: number
          source_quotation_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subject: string
          subtotal: number
          tax_label: string
          tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          tax_rate: number
          tax_total: number
          taxable_subtotal: number
          terms_conditions: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_land_development: {
        Args: {
          new_address?: string
          new_city_town?: string
          new_description?: string
          new_development_type: string
          new_internal_notes?: string
          new_land_size_unit?: string
          new_location: string
          new_name: string
          new_province?: string
          new_slug: string
          new_status?: Database["public"]["Enums"]["land_development_status"]
          new_total_land_size?: number
          target_id: string
        }
        Returns: {
          address: string | null
          archived_at: string | null
          city_town: string | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          development_type: string
          id: string
          internal_notes: string | null
          land_size_unit: string | null
          latitude: number | null
          location: string
          longitude: number | null
          name: string
          province: string | null
          reference_number: string
          slug: string
          status: Database["public"]["Enums"]["land_development_status"]
          total_land_size: number | null
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "land_developments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_land_unit: {
        Args: {
          new_asking_price?: number
          new_availability_status?: Database["public"]["Enums"]["land_unit_availability_status"]
          new_currency?: string
          new_description?: string
          new_internal_notes?: string
          new_land_size: number
          new_land_size_unit: string
          new_location_description?: string
          new_property_type: Database["public"]["Enums"]["land_unit_property_type"]
          new_slug: string
          new_stand_number: string
          new_title?: string
          new_verification_status?: Database["public"]["Enums"]["land_unit_verification_status"]
          target_id: string
        }
        Returns: {
          archived_at: string | null
          asking_price: number | null
          availability_status: Database["public"]["Enums"]["land_unit_availability_status"]
          created_at: string
          created_by: string
          currency: string
          description: string | null
          development_id: string
          id: string
          internal_notes: string | null
          internal_reference: string
          land_size: number
          land_size_unit: string
          location_description: string | null
          property_type: Database["public"]["Enums"]["land_unit_property_type"]
          slug: string
          stand_number: string
          title: string | null
          updated_at: string
          updated_by: string
          verification_status: Database["public"]["Enums"]["land_unit_verification_status"]
        }
        SetofOptions: {
          from: "*"
          to: "land_units"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_quotation: {
        Args: {
          expected_lock_version: number
          new_assigned_to: string
          new_client_id: string
          new_currency: string
          new_discount_type: Database["public"]["Enums"]["discount_type"]
          new_discount_value: number
          new_expiry_date: string
          new_introduction: string
          new_issue_date: string
          new_items: Json
          new_notes: string
          new_subject: string
          new_tax_label: string
          new_tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          new_tax_rate: number
          new_terms_conditions: string
          target_quotation_id: string
        }
        Returns: {
          accepted_at: string | null
          assigned_to: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          client_snapshot: Json
          company_snapshot: Json
          converted_at: string | null
          created_at: string
          created_by: string
          currency: string
          discount_total: number
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expired_at: string | null
          expiry_date: string
          grand_total: number
          id: string
          introduction: string | null
          issue_date: string
          lock_version: number
          notes: string | null
          quote_number: string
          rejected_at: string | null
          revision_number: number
          root_quotation_id: string | null
          sent_at: string | null
          snapshot_frozen_at: string | null
          snapshot_version: number
          status: Database["public"]["Enums"]["quotation_status"]
          subject: string
          subtotal: number
          supersedes_quotation_id: string | null
          tax_label: string
          tax_mode: Database["public"]["Enums"]["document_tax_mode"]
          tax_rate: number
          tax_total: number
          taxable_subtotal: number
          terms_conditions: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "quotations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "administrator" | "staff" | "accountant" | "viewer"
      client_status: "active" | "archived"
      client_type: "individual" | "company"
      discount_type: "none" | "percentage" | "fixed"
      document_item_type: "service" | "product" | "fee" | "other"
      document_tax_mode: "exclusive" | "inclusive"
      invoice_status: "draft" | "issued" | "cancelled"
      land_development_status: "draft" | "active" | "completed" | "archived"
      land_media_approval: "pending" | "approved" | "rejected"
      land_media_type:
        | "photo"
        | "site_plan"
        | "map"
        | "brochure"
        | "survey_document"
        | "title_document"
        | "other_document"
      land_media_visibility: "internal" | "public_candidate"
      land_unit_availability_status:
        | "draft"
        | "available"
        | "reserved"
        | "sold"
        | "unavailable"
        | "archived"
      land_unit_property_type:
        | "residential"
        | "commercial"
        | "industrial"
        | "agricultural"
        | "mixed_use"
        | "development"
        | "other"
      land_unit_verification_status: "unverified" | "under_review" | "verified"
      payment_state: "unpaid" | "partially_paid" | "paid"
      profile_status: "active" | "inactive"
      quotation_status:
        | "draft"
        | "sent"
        | "accepted"
        | "rejected"
        | "expired"
        | "cancelled"
        | "converted"
        | "superseded"
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
      app_role: ["administrator", "staff", "accountant", "viewer"],
      client_status: ["active", "archived"],
      client_type: ["individual", "company"],
      discount_type: ["none", "percentage", "fixed"],
      document_item_type: ["service", "product", "fee", "other"],
      document_tax_mode: ["exclusive", "inclusive"],
      invoice_status: ["draft", "issued", "cancelled"],
      land_development_status: ["draft", "active", "completed", "archived"],
      land_media_approval: ["pending", "approved", "rejected"],
      land_media_type: [
        "photo",
        "site_plan",
        "map",
        "brochure",
        "survey_document",
        "title_document",
        "other_document",
      ],
      land_media_visibility: ["internal", "public_candidate"],
      land_unit_availability_status: [
        "draft",
        "available",
        "reserved",
        "sold",
        "unavailable",
        "archived",
      ],
      land_unit_property_type: [
        "residential",
        "commercial",
        "industrial",
        "agricultural",
        "mixed_use",
        "development",
        "other",
      ],
      land_unit_verification_status: ["unverified", "under_review", "verified"],
      payment_state: ["unpaid", "partially_paid", "paid"],
      profile_status: ["active", "inactive"],
      quotation_status: [
        "draft",
        "sent",
        "accepted",
        "rejected",
        "expired",
        "cancelled",
        "converted",
        "superseded",
      ],
    },
  },
} as const
