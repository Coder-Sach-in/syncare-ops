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
      ai_insights: {
        Row: {
          center_id: string | null
          description: string
          generated_at: string
          id: string
          insight_type: string
          related_center_id: string | null
          severity: string
          title: string
        }
        Insert: {
          center_id?: string | null
          description: string
          generated_at?: string
          id?: string
          insight_type: string
          related_center_id?: string | null
          severity: string
          title: string
        }
        Update: {
          center_id?: string | null
          description?: string
          generated_at?: string
          id?: string
          insight_type?: string
          related_center_id?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_related_center_id_fkey"
            columns: ["related_center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          center_id: string
          created_at: string
          id: string
          last_marked_at: string | null
          name: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          center_id: string
          created_at?: string
          id?: string
          last_marked_at?: string | null
          name: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          center_id?: string
          created_at?: string
          id?: string
          last_marked_at?: string | null
          name?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      beds: {
        Row: {
          available: boolean
          center_id: string
          count: number
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          available?: boolean
          center_id: string
          count?: number
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          available?: boolean
          center_id?: string
          count?: number
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beds_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      centers: {
        Row: {
          center_name: string
          center_type: Database["public"]["Enums"]["center_type"]
          created_at: string
          district: string
          id: string
        }
        Insert: {
          center_name: string
          center_type: Database["public"]["Enums"]["center_type"]
          created_at?: string
          district?: string
          id?: string
        }
        Update: {
          center_name?: string
          center_type?: Database["public"]["Enums"]["center_type"]
          created_at?: string
          district?: string
          id?: string
        }
        Relationships: []
      }
      pathology_labs: {
        Row: {
          center_id: string
          created_at: string
          id: string
          report_status: string
          sample_status: string
          test_name: string
          turnaround_time_hours: number
          updated_at: string
        }
        Insert: {
          center_id: string
          created_at?: string
          id?: string
          report_status?: string
          sample_status?: string
          test_name: string
          turnaround_time_hours?: number
          updated_at?: string
        }
        Update: {
          center_id?: string
          created_at?: string
          id?: string
          report_status?: string
          sample_status?: string
          test_name?: string
          turnaround_time_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathology_labs_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          center_id: string | null
          created_at: string
          full_name: string
          id: string
        }
        Insert: {
          center_id?: string | null
          created_at?: string
          full_name?: string
          id: string
        }
        Update: {
          center_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      requisition_requests: {
        Row: {
          center_id: string
          id: string
          item_name: string
          item_type: string
          quantity_requested: number
          requested_at: string
          requested_by: string | null
          resolved_at: string | null
          status: string
        }
        Insert: {
          center_id: string
          id?: string
          item_name: string
          item_type: string
          quantity_requested?: number
          requested_at?: string
          requested_by?: string | null
          resolved_at?: string | null
          status?: string
        }
        Update: {
          center_id?: string
          id?: string
          item_name?: string
          item_type?: string
          quantity_requested?: number
          requested_at?: string
          requested_by?: string | null
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "requisition_requests_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock: {
        Row: {
          center_id: string
          created_at: string
          id: string
          name: string
          stock: number
          updated_at: string
        }
        Insert: {
          center_id: string
          created_at?: string
          id?: string
          name: string
          stock?: number
          updated_at?: string
        }
        Update: {
          center_id?: string
          created_at?: string
          id?: string
          name?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          available: boolean
          center_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          available?: boolean
          center_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          available?: boolean
          center_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_center_id_fkey"
            columns: ["center_id"]
            isOneToOne: false
            referencedRelation: "centers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      current_center_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_district_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "district_admin" | "center_staff"
      center_type: "PHC" | "CHC"
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
      app_role: ["district_admin", "center_staff"],
      center_type: ["PHC", "CHC"],
    },
  },
} as const
