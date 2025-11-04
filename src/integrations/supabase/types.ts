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
  public: {
    Tables: {
      chat_rate_limits: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          request_count: number | null
          session_id: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          request_count?: number | null
          session_id: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          request_count?: number | null
          session_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_sst_assignments: {
        Row: {
          assigned_at: string | null
          company_id: string
          id: string
          sst_manager_id: string
        }
        Insert: {
          assigned_at?: string | null
          company_id: string
          id?: string
          sst_manager_id: string
        }
        Update: {
          assigned_at?: string | null
          company_id?: string
          id?: string
          sst_manager_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_sst_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_sst_assignments_sst_manager_id_fkey"
            columns: ["sst_manager_id"]
            isOneToOne: false
            referencedRelation: "sst_managers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          full_name: string | null
          id: string
          sst_manager_id: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          sst_manager_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          sst_manager_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_sst_manager_id_fkey"
            columns: ["sst_manager_id"]
            isOneToOne: false
            referencedRelation: "sst_managers"
            referencedColumns: ["id"]
          },
        ]
      }
      report_updates: {
        Row: {
          created_at: string
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
          report_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
          report_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
          report_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_updates_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          category: string
          company_id: string
          created_at: string
          department: string | null
          description: string
          id: string
          is_anonymous: boolean
          reporter_email: string | null
          reporter_name: string | null
          reporter_phone: string | null
          status: string
          title: string
          tracking_code: string | null
          updated_at: string
          urgency: string
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          department?: string | null
          description: string
          id?: string
          is_anonymous?: boolean
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          status?: string
          title: string
          tracking_code?: string | null
          updated_at?: string
          urgency?: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          department?: string | null
          description?: string
          id?: string
          is_anonymous?: boolean
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          status?: string
          title?: string
          tracking_code?: string | null
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sst_managers: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      generate_tracking_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "company" | "sst" | "pending"
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
      app_role: ["admin", "company", "sst", "pending"],
    },
  },
} as const
