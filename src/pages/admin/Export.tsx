import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import { Helmet } from 'react-helmet-async'
import { Download, FileSpreadsheet, Mail } from 'lucide-react'
import { generateCSV, downloadCSV } from '../../lib/utils'
import type { Participant } from '../../types'

export default function AdminExport() {
  const { loading } = useRequireAuth(['admin', 'operator'])
  const { user } = useAuthStore()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [pageLoading, setPageLoading] = useState(true)

  const loadParticipants = useCallback(async () => {
    if (!user?.organization_id) {
      setPageLoading(false)
      return
    }

    let query = supabase
      .from('participants')
      .select('*')
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false })

    if (statusFilter) query = query.eq('status', statusFilter as 'novo' | 'confirmado' | 'pagamento_pendente' | 'ativo' | 'finalizado')

    const { data } = await query
    setParticipants((data as Participant[]) || [])
    setPageLoading(false)
  }, [user?.organization_id, statusFilter])

  useEffect(() => {
    loadParticipants()
  }, [loadParticipants])

  const handleExportCSV = () => {
    const columns = [
      { key: 'full_name' as const, label: 'Nome' },
      { key: 'email' as const, label: 'Email' },
      { key: 'phone' as const, label: 'Telefone' },
      { key: 'cpf' as const, label: 'CPF' },
      { key: 'position' as const, label: 'Cargo' },
      { key: 'workplace' as const, label: 'Local de Trabalho' },
      { key: 'status' as const, label: 'Status' },
      { key: 'payment_status' as const, label: 'Pagamento' },
      { key: 'access_status' as const, label: 'Acesso' },
      { key: 'created_at' as const, label: 'Data de Cadastro' },
      { key: 'last_login' as const, label: 'Último Login' },
    ]

    const csv = generateCSV(participants, columns)
    downloadCSV(csv, `participantes_${new Date().toISOString().split('T')[0]}.csv`)
  }

  if (loading || !user) return <PageLoader />
  if (pageLoading) return <PageLoader />

  return (
    <>
      <Helmet><title>Exportar | Admin</title></Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F5E6C4]">Exportar Dados</h1>
          <p className="text-stone-500 mt-1">Exporte listas de participantes e contatos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center py-4">
              <div className="p-4 rounded-2xl bg-[#D4AF37]/10 inline-flex mb-4">
                <FileSpreadsheet className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h3 className="font-semibold text-[#F5E6C4] mb-2">Exportar CSV</h3>
              <p className="text-sm text-stone-500 mb-4">
                Exporte a lista completa de participantes em formato CSV
              </p>
              <div className="mb-4">
                <Select
                  options={[
                    { value: '', label: 'Todos os participantes' },
                    { value: 'ativo', label: 'Apenas ativos' },
                    { value: 'pagamento_pendente', label: 'Pagamento pendente' },
                    { value: 'novo', label: 'Novos' },
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                />
              </div>
              <Button variant="primary" onClick={handleExportCSV} disabled={participants.length === 0}>
                <Download className="w-4 h-4" />
                Exportar {participants.length} participantes
              </Button>
            </div>
          </Card>

          <Card>
            <div className="text-center py-4">
              <div className="p-4 rounded-2xl bg-[#D4AF37]/10 inline-flex mb-4">
                <Mail className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h3 className="font-semibold text-[#F5E6C4] mb-2">Lista de Emails</h3>
              <p className="text-sm text-stone-500 mb-4">
                Exporte apenas os emails para campanhas de comunicação
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  const emails = participants.map((p) => p.email).join('\n')
                  downloadCSV(emails, 'emails_participantes.txt')
                }}
                disabled={participants.length === 0}
              >
                <Download className="w-4 h-4" />
                Exportar emails
              </Button>
            </div>
          </Card>

          <Card>
            <div className="text-center py-4">
              <div className="p-4 rounded-2xl bg-[#D4AF37]/10 inline-flex mb-4">
                <Download className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h3 className="font-semibold text-[#F5E6C4] mb-2">Contatos WhatsApp</h3>
              <p className="text-sm text-stone-500 mb-4">
                Exporte nome e telefone para listas de WhatsApp
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  const withPhones = participants.filter((p) => p.phone)
                  const csv = generateCSV(withPhones, [
                    { key: 'full_name' as const, label: 'Nome' },
                    { key: 'phone' as const, label: 'Telefone' },
                  ])
                  downloadCSV(csv, `contatos_whatsapp_${new Date().toISOString().split('T')[0]}.csv`)
                }}
                disabled={participants.length === 0}
              >
                <Download className="w-4 h-4" />
                Exportar contatos
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
