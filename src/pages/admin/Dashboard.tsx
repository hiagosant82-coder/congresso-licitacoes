import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Card, { StatCard } from '../../components/ui/Card'
import { Helmet } from 'react-helmet-async'
import { Users, UserCheck, CreditCard, TrendingUp } from 'lucide-react'
import { formatDate } from '../../lib/utils'
import type { Participant } from '../../types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'


interface Stats {
  totalParticipants: number
  activeUsers: number
  pendingPayments: number
  newThisWeek: number
  recentRegistrations: Participant[]
  statusDistribution: { name: string; count: number }[]
}

export default function AdminDashboard() {
  const { loading } = useRequireAuth(['admin', 'operator'])
  const { user } = useAuthStore()
  const [stats, setStats] = useState<Stats>({
    totalParticipants: 0,
    activeUsers: 0,
    pendingPayments: 0,
    newThisWeek: 0,
    recentRegistrations: [],
    statusDistribution: [],
  })

  const load = useCallback(async () => {
    if (!user?.organization_id) return

    const orgId = user.organization_id!

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [
      { count: total },
      { count: active },
      { count: pending },
      { count: newWeek },
      { data: recent },
    ] = await Promise.all([
      supabase.from('participants').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('participants').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('access_status', 'active'),
      supabase.from('participants').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('payment_status', 'pending'),
      supabase.from('participants').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('created_at', weekAgo.toISOString()),
      supabase.from('participants').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(5),
    ])

    const { data: statusCounts } = await supabase
      .from('participants')
      .select('status')
      .eq('organization_id', orgId)

    const statusMap: Record<string, number> = {}
    if (statusCounts) {
      for (const p of statusCounts) {
        const key = p.status.replace('_', ' ')
        statusMap[key] = (statusMap[key] || 0) + 1
      }
    }

    const dist = ['novo', 'confirmado', 'pagamento_pendente', 'ativo', 'finalizado'].map((s) => ({
      name: s.replace('_', ' '),
      count: statusMap[s.replace(' ', '_')] || 0,
    }))

    setStats({
      totalParticipants: total || 0,
      activeUsers: active || 0,
      pendingPayments: pending || 0,
      newThisWeek: newWeek || 0,
      recentRegistrations: (recent as Participant[]) || [],
      statusDistribution: dist,
    })
  }, [user?.organization_id])

  useEffect(() => {
    load()
  }, [load])

  if (loading || !user) return <PageLoader />

  return (
    <>
      <Helmet><title>Admin | Envolve</title></Helmet>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#F5E6C4]">Dashboard</h1>
          <p className="text-stone-500 mt-1">Visão geral da operação</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Participantes" value={stats.totalParticipants} icon={Users} trend="Total cadastrado" />
          <StatCard label="Usuários Ativos" value={stats.activeUsers} icon={UserCheck} trend="Com acesso liberado" />
          <StatCard label="Pag. Pendentes" value={stats.pendingPayments} icon={CreditCard} trend="Aguardando confirmação" />
          <StatCard label="Novos (7 dias)" value={`+${stats.newThisWeek}`} icon={TrendingUp} trend="Última semana" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-[#F5E6C4] mb-4">Distribuição por Status</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.statusDistribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" />
                <XAxis dataKey="name" tick={{ fill: '#8B7355', fontSize: 12 }} />
                <YAxis tick={{ fill: '#8B7355', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16120F',
                    border: '1px solid #2C221B',
                    borderRadius: '8px',
                    color: '#F5E6C4',
                  }}
                />
                <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-[#F5E6C4] mb-4">Últimos cadastros</h2>
            <div className="space-y-3">
              {stats.recentRegistrations.length === 0 ? (
                <p className="text-stone-500 text-sm">Nenhum cadastro recente.</p>
              ) : (
                stats.recentRegistrations.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#0A0706] border border-stone-800/50"
                  >
                    <div>
                      <p className="text-sm font-medium text-stone-200">{p.full_name}</p>
                      <p className="text-xs text-stone-500">{p.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-stone-500">{formatDate(p.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
