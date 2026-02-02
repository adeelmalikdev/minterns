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
      applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          id: string
          opportunity_id: string
          resume_url: string | null
          status: Database["public"]["Enums"]["application_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          opportunity_id: string
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          opportunity_id?: string
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          application_id: string
          id: string
          issued_at: string
          student_id: string
          verification_code: string
        }
        Insert: {
          application_id: string
          id?: string
          issued_at?: string
          student_id: string
          verification_code?: string
        }
        Update: {
          application_id?: string
          id?: string
          issued_at?: string
          student_id?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          application_id: string
          created_at: string
          id: string
          recruiter_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          recruiter_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          recruiter_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          application_id: string
          comments: string | null
          created_at: string
          evaluator_id: string
          id: string
          rating: number
          skills_demonstrated: string[]
        }
        Insert: {
          application_id: string
          comments?: string | null
          created_at?: string
          evaluator_id: string
          id?: string
          rating: number
          skills_demonstrated?: string[]
        }
        Update: {
          application_id?: string
          comments?: string | null
          created_at?: string
          evaluator_id?: string
          id?: string
          rating?: number
          skills_demonstrated?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "feedback_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          company_name: string
          created_at: string
          deadline: string | null
          description: string
          duration_hours: number
          id: string
          is_remote: boolean
          level: Database["public"]["Enums"]["opportunity_level"]
          location: string | null
          max_applicants: number | null
          recruiter_id: string
          skills_required: string[]
          status: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          deadline?: string | null
          description: string
          duration_hours?: number
          id?: string
          is_remote?: boolean
          level?: Database["public"]["Enums"]["opportunity_level"]
          location?: string | null
          max_applicants?: number | null
          recruiter_id: string
          skills_required?: string[]
          status?: Database["public"]["Enums"]["opportunity_status"]
          title: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          deadline?: string | null
          description?: string
          duration_hours?: number
          id?: string
          is_remote?: boolean
          level?: Database["public"]["Enums"]["opportunity_level"]
          location?: string | null
          max_applicants?: number | null
          recruiter_id?: string
          skills_required?: string[]
          status?: Database["public"]["Enums"]["opportunity_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deletion_requested_at: string | null
          deletion_scheduled_for: string | null
          email: string
          full_name: string | null
          id: string
          is_deactivated: boolean | null
          language_preference: string | null
          theme_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_deactivated?: boolean | null
          language_preference?: string | null
          theme_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_deactivated?: boolean | null
          language_preference?: string | null
          theme_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_submissions: {
        Row: {
          application_id: string
          feedback: string | null
          id: string
          notes: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submission_url: string | null
          submitted_at: string
          task_id: string | null
        }
        Insert: {
          application_id: string
          feedback?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submission_url?: string | null
          submitted_at?: string
          task_id?: string | null
        }
        Update: {
          application_id?: string
          feedback?: string | null
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          student_id?: string
          submission_url?: string | null
          submitted_at?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_days: number | null
          id: string
          opportunity_id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_days?: number | null
          id?: string
          opportunity_id: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_days?: number | null
          id?: string
          opportunity_id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_2fa: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          id: string
          totp_enabled: boolean | null
          totp_secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          totp_enabled?: boolean | null
          totp_secret?: string | null
          updated_at?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_account_deletion: { Args: never; Returns: undefined }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "recruiter" | "admin"
      application_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "in_progress"
        | "completed"
        | "withdrawn"
      opportunity_level: "beginner" | "intermediate" | "advanced"
      opportunity_status: "draft" | "published" | "closed"
      submission_status: "pending" | "approved" | "needs_revision"
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
      app_role: ["student", "recruiter", "admin"],
      application_status: [
        "pending",
        "accepted",
        "rejected",
        "in_progress",
        "completed",
        "withdrawn",
      ],
      opportunity_level: ["beginner", "intermediate", "advanced"],
      opportunity_status: ["draft", "published", "closed"],
      submission_status: ["pending", "approved", "needs_revision"],
    },
  },
} as const
