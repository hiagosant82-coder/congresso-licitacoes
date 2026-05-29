import { cn } from '../../lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-stone-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full rounded-xl border bg-[#16120F] px-4 py-2.5 text-stone-200 placeholder:text-stone-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]/50',
              icon && 'pl-10',
              error
                ? 'border-red-500/50 focus:ring-red-500/50'
                : 'border-stone-700 hover:border-stone-600',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
