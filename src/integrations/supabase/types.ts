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
      competitor_snapshots: {
        Row: {
          changes: Json | null
          competitor_id: string
          created_at: string
          customer_id: string
          id: string
          snapshot: Json
          summary: string | null
        }
        Insert: {
          changes?: Json | null
          competitor_id: string
          created_at?: string
          customer_id: string
          id?: string
          snapshot: Json
          summary?: string | null
        }
        Update: {
          changes?: Json | null
          competitor_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          snapshot?: Json
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_snapshots_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_snapshots_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          active: boolean
          competitor_name: string | null
          competitor_url: string
          created_at: string
          customer_id: string
          id: string
          last_checked_at: string | null
          next_check_at: string
          source: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          competitor_name?: string | null
          competitor_url: string
          created_at?: string
          customer_id: string
          id?: string
          last_checked_at?: string | null
          next_check_at?: string
          source?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          competitor_name?: string | null
          competitor_url?: string
          created_at?: string
          customer_id?: string
          id?: string
          last_checked_at?: string | null
          next_check_at?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitors_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_updates: {
        Row: {
          body: string
          created_at: string
          customer_id: string
          done: boolean
          id: string
          title: string
          type: string
        }
        Insert: {
          body: string
          created_at?: string
          customer_id: string
          done?: boolean
          id?: string
          title: string
          type: string
        }
        Update: {
          body?: string
          created_at?: string
          customer_id?: string
          done?: boolean
          id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_updates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          shop_name: string | null
          shop_url: string | null
          status: string
          subscription_end: string | null
          subscription_start: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          shop_name?: string | null
          shop_url?: string | null
          status?: string
          subscription_end?: string | null
          subscription_start?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          shop_name?: string | null
          shop_url?: string | null
          status?: string
          subscription_end?: string | null
          subscription_start?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      early_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          ip: unknown
          shop_url: string | null
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip?: unknown
          shop_url?: string | null
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip?: unknown
          shop_url?: string | null
          source?: string
        }
        Relationships: []
      }
      marketing_plans: {
        Row: {
          analysis_id: string | null
          created_at: string
          customer_id: string
          id: string
          plan: Json
          store_url: string
        }
        Insert: {
          analysis_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          plan: Json
          store_url: string
        }
        Update: {
          analysis_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          plan?: Json
          store_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_plans_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "store_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_plans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          updated_at: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string
          metadata: Json
          resolved_at: string | null
          severity: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          message: string
          metadata?: Json
          resolved_at?: string | null
          severity: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          metadata?: Json
          resolved_at?: string | null
          severity?: string
        }
        Relationships: []
      }
      signup_attempts: {
        Row: {
          created_at: string
          email_hash: string | null
          id: string
          ip_hash: string | null
          reason: string | null
          source: string | null
          status: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email_hash?: string | null
          id?: string
          ip_hash?: string | null
          reason?: string | null
          source?: string | null
          status: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email_hash?: string | null
          id?: string
          ip_hash?: string | null
          reason?: string | null
          source?: string | null
          status?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      store_analyses: {
        Row: {
          created_at: string
          customer_id: string | null
          email: string | null
          id: string
          next_refresh_at: string | null
          report: Json
          snapshot: Json
          store_url: string
          tier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          next_refresh_at?: string | null
          report?: Json
          snapshot?: Json
          store_url: string
          tier?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          next_refresh_at?: string | null
          report?: Json
          snapshot?: Json
          store_url?: string
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_analyses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_requests: {
        Row: {
          amount_sar: number
          created_at: string
          email: string
          full_name: string
          id: string
          ip_hash: string | null
          notes: string | null
          payment_method: string
          phone: string | null
          reference: string | null
          reviewed_at: string | null
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          amount_sar?: number
          created_at?: string
          email: string
          full_name: string
          id?: string
          ip_hash?: string | null
          notes?: string | null
          payment_method: string
          phone?: string | null
          reference?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          amount_sar?: number
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          ip_hash?: string | null
          notes?: string | null
          payment_method?: string
          phone?: string | null
          reference?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      visitor_pings: {
        Row: {
          created_at: string
          id: string
          ip_hash: string
          path: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash: string
          path?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string
          path?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_telemetry: { Args: never; Returns: undefined }
      detect_signup_spike: { Args: never; Returns: undefined }
      log_signup_attempt: {
        Args: {
          _email_hash: string
          _ip_hash: string
          _reason: string
          _source: string
          _status: string
          _user_agent: string
        }
        Returns: undefined
      }
      record_visitor_ping: {
        Args: { _ip_hash: string; _path: string }
        Returns: {
          active_now: number
          today_total: number
        }[]
      }
      rl_hit: {
        Args: { _key: string; _limit: number; _window_seconds: number }
        Returns: {
          allowed: boolean
          remaining: number
          retry_after: number
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
  public: {
    Enums: {},
  },
} as const
