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
      organizations: {
        Row: {
          id: string
          name: string
          plan: string
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Relationships: []
        Insert: {
          id?: string
          name: string
          plan?: string
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          plan?: string
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          organization_id: string | null
          role: 'admin' | 'operator' | 'participant'
          full_name: string
          email: string
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Relationships: []
        Insert: {
          id: string
          organization_id?: string | null
          role?: 'admin' | 'operator' | 'participant'
          full_name: string
          email: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          role?: 'admin' | 'operator' | 'participant'
          full_name?: string
          email?: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          full_name: string
          email: string
          phone: string | null
          cpf: string | null
          position: string | null
          workplace: string | null
          status: 'novo' | 'confirmado' | 'pagamento_pendente' | 'ativo' | 'finalizado'
          payment_status: 'pending' | 'paid' | 'refunded' | 'cancelled'
          access_status: 'pending_payment' | 'invited' | 'active' | 'blocked'
          notes: string | null
          tags: string[] | null
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Relationships: []
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          full_name: string
          email: string
          phone?: string | null
          cpf?: string | null
          position?: string | null
          workplace?: string | null
          status?: 'novo' | 'confirmado' | 'pagamento_pendente' | 'ativo' | 'finalizado'
          payment_status?: 'pending' | 'paid' | 'refunded' | 'cancelled'
          access_status?: 'pending_payment' | 'invited' | 'active' | 'blocked'
          notes?: string | null
          tags?: string[] | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          full_name?: string
          email?: string
          phone?: string | null
          cpf?: string | null
          position?: string | null
          workplace?: string | null
          status?: 'novo' | 'confirmado' | 'pagamento_pendente' | 'ativo' | 'finalizado'
          payment_status?: 'pending' | 'paid' | 'refunded' | 'cancelled'
          access_status?: 'pending_payment' | 'invited' | 'active' | 'blocked'
          notes?: string | null
          tags?: string[] | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_log: {
        Row: {
          id: string
          organization_id: string
          participant_id: string | null
          user_id: string | null
          action: string
          details: Json | null
          created_at: string
        }
        Relationships: []
        Insert: {
          id?: string
          organization_id: string
          participant_id?: string | null
          user_id?: string | null
          action: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          participant_id?: string | null
          user_id?: string | null
          action?: string
          details?: Json | null
          created_at?: string
        }
      }
      files: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          file_url: string
          file_type: string
          file_size: number | null
          category: string | null
          visible_to_all: boolean
          created_at: string
          updated_at: string
        }
        Relationships: []
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          file_url: string
          file_type: string
          file_size?: number | null
          category?: string | null
          visible_to_all?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          file_url?: string
          file_type?: string
          file_size?: number | null
          category?: string | null
          visible_to_all?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      file_access: {
        Row: {
          id: string
          file_id: string
          participant_id: string
          created_at: string
        }
        Relationships: []
        Insert: {
          id?: string
          file_id: string
          participant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          file_id?: string
          participant_id?: string
          created_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          organization_id: string
          title: string
          description: string | null
          date: string
          start_time: string
          end_time: string
          speaker: string | null
          speaker_bio: string | null
          location: string | null
          order_index: number
          day_number: number
          created_at: string
          updated_at: string
        }
        Relationships: []
        Insert: {
          id?: string
          organization_id: string
          title: string
          description?: string | null
          date: string
          start_time: string
          end_time: string
          speaker?: string | null
          speaker_bio?: string | null
          location?: string | null
          order_index?: number
          day_number: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          description?: string | null
          date?: string
          start_time?: string
          end_time?: string
          speaker?: string | null
          speaker_bio?: string | null
          location?: string | null
          order_index?: number
          day_number?: number
          created_at?: string
          updated_at?: string
        }
      }
      certificates: {
        Row: {
          id: string
          organization_id: string
          participant_id: string
          title: string
          description: string | null
          certificate_url: string | null
          issued: boolean
          issued_at: string | null
          created_at: string
        }
        Relationships: []
        Insert: {
          id?: string
          organization_id: string
          participant_id: string
          title: string
          description?: string | null
          certificate_url?: string | null
          issued?: boolean
          issued_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          participant_id?: string
          title?: string
          description?: string | null
          certificate_url?: string | null
          issued?: boolean
          issued_at?: string | null
          created_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          participant_id: string
          journey_active: boolean
          watched_lectures: string[]
          completed_tasks: Json
          created_at: string
          updated_at: string
        }
        Relationships: []
        Insert: {
          id?: string
          participant_id: string
          journey_active?: boolean
          watched_lectures?: string[]
          completed_tasks?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          participant_id?: string
          journey_active?: boolean
          watched_lectures?: string[]
          completed_tasks?: Json
          created_at?: string
          updated_at?: string
        }
      }
      content_comments: {
        Row: {
          id: string
          schedule_item_id: string
          participant_id: string
          user_id: string | null
          text: string
          created_at: string
        }
        Relationships: []
        Insert: {
          id?: string
          schedule_item_id: string
          participant_id: string
          user_id?: string | null
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          schedule_item_id?: string
          participant_id?: string
          user_id?: string | null
          text?: string
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
