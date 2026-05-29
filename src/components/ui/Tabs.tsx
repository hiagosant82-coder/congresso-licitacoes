import { cn } from '../../lib/utils'

interface TabsProps {
  tabs: { key: string; label: string; count?: number }[]
  active: string
  onChange: (key: string) => void
}

export default function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 bg-[#0A0706] rounded-xl p-1 border border-stone-800/50">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            active === tab.key
              ? 'bg-[#16120F] text-[#F5E6C4] shadow-sm'
              : 'text-stone-500 hover:text-stone-300'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                active === tab.key
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                  : 'bg-stone-800 text-stone-500'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
