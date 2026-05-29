import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Helmet } from 'react-helmet-async'
import { formatDate } from '../../lib/utils'
import { LogIn, LogOut, Eye, Monitor, Smartphone } from 'lucide-react'

interface ActivityEntry {
  id: string
  organization_id: string
  participant_id: string | null
  user_id: string | null
  action: string
  details: Record<string, unknown> | null
  created_at: string
}

export default function AdminAudit() {
  const { loading } = useRequireAuth(['admin', 'operator'])
  const { user } = useAuthStore()
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const loadActivities = useCallback(async () => {
    if (!user?.organization_id) {
      setPageLoading(false)
      return
    }

    let query = supabase
      .from('activity_log')
      .select('*')
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false })
      .limit(200)

    if (filter !== 'all') {
      query = query.eq('action', filter)
    }

    const { error, data } = await query

    if (error) {
      console.error('Erro ao carregar auditoria:', error.message)
      setPageLoading(false)
      return
    }

    setActivities((data as ActivityEntry[]) || [])
    setPageLoading(false)
  }, [user?.organization_id, filter])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  const actionIcon = (action: string) => {
    switch (action) {
      case 'user_login':
        return <LogIn className="w-4 h-4 text-emerald-400" />
      case 'user_logout':
        return <LogOut className="w-4 h-4 text-red-400" />
      case 'page_view':
        return <Eye className="w-4 h-4 text-blue-400" />
      default:
        return <Eye className="w-4 h-4 text-stone-400" />
    }
  }

  const actionLabel = (action: string) => {
    switch (action) {
      case 'user_login':
        return 'Login'
      case 'user_logout':
        return 'Logout'
      case 'page_view':
        return 'Página'
      case 'admin_toggle_block':
        return 'Bloqueio'
      case 'admin_mark_active':
        return 'Liberação'
      case 'admin_mark_paid':
        return 'Pagamento'
      case 'crm_stage_change':
        return 'Mudança etapa'
      case 'crm_notes_updated':
        return 'Notas'
      default:
        return action
    }
  }

  const parseDetails = (details: Record<string, unknown> | null): string => {
    if (!details) return ''
    const parts: string[] = []
    if (details.referrer) parts.push(`Origem: ${details.referrer}`)
    if (details.page) parts.push(`Página: ${details.page}`)
    if (details.url) parts.push(`URL: ${details.url}`)
    if (details.method) parts.push(`Método: ${details.method}`)
    return parts.join(' | ')
  }

  const isMobile = (details: Record<string, unknown> | null) => {
    if (!details?.user_agent) return null
    const ua = String(details.user_agent).toLowerCase()
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="w-3.5 h-3.5 text-amber-400" />
    }
    return <Monitor className="w-3.5 h-3.5 text-stone-500" />
  }

  if (loading || !user) return <PageLoader />
  if (pageLoading) return <PageLoader />

  const loginCount = activities.filter((a) => a.action === 'user_login').length
  const logoutCount = activities.filter((a) => a.action === 'user_logout').length

  return (
    <>
      <Helmet><title>Auditoria | Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F5E6C4]">Auditoria</h1>
            <p className="text-stone-500 mt-1">
              Registro de acessos e atividades
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="!p-4 text-center">
            <p className="text-2xl font-bold text-[#D4AF37]">{activities.length}</p>
            <p className="text-xs text-stone-500 mt-1">Total eventos</p>
          </Card>
          <Card className="!p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{loginCount}</p>
            <p className="text-xs text-stone-500 mt-1">Logins</p>
          </Card>
          <Card className="!p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{logoutCount}</p>
            <p className="text-xs text-stone-500 mt-1">Logouts</p>
          </Card>
          <Card className="!p-4 text-center">
            <p className="text-2xl font-bold text-stone-200">
              {new Set(activities.filter((a) => a.details).map((a) => String(a.details?.referrer || ''))).size}
            </p>
            <p className="text-xs text-stone-500 mt-1">Origens</p>
          </Card>
        </div>

        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'user_login', label: 'Logins' },
            { key: 'user_logout', label: 'Logouts' },
            { key: 'page_view', label: 'Páginas' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.key
                  ? 'bg-[#D4AF37] text-[#0A0706]'
                  : 'bg-[#16120F] text-stone-400 hover:text-stone-200 border border-stone-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {activities.length === 0 ? (
          <Card>
            <p className="text-stone-500 text-sm text-center py-8">
              Nenhum registro de atividade encontrado.
            </p>
          </Card>
        ) : (
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-800/50">
                    <th className="text-left p-4 text-stone-500 font-medium">Ação</th>
                    <th className="text-left p-4 text-stone-500 font-medium hidden md:table-cell">Detalhes</th>
                    <th className="text-left p-4 text-stone-500 font-medium hidden lg:table-cell">Dispositivo</th>
                    <th className="text-right p-4 text-stone-500 font-medium">Data/Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a) => (
                    <tr key={a.id} className="border-b border-stone-800/30 hover:bg-[#0A0706]">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {actionIcon(a.action)}
                          <Badge>{actionLabel(a.action)}</Badge>
                        </div>
                      </td>
                      <td className="p-4 text-stone-400 hidden md:table-cell text-xs max-w-[300px] truncate">
                        {parseDetails(a.details as Record<string, unknown> | null)}
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        {isMobile(a.details as Record<string, unknown> | null)}
                      </td>
                      <td className="p-4 text-right text-xs text-stone-500 whitespace-nowrap">
                        {formatDate(a.created_at)}{' '}
                        {new Date(a.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </>
  )
}
