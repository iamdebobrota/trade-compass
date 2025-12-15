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
      trade_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          new_value: Json | null
          old_value: Json | null
          trade_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          trade_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_events_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          closed_at: string | null
          created_at: string
          current_price: number | null
          current_sl_price: number
          direction: Database["public"]["Enums"]["trade_direction"]
          entry_price: number
          exit_price: number | null
          exit_reason: string | null
          id: string
          initial_sl_price: number
          notes: string | null
          pnl: number | null
          pnl_percent: number | null
          quantity: number
          segment: Database["public"]["Enums"]["market_segment"]
          signal_source: string | null
          status: Database["public"]["Enums"]["trade_status"]
          symbol: string
          target_price: number | null
          trailing_activated: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          current_price?: number | null
          current_sl_price: number
          direction?: Database["public"]["Enums"]["trade_direction"]
          entry_price: number
          exit_price?: number | null
          exit_reason?: string | null
          id?: string
          initial_sl_price: number
          notes?: string | null
          pnl?: number | null
          pnl_percent?: number | null
          quantity: number
          segment?: Database["public"]["Enums"]["market_segment"]
          signal_source?: string | null
          status?: Database["public"]["Enums"]["trade_status"]
          symbol: string
          target_price?: number | null
          trailing_activated?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          current_price?: number | null
          current_sl_price?: number
          direction?: Database["public"]["Enums"]["trade_direction"]
          entry_price?: number
          exit_price?: number | null
          exit_reason?: string | null
          id?: string
          initial_sl_price?: number
          notes?: string | null
          pnl?: number | null
          pnl_percent?: number | null
          quantity?: number
          segment?: Database["public"]["Enums"]["market_segment"]
          signal_source?: string | null
          status?: Database["public"]["Enums"]["trade_status"]
          symbol?: string
          target_price?: number | null
          trailing_activated?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trading_settings: {
        Row: {
          alpha_vantage_api_key: string | null
          created_at: string
          current_balance: number
          default_position_size_percent: number
          id: string
          initial_capital: number
          max_trades_per_day: number | null
          stop_loss_percent: number
          trailing_activation_percent: number
          trailing_target_percent: number
          updated_at: string
          user_id: string
          webhook_secret: string | null
        }
        Insert: {
          alpha_vantage_api_key?: string | null
          created_at?: string
          current_balance?: number
          default_position_size_percent?: number
          id?: string
          initial_capital?: number
          max_trades_per_day?: number | null
          stop_loss_percent?: number
          trailing_activation_percent?: number
          trailing_target_percent?: number
          updated_at?: string
          user_id: string
          webhook_secret?: string | null
        }
        Update: {
          alpha_vantage_api_key?: string | null
          created_at?: string
          current_balance?: number
          default_position_size_percent?: number
          id?: string
          initial_capital?: number
          max_trades_per_day?: number | null
          stop_loss_percent?: number
          trailing_activation_percent?: number
          trailing_target_percent?: number
          updated_at?: string
          user_id?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      market_segment: "equity" | "forex"
      trade_direction: "long" | "short"
      trade_status:
        | "open"
        | "trailing"
        | "closed_sl"
        | "closed_target"
        | "closed_manual"
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
      market_segment: ["equity", "forex"],
      trade_direction: ["long", "short"],
      trade_status: [
        "open",
        "trailing",
        "closed_sl",
        "closed_target",
        "closed_manual",
      ],
    },
  },
} as const
