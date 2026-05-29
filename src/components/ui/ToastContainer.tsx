import { useNotificationStore, type Notification } from '../../stores/notificationStore'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const iconMap: Record<Notification['type'], React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  error: <AlertCircle className="w-5 h-5 text-red-400" />,
  info: <Info className="w-5 h-5 text-blue-400" />,
}

const bgMap: Record<Notification['type'], string> = {
  success: 'border-emerald-500/30 bg-emerald-950/30',
  error: 'border-red-500/30 bg-red-950/30',
  info: 'border-blue-500/30 bg-blue-950/30',
}

export default function ToastContainer() {
  const notifications = useNotificationStore((s) => s.notifications)
  const remove = useNotificationStore((s) => s.remove)

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md animate-slide-in ${bgMap[n.type]}`}
        >
          <div className="mt-0.5">{iconMap[n.type]}</div>
          <p className="flex-1 text-sm text-stone-200">{n.message}</p>
          <button onClick={() => remove(n.id)} className="text-stone-500 hover:text-stone-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
