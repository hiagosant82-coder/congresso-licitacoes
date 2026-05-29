import { cn } from '../../lib/utils'
import Button from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative bg-[#16120F] border border-stone-800/50 rounded-2xl shadow-3xl w-full',
          sizes[size]
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-stone-800/50">
          <h2 className="text-lg font-bold text-[#F5E6C4]">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="p-6">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 p-6 pt-0 border-t border-stone-800/50 mt-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
