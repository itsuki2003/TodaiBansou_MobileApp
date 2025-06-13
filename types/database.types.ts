export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          full_name: string
          furigana_name: string | null
          grade: string | null
          school_attended: string | null
          enrollment_date: string
          status: 'في籍中' | '休会中' | '退会済み'
          parent_name: string
          parent_phone_number: string | null
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['students']['Insert']>
      }
      teachers: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string | null
          full_name: string
          furigana_name: string
          email: string
          phone_number: string | null
          account_status: '承認待ち' | '有効' | '無効'
          profile_formal_photo_url: string | null
          profile_casual_photo_url: string | null
          appeal_points: string | null
          hobbies_special_skills: string | null
          referrer_info: string | null
          education_background_cram_school: string | null
          education_background_middle_school: string | null
          education_background_high_school: string | null
          education_background_university: string | null
          education_background_faculty: string | null
          registration_application_date: string | null
          account_approval_date: string | null
          notes_admin_only: string | null
        }
        Insert: Omit<Database['public']['Tables']['teachers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['teachers']['Insert']>
      }
      administrators: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string | null
          full_name: string
          email: string
          account_status: '有効' | '無効'
        }
        Insert: Omit<Database['public']['Tables']['administrators']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['administrators']['Insert']>
      }
      assignments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          student_id: string
          teacher_id: string
          role: '面談担当（リスト編集可）' | '授業担当（コメントのみ）'
          assignment_start_date: string | null
          assignment_end_date: string | null
          status: '有効' | '終了済み'
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['assignments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['assignments']['Insert']>
      }
      todo_lists: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          student_id: string
          target_week_start_date: string
          list_creation_date: string | null
          status: '下書き' | '公開済み'
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['todo_lists']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['todo_lists']['Insert']>
      }
      tasks: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          todo_list_id: string
          target_date: string
          content: string
          is_completed: boolean
          display_order: number
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>
      }
      teacher_comments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          todo_list_id: string
          target_date: string
          teacher_id: string
          comment_content: string
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['teacher_comments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['teacher_comments']['Insert']>
      }
      lesson_slots: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          student_id: string
          teacher_id: string | null
          slot_type: '通常授業' | '固定面談' | '振替授業' | '追加授業'
          slot_date: string
          start_time: string
          end_time: string
          google_meet_link: string | null
          status: '予定通り' | '実施済み' | '欠席' | '振替済み（振替元）'
          original_slot_id_for_reschedule: string | null
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['lesson_slots']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['lesson_slots']['Insert']>
      }
      absence_requests: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          student_id: string
          lesson_slot_id: string
          reason: string
          request_timestamp: string
          status: '未振替' | '振替済'
          admin_notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['absence_requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['absence_requests']['Insert']>
      }
      additional_lesson_requests: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          student_id: string
          requested_date: string
          requested_start_time: string
          requested_end_time: string
          teacher_id: string | null
          notes: string | null
          request_timestamp: string
          status: '申請中' | '承認済み・授業登録済み'
          admin_notes: string | null
          created_lesson_slot_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['additional_lesson_requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['additional_lesson_requests']['Insert']>
      }
      notification_categories: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['notification_categories']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['notification_categories']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          content: string
          category_id: string | null
          creator_admin_id: string | null
          publish_timestamp: string
          status: '下書き' | '配信済み'
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      chat_groups: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          student_id: string
          group_name: string | null
          last_message_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['chat_groups']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['chat_groups']['Insert']>
      }
      chat_messages: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          chat_group_id: string
          sender_user_id: string
          sender_role: string
          content: string | null
          attachment_info: Json | null
          sent_at: string
        }
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>
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

// 型エイリアス
export type Student = Database['public']['Tables']['students']['Row']
export type Teacher = Database['public']['Tables']['teachers']['Row']
export type Administrator = Database['public']['Tables']['administrators']['Row']
export type Assignment = Database['public']['Tables']['assignments']['Row']
export type TodoList = Database['public']['Tables']['todo_lists']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TeacherComment = Database['public']['Tables']['teacher_comments']['Row']
export type LessonSlot = Database['public']['Tables']['lesson_slots']['Row']
export type AbsenceRequest = Database['public']['Tables']['absence_requests']['Row']
export type AdditionalLessonRequest = Database['public']['Tables']['additional_lesson_requests']['Row']
export type NotificationCategory = Database['public']['Tables']['notification_categories']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type ChatGroup = Database['public']['Tables']['chat_groups']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']