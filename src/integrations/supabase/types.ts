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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_accounts: {
        Row: {
          access_token: string
          account_id: string
          account_name: string
          alert_enabled: boolean | null
          balance: number | null
          created_at: string
          daily_spend: number | null
          email: string | null
          id: string
          last_sync_at: string | null
          min_balance_alert: number | null
          platform: string
          refresh_token: string | null
          report_objectives: string[] | null
          status: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
          client_id: string | null
          is_manager: boolean | null
        }
        Insert: {
          access_token: string
          account_id: string
          account_name: string
          alert_enabled?: boolean | null
          balance?: number | null
          created_at?: string
          daily_spend?: number | null
          email?: string | null
          id?: string
          last_sync_at?: string | null
          min_balance_alert?: number | null
          platform: string
          refresh_token?: string | null
          report_objectives?: string[] | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
          client_id?: string | null
          is_manager?: boolean | null
        }
        Update: {
          access_token?: string
          account_id?: string
          account_name?: string
          alert_enabled?: boolean | null
          balance?: number | null
          created_at?: string
          daily_spend?: number | null
          email?: string | null
          id?: string
          last_sync_at?: string | null
          min_balance_alert?: number | null
          platform?: string
          refresh_token?: string | null
          report_objectives?: string[] | null
          status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
          client_id?: string | null
          is_manager?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          whatsapp_group_link: string | null
          enable_balance_check: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          whatsapp_group_link?: string | null
          enable_balance_check?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          whatsapp_group_link?: string | null
          enable_balance_check?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          ad_account_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          sent_at: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          ad_account_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          sent_at?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          ad_account_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          sent_at?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_ad_account_id_fkey"
            columns: ["ad_account_id"]
            isOneToOne: false
            referencedRelation: "ad_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          balance_alert_days: string[] | null
          balance_alert_time: string | null
          balance_alerts_enabled: boolean | null
          created_at: string
          default_min_balance: number | null
          default_product_name: string | null
          email_notifications: boolean | null
          id: string
          report_day: string | null
          report_time: string | null
          telegram_chat_id: string | null
          updated_at: string
          user_id: string
          weekly_report_enabled: boolean | null
          whatsapp_group_id: string | null
        }
        Insert: {
          balance_alert_days?: string[] | null
          balance_alert_time?: string | null
          balance_alerts_enabled?: boolean | null
          created_at?: string
          default_min_balance?: number | null
          default_product_name?: string | null
          email_notifications?: boolean | null
          id?: string
          report_day?: string | null
          report_time?: string | null
          telegram_chat_id?: string | null
          updated_at?: string
          user_id: string
          weekly_report_enabled?: boolean | null
          whatsapp_group_id?: string | null
        }
        Update: {
          balance_alert_days?: string[] | null
          balance_alert_time?: string | null
          balance_alerts_enabled?: boolean | null
          created_at?: string
          default_min_balance?: number | null
          default_product_name?: string | null
          email_notifications?: boolean | null
          id?: string
          report_day?: string | null
          report_time?: string | null
          telegram_chat_id?: string | null
          updated_at?: string
          user_id?: string
          weekly_report_enabled?: boolean | null
          whatsapp_group_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          cost_per_message: number | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          messages_count: number | null
          period_end: string
          period_start: string
          product_name: string | null
          title: string
          total_investment: number | null
          user_id: string
        }
        Insert: {
          cost_per_message?: number | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          messages_count?: number | null
          period_end: string
          period_start: string
          product_name?: string | null
          title: string
          total_investment?: number | null
          user_id: string
        }
        Update: {
          cost_per_message?: number | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          messages_count?: number | null
          period_end?: string
          period_start?: string
          product_name?: string | null
          title?: string
          total_investment?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_integrations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          trigger_on_low_balance: boolean | null
          trigger_on_token_expiry: boolean | null
          updated_at: string
          user_id: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_on_low_balance?: boolean | null
          trigger_on_token_expiry?: boolean | null
          updated_at?: string
          user_id: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_on_low_balance?: boolean | null
          trigger_on_token_expiry?: boolean | null
          updated_at?: string
          user_id?: string
          webhook_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_admin_or_gestor_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "leitor"
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
      app_role: ["admin", "gestor", "leitor"],
    },
  },
} as const
