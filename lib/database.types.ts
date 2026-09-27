
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "announcements": {
                  Row: {
                    "author_id": string,"body": string,"class_id": string,"created_at": string,"id": string
                  }
                  Insert: {
                    "author_id": string,"body": string,"class_id": string,"created_at"?: string,"id"?: string
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"class_id"?: string,"created_at"?: string,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "announcements_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "announcements_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "classes"
      referencedColumns: ["id"]
    }
                  ]
                },"assignments": {
                  Row: {
                    "class_id": string,"created_at": string,"due_at": string | null,"id": string,"instructions": string | null,"lesson_id": string | null,"published": boolean,"title": string
                  }
                  Insert: {
                    "class_id": string,"created_at"?: string,"due_at"?: string | null,"id"?: string,"instructions"?: string | null,"lesson_id"?: string | null,"published"?: boolean,"title": string
                  }
                  Update: {
                    "class_id"?: string,"created_at"?: string,"due_at"?: string | null,"id"?: string,"instructions"?: string | null,"lesson_id"?: string | null,"published"?: boolean,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "assignments_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "classes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "assignments_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    }
                  ]
                },"class_members": {
                  Row: {
                    "class_id": string,"joined_at": string,"student_id": string
                  }
                  Insert: {
                    "class_id": string,"joined_at"?: string,"student_id": string
                  }
                  Update: {
                    "class_id"?: string,"joined_at"?: string,"student_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "class_members_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "classes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "class_members_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"classes": {
                  Row: {
                    "created_at": string,"hsk_level": number | null,"id": string,"join_code": string,"name": string,"teacher_id": string
                  }
                  Insert: {
                    "created_at"?: string,"hsk_level"?: number | null,"id"?: string,"join_code"?: string,"name": string,"teacher_id": string
                  }
                  Update: {
                    "created_at"?: string,"hsk_level"?: number | null,"id"?: string,"join_code"?: string,"name"?: string,"teacher_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "classes_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lesson_materials": {
                  Row: {
                    "created_at": string,"id": string,"lesson_id": string,"position": number,"storage_path": string | null,"title": string,"type": Database["public"]['Enums']["material_type"],"url": string | null
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"lesson_id": string,"position"?: number,"storage_path"?: string | null,"title": string,"type": Database["public"]['Enums']["material_type"],"url"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"lesson_id"?: string,"position"?: number,"storage_path"?: string | null,"title"?: string,"type"?: Database["public"]['Enums']["material_type"],"url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "lesson_materials_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    }
                  ]
                },"lessons": {
                  Row: {
                    "class_id": string,"created_at": string,"id": string,"position": number,"published": boolean,"summary": string | null,"title": string
                  }
                  Insert: {
                    "class_id": string,"created_at"?: string,"id"?: string,"position"?: number,"published"?: boolean,"summary"?: string | null,"title": string
                  }
                  Update: {
                    "class_id"?: string,"created_at"?: string,"id"?: string,"position"?: number,"published"?: boolean,"summary"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lessons_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "classes"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"full_name": string,"id": string,"role": Database["public"]['Enums']["user_role"]
                  }
                  Insert: {
                    "created_at"?: string,"full_name"?: string,"id": string,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string,"id"?: string,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Relationships: [
                    
                  ]
                },"question_keys": {
                  Row: {
                    "answer": string,"question_id": string
                  }
                  Insert: {
                    "answer": string,"question_id": string
                  }
                  Update: {
                    "answer"?: string,"question_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "question_keys_question_id_fkey"
      columns: ["question_id"]
isOneToOne: true
      referencedRelation: "questions"
      referencedColumns: ["id"]
    }
                  ]
                },"questions": {
                  Row: {
                    "assignment_id": string,"id": string,"options": Json | null,"points": number,"position": number,"prompt": string,"type": Database["public"]['Enums']["question_type"]
                  }
                  Insert: {
                    "assignment_id": string,"id"?: string,"options"?: Json | null,"points"?: number,"position"?: number,"prompt": string,"type": Database["public"]['Enums']["question_type"]
                  }
                  Update: {
                    "assignment_id"?: string,"id"?: string,"options"?: Json | null,"points"?: number,"position"?: number,"prompt"?: string,"type"?: Database["public"]['Enums']["question_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "questions_assignment_id_fkey"
      columns: ["assignment_id"]
isOneToOne: false
      referencedRelation: "assignments"
      referencedColumns: ["id"]
    }
                  ]
                },"submission_answers": {
                  Row: {
                    "auto_score": number | null,"comment": string | null,"file_path": string | null,"id": string,"question_id": string,"submission_id": string,"teacher_score": number | null,"text_answer": string | null
                  }
                  Insert: {
                    "auto_score"?: number | null,"comment"?: string | null,"file_path"?: string | null,"id"?: string,"question_id": string,"submission_id": string,"teacher_score"?: number | null,"text_answer"?: string | null
                  }
                  Update: {
                    "auto_score"?: number | null,"comment"?: string | null,"file_path"?: string | null,"id"?: string,"question_id"?: string,"submission_id"?: string,"teacher_score"?: number | null,"text_answer"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "submission_answers_question_id_fkey"
      columns: ["question_id"]
isOneToOne: false
      referencedRelation: "questions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "submission_answers_submission_id_fkey"
      columns: ["submission_id"]
isOneToOne: false
      referencedRelation: "submissions"
      referencedColumns: ["id"]
    }
                  ]
                },"submissions": {
                  Row: {
                    "assignment_id": string,"created_at": string,"feedback_audio_path": string | null,"graded_at": string | null,"id": string,"score": number | null,"status": Database["public"]['Enums']["submission_status"],"student_id": string,"submitted_at": string | null,"teacher_comment": string | null
                  }
                  Insert: {
                    "assignment_id": string,"created_at"?: string,"feedback_audio_path"?: string | null,"graded_at"?: string | null,"id"?: string,"score"?: number | null,"status"?: Database["public"]['Enums']["submission_status"],"student_id": string,"submitted_at"?: string | null,"teacher_comment"?: string | null
                  }
                  Update: {
                    "assignment_id"?: string,"created_at"?: string,"feedback_audio_path"?: string | null,"graded_at"?: string | null,"id"?: string,"score"?: number | null,"status"?: Database["public"]['Enums']["submission_status"],"student_id"?: string,"submitted_at"?: string | null,"teacher_comment"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "submissions_assignment_id_fkey"
      columns: ["assignment_id"]
isOneToOne: false
      referencedRelation: "assignments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "submissions_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"vocab": {
                  Row: {
                    "example": string | null,"hanzi": string,"id": string,"lesson_id": string,"meaning_vi": string,"pinyin": string,"position": number
                  }
                  Insert: {
                    "example"?: string | null,"hanzi": string,"id"?: string,"lesson_id": string,"meaning_vi": string,"pinyin": string,"position"?: number
                  }
                  Update: {
                    "example"?: string | null,"hanzi"?: string,"id"?: string,"lesson_id"?: string,"meaning_vi"?: string,"pinyin"?: string,"position"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "vocab_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    }
                  ]
                },"vocab_reviews": {
                  Row: {
                    "due_at": string,"ease": number,"interval_days": number,"reps": number,"student_id": string,"vocab_id": string
                  }
                  Insert: {
                    "due_at"?: string,"ease"?: number,"interval_days"?: number,"reps"?: number,"student_id": string,"vocab_id": string
                  }
                  Update: {
                    "due_at"?: string,"ease"?: number,"interval_days"?: number,"reps"?: number,"student_id"?: string,"vocab_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vocab_reviews_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "vocab_reviews_vocab_id_fkey"
      columns: ["vocab_id"]
isOneToOne: false
      referencedRelation: "vocab"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "assignment_class":
{ Args: { "aid": string }; Returns: string
                           },
"in_class":
{ Args: { "cid": string }; Returns: boolean
                           },
"is_teacher":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"join_class":
{ Args: { "code": string }; Returns: string
                           },
"submit_assignment":
{ Args: { "sub_id": string }; Returns: undefined
                           },
"teaches_class":
{ Args: { "cid": string }; Returns: boolean
                           }
          }
          Enums: {
            "material_type": "slide"|"video"|"document"|"link","question_type": "multiple_choice"|"fill_blank"|"pinyin"|"essay"|"writing"|"speaking","submission_status": "draft"|"submitted"|"graded","user_role": "teacher"|"student"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "material_type": ["slide", "video", "document", "link"],"question_type": ["multiple_choice", "fill_blank", "pinyin", "essay", "writing", "speaking"],"submission_status": ["draft", "submitted", "graded"],"user_role": ["teacher", "student"]
          }
        }
} as const

