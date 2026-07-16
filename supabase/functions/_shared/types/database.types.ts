export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chunking_strategy: {
        Row: {
          best_for: string | null
          created_at: string
          description: string | null
          display_name: string
          id: number
          is_enabled: boolean | null
          name: string
        }
        Insert: {
          best_for?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          id?: never
          is_enabled?: boolean | null
          name: string
        }
        Update: {
          best_for?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          id?: never
          is_enabled?: boolean | null
          name?: string
        }
        Relationships: []
      }
      chunks: {
        Row: {
          document_id: number
          embedding: string | null
          embedding_model: string | null
          id: number
          next_chunk_id: number | null
          prev_chunk_id: number | null
          txt: string
        }
        Insert: {
          document_id: number
          embedding?: string | null
          embedding_model?: string | null
          id?: never
          next_chunk_id?: number | null
          prev_chunk_id?: number | null
          txt: string
        }
        Update: {
          document_id?: number
          embedding?: string | null
          embedding_model?: string | null
          id?: never
          next_chunk_id?: number | null
          prev_chunk_id?: number | null
          txt?: string
        }
        Relationships: [
          {
            foreignKeyName: "chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chunks_next_chunk_id_fkey"
            columns: ["next_chunk_id"]
            isOneToOne: false
            referencedRelation: "chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chunks_prev_chunk_id_fkey"
            columns: ["prev_chunk_id"]
            isOneToOne: false
            referencedRelation: "chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: number
          metadata: Json | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: never
          metadata?: Json | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: never
          metadata?: Json | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      document_status: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: never
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: never
          name?: string
        }
        Relationships: []
      }
      document_status_transition: {
        Row: {
          created_at: string
          from_status_id: number
          id: number
          to_status_id: number
        }
        Insert: {
          created_at?: string
          from_status_id: number
          id?: never
          to_status_id: number
        }
        Update: {
          created_at?: string
          from_status_id?: number
          id?: never
          to_status_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_status_transition_from_status_id_fkey"
            columns: ["from_status_id"]
            isOneToOne: false
            referencedRelation: "document_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_status_transition_to_status_id_fkey"
            columns: ["to_status_id"]
            isOneToOne: false
            referencedRelation: "document_status"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          chunk_strategy_id: number
          collection_id: number
          created_at: string
          created_by: string
          id: number
          metadata: Json | null
          name: string
          path: string
          status_id: number
          updated_at: string
        }
        Insert: {
          chunk_strategy_id: number
          collection_id: number
          created_at?: string
          created_by: string
          id?: never
          metadata?: Json | null
          name: string
          path: string
          status_id: number
          updated_at?: string
        }
        Update: {
          chunk_strategy_id?: number
          collection_id?: number
          created_at?: string
          created_by?: string
          id?: never
          metadata?: Json | null
          name?: string
          path?: string
          status_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_chunk_strategy_id_fkey"
            columns: ["chunk_strategy_id"]
            isOneToOne: false
            referencedRelation: "chunking_strategy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "document_status"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          deleted_at: string | null
          first_name: string
          last_name: string
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          first_name: string
          last_name: string
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          first_name?: string
          last_name?: string
          storage_path?: string
          updated_at?: string
          user_id?: string
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

