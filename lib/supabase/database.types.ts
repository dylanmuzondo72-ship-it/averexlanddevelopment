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
          default_invoice_terms: string
          default_quote_terms: string
          default_tax_rate: number
          ecocash_details: Json
          google_maps_embed_url: string | null
          google_maps_query: string | null
          id: string
          invoice_prefix: string
          land_listing_prefix: string
          logo_path: string | null
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
          default_invoice_terms?: string
          default_quote_terms?: string
          default_tax_rate?: number
          ecocash_details?: Json
          google_maps_embed_url?: string | null
          google_maps_query?: string | null
          id?: string
          invoice_prefix?: string
          land_listing_prefix?: string
          logo_path?: string | null
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
          default_invoice_terms?: string
          default_quote_terms?: string
          default_tax_rate?: number
          ecocash_details?: Json
          google_maps_embed_url?: string | null
          google_maps_query?: string | null
          id?: string
          invoice_prefix?: string
          land_listing_prefix?: string
          logo_path?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
          default_invoice_terms: string
          default_quote_terms: string
          default_tax_rate: number
          ecocash_details: Json
          google_maps_embed_url: string | null
          google_maps_query: string | null
          id: string
          invoice_prefix: string
          land_listing_prefix: string
          logo_path: string | null
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
    }
    Enums: {
      app_role: "administrator" | "staff" | "accountant" | "viewer"
      client_status: "active" | "archived"
      client_type: "individual" | "company"
      profile_status: "active" | "inactive"
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
      profile_status: ["active", "inactive"],
    },
  },
} as const
