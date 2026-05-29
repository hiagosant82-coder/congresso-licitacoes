export type UserRole = 'admin' | 'operator' | 'participant'

export type ParticipantStatus =
  | 'novo'
  | 'confirmado'
  | 'pagamento_pendente'
  | 'ativo'
  | 'finalizado'

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'cancelled'

export type AccessStatus =
  | 'pending_payment'
  | 'invited'
  | 'active'
  | 'blocked'

export interface Profile {
  id: string
  organization_id: string | null
  role: UserRole
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Participant {
  id: string
  organization_id: string
  user_id: string | null
  full_name: string
  email: string
  phone: string | null
  cpf: string | null
  position: string | null
  workplace: string | null
  status: ParticipantStatus
  payment_status: PaymentStatus
  access_status: AccessStatus
  notes: string | null
  tags: string[] | null
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface ScheduleItem {
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

export interface FileItem {
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

export interface ActivityLog {
  id: string
  organization_id: string
  participant_id: string | null
  user_id: string | null
  action: string
  details: Record<string, unknown> | null
  created_at: string
}

export interface DashboardStats {
  totalParticipants: number
  newThisWeek: number
  activeUsers: number
  pendingPayments: number
  recentRegistrations: Participant[]
}

export const STATUS_LABELS: Record<ParticipantStatus, string> = {
  novo: 'Novo',
  confirmado: 'Confirmado',
  pagamento_pendente: 'Pag. Pendente',
  ativo: 'Ativo',
  finalizado: 'Finalizado',
}

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  refunded: 'Reembolsado',
  cancelled: 'Cancelado',
}

export const ACCESS_LABELS: Record<AccessStatus, string> = {
  pending_payment: 'Aguardando Pagamento',
  invited: 'Convidado',
  active: 'Ativo',
  blocked: 'Bloqueado',
}

export const PIPELINE_STAGES: ParticipantStatus[] = [
  'novo',
  'confirmado',
  'pagamento_pendente',
  'ativo',
  'finalizado',
]
