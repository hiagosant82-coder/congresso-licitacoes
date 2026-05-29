import { FileX } from 'lucide-react'
import Button from './Button'

interface EmptyStateProps {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-2xl bg-[#16120F] text-stone-600 mb-4">
        <FileX className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-stone-300">{title}</h3>
      {description && <p className="text-sm text-stone-500 mt-1 max-w-sm">{description}</p>}
      {action && (
        <Button variant="primary" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
