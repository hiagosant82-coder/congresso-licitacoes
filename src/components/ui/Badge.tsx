import { cn } from '../../lib/utils'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  children: React.ReactNode
  className?: string
}

const variants = {
  default: 'bg-[#16120F] text-stone-400 border border-stone-700',
  success: 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30',
  warning: 'bg-amber-950/50 text-amber-400 border border-amber-500/30',
  danger: 'bg-red-950/50 text-red-400 border border-red-500/30',
  info: 'bg-blue-950/50 text-blue-400 border border-blue-500/30',
}

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    novo: { label: 'Novo', variant: 'info' },
    confirmado: { label: 'Confirmado', variant: 'info' },
    pagamento_pendente: { label: 'Pag. Pendente', variant: 'warning' },
    ativo: { label: 'Ativo', variant: 'success' },
    finalizado: { label: 'Finalizado', variant: 'default' },
    pending: { label: 'Pendente', variant: 'warning' },
    paid: { label: 'Pago', variant: 'success' },
    refunded: { label: 'Reembolsado', variant: 'danger' },
    cancelled: { label: 'Cancelado', variant: 'danger' },
    pending_payment: { label: 'Aguardando Pag.', variant: 'warning' },
    invited: { label: 'Convidado', variant: 'info' },
    active: { label: 'Ativo', variant: 'success' },
    blocked: { label: 'Bloqueado', variant: 'danger' },
  }

  const entry = map[status] ?? { label: status, variant: 'default' as const }

  return <Badge variant={entry.variant}>{entry.label}</Badge>
}
