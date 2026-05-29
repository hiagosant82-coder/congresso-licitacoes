import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export default function Card({ children, className, padding = true }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#16120F] border border-stone-800/50 rounded-2xl',
        padding && 'p-6',
        className
      )}
    >
      {children}
    </div>
  )
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: string
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-stone-500">{label}</p>
          <p className="text-2xl font-bold text-stone-100 mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-stone-500 mt-1">{trend}</p>
          )}
        </div>
        <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  )
}
