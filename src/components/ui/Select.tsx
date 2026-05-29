import { cn } from '../../lib/utils'
import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-stone-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-xl border bg-[#16120F] px-4 py-2.5 text-stone-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50',
            error
              ? 'border-red-500/50 focus:ring-red-500/50'
              : 'border-stone-700 hover:border-stone-600',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
