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
      appointments: {
        Row: {
          booking_key: string | null
          created_at: string
          end_iso: string
          event_id: string | null
          event_link: string | null
          id: string
          lead_email: string | null
          lead_name: string
          lead_phone: string
          start_iso: string
          status: Database["public"]["Enums"]["appointment_status"]
          tenant_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          booking_key?: string | null
          created_at?: string
          end_iso: string
          event_id?: string | null
          event_link?: string | null
          id?: string
          lead_email?: string | null
          lead_name: string
          lead_phone: string
          start_iso: string
          status?: Database["public"]["Enums"]["appointment_status"]
          tenant_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          booking_key?: string | null
          created_at?: string
          end_iso?: string
          event_id?: string | null
          event_link?: string | null
          id?: string
          lead_email?: string | null
          lead_name?: string
          lead_phone?: string
          start_iso?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          tenant_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      assistants: {
        Row: {
          created_at: string
          first_message: string | null
          id: string
          is_active: boolean
          model: string | null
          name: string
          system_prompt: string | null
          tenant_id: string
          updated_at: string
          vapi_assistant_id: string | null
          voice: string | null
        }
        Insert: {
          created_at?: string
          first_message?: string | null
          id?: string
          is_active?: boolean
          model?: string | null
          name: string
          system_prompt?: string | null
          tenant_id: string
          updated_at?: string
          vapi_assistant_id?: string | null
          voice?: string | null
        }
        Update: {
          created_at?: string
          first_message?: string | null
          id?: string
          is_active?: boolean
          model?: string | null
          name?: string
          system_prompt?: string | null
          tenant_id?: string
          updated_at?: string
          vapi_assistant_id?: string | null
          voice?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assistants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          details_json: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          tenant_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          details_json?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          tenant_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          details_json?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      call_events: {
        Row: {
          created_at: string
          id: string
          payload_json: Json | null
          provider_event_id: string | null
          tenant_id: string
          type: string
          vapi_call_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload_json?: Json | null
          provider_event_id?: string | null
          tenant_id: string
          type: string
          vapi_call_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload_json?: Json | null
          provider_event_id?: string | null
          tenant_id?: string
          type?: string
          vapi_call_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          assistant_id: string | null
          cost_total: number | null
          created_at: string
          direction: Database["public"]["Enums"]["call_direction"]
          duration_sec: number | null
          ended_at: string | null
          extracted_json: Json | null
          from_e164: string | null
          id: string
          number_id: string | null
          outcome: Database["public"]["Enums"]["call_outcome"] | null
          recording_url: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["call_status"]
          summary: string | null
          tenant_id: string
          to_e164: string | null
          transcript_text: string | null
          updated_at: string
          vapi_call_id: string
        }
        Insert: {
          assistant_id?: string | null
          cost_total?: number | null
          created_at?: string
          direction: Database["public"]["Enums"]["call_direction"]
          duration_sec?: number | null
          ended_at?: string | null
          extracted_json?: Json | null
          from_e164?: string | null
          id?: string
          number_id?: string | null
          outcome?: Database["public"]["Enums"]["call_outcome"] | null
          recording_url?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          summary?: string | null
          tenant_id: string
          to_e164?: string | null
          transcript_text?: string | null
          updated_at?: string
          vapi_call_id: string
        }
        Update: {
          assistant_id?: string | null
          cost_total?: number | null
          created_at?: string
          direction?: Database["public"]["Enums"]["call_direction"]
          duration_sec?: number | null
          ended_at?: string | null
          extracted_json?: Json | null
          from_e164?: string | null
          id?: string
          number_id?: string | null
          outcome?: Database["public"]["Enums"]["call_outcome"] | null
          recording_url?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["call_status"]
          summary?: string | null
          tenant_id?: string
          to_e164?: string | null
          transcript_text?: string | null
          updated_at?: string
          vapi_call_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calls_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_number_id_fkey"
            columns: ["number_id"]
            isOneToOne: false
            referencedRelation: "phone_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          api_key_encrypted: string | null
          config_json: Json | null
          created_at: string
          id: string
          provider: Database["public"]["Enums"]["integration_provider"]
          status: Database["public"]["Enums"]["integration_status"]
          tenant_id: string
          updated_at: string
          webhook_secret_encrypted: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          config_json?: Json | null
          created_at?: string
          id?: string
          provider: Database["public"]["Enums"]["integration_provider"]
          status?: Database["public"]["Enums"]["integration_status"]
          tenant_id: string
          updated_at?: string
          webhook_secret_encrypted?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          config_json?: Json | null
          created_at?: string
          id?: string
          provider?: Database["public"]["Enums"]["integration_provider"]
          status?: Database["public"]["Enums"]["integration_status"]
          tenant_id?: string
          updated_at?: string
          webhook_secret_encrypted?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_numbers: {
        Row: {
          assistant_id: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string | null
          phone_number: string
          provider: string | null
          tenant_id: string
          updated_at: string
          vapi_number_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string | null
          phone_number: string
          provider?: string | null
          tenant_id: string
          updated_at?: string
          vapi_number_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string | null
          phone_number?: string
          provider?: string | null
          tenant_id?: string
          updated_at?: string
          vapi_number_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_numbers_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_numbers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          timezone: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          timezone?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          timezone?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          google_sub: string | null
          id: string
          picture_url: string | null
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          google_sub?: string | null
          id?: string
          picture_url?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          google_sub?: string | null
          id?: string
          picture_url?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      is_member_of_tenant: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      is_owner_or_admin: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "OWNER" | "ADMIN" | "AGENT" | "VIEWER"
      appointment_status: "booked" | "rescheduled" | "cancelled"
      call_direction: "inbound" | "outbound"
      call_outcome: "booked" | "qualified" | "not_qualified" | "other"
      call_status: "queued" | "ringing" | "in-progress" | "forwarding" | "ended"
      integration_provider:
        | "vapi"
        | "google_calendar"
        | "openai"
        | "elevenlabs"
        | "twilio"
      integration_status: "connected" | "disconnected"
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
      app_role: ["OWNER", "ADMIN", "AGENT", "VIEWER"],
      appointment_status: ["booked", "rescheduled", "cancelled"],
      call_direction: ["inbound", "outbound"],
      call_outcome: ["booked", "qualified", "not_qualified", "other"],
      call_status: ["queued", "ringing", "in-progress", "forwarding", "ended"],
      integration_provider: [
        "vapi",
        "google_calendar",
        "openai",
        "elevenlabs",
        "twilio",
      ],
      integration_status: ["connected", "disconnected"],
    },
  },
} as const
