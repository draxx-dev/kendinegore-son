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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_group_id: string | null
          business_id: string
          created_at: string
          customer_id: string
          end_time: string
          id: string
          notes: string | null
          service_id: string
          staff_id: string | null
          start_time: string
          status: string | null
          total_price: number
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_group_id?: string | null
          business_id: string
          created_at?: string
          customer_id: string
          end_time: string
          id?: string
          notes?: string | null
          service_id: string
          staff_id?: string | null
          start_time: string
          status?: string | null
          total_price?: number
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_group_id?: string | null
          business_id?: string
          created_at?: string
          customer_id?: string
          end_time?: string
          id?: string
          notes?: string | null
          service_id?: string
          staff_id?: string | null
          start_time?: string
          status?: string | null
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          description: string | null
          district: string | null
          email: string | null
          id: string
          name: string
          owner_id: string
          phone: string | null
          show_email_in_booking: boolean | null
          show_phone_in_booking: boolean | null
          slug: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          email?: string | null
          id?: string
          name: string
          owner_id: string
          phone?: string | null
          show_email_in_booking?: boolean | null
          show_phone_in_booking?: boolean | null
          slug: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          email?: string | null
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          show_email_in_booking?: boolean | null
          show_phone_in_booking?: boolean | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          business_id: string
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          business_id: string
          category: string
          created_at: string
          description: string
          expense_date: string
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          business_id: string
          category: string
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          business_id?: string
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string
          created_at: string
          expected_payment_date: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string
          payment_status: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id: string
          created_at?: string
          expected_payment_date?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method: string
          payment_status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string
          created_at?: string
          expected_payment_date?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string
          payment_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_id: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          business_id: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          password_hash: string | null
          permissions: Json | null
          phone: string | null
          profile_image_url: string | null
          specialties: string[] | null
          temp_password: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          password_hash?: string | null
          permissions?: Json | null
          phone?: string | null
          profile_image_url?: string | null
          specialties?: string[] | null
          temp_password?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          password_hash?: string | null
          permissions?: Json | null
          phone?: string | null
          profile_image_url?: string | null
          specialties?: string[] | null
          temp_password?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      staff_role_assignments: {
        Row: {
          granted_at: string
          granted_by: string
          id: string
          permission_id: string
          staff_id: string
        }
        Insert: {
          granted_at?: string
          granted_by: string
          id?: string
          permission_id: string
          staff_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string
          id?: string
          permission_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_role_assignments_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "staff_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      working_hours: {
        Row: {
          business_id: string | null
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_closed: boolean | null
          staff_id: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_closed?: boolean | null
          staff_id?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_closed?: boolean | null
          staff_id?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_hours_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_staff: {
        Args: { business_email_param: string; staff_password_param: string }
        Returns: Json
      }
      create_default_working_hours: {
        Args: { business_id_param: string }
        Returns: undefined
      }
      generate_business_slug: {
        Args: {
          business_name: string
          city_name?: string
          district_name?: string
        }
        Returns: string
      }
      staff_has_permission: {
        Args: { permission_name_param: string; staff_id_param: string }
        Returns: boolean
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
  public: {
    Enums: {},
  },
} as const
