import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import SearchInput from '../../components/ui/SearchInput'
import { Helmet } from 'react-helmet-async'
import { STATUS_LABELS, PIPELINE_STAGES } from '../../types'
import type { Participant, ParticipantStatus } from '../../types'
import { formatDate } from '../../lib/utils'
import { MessageSquare, Clock, Save } from 'lucide-react'

export default function AdminCRM() {
  const { loading } = useRequireAuth(['admin', 'operator'])
  const { user } = useAuthStore()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [search, setSearch] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadParticipants = useCallback(async () => {
    if (!user?.organization_id) {
      setPageLoading(false)
      return
    }

    const { error, data } = await supabase
      .from('participants')
      .select('*')
      .eq('organization_id', user.organization_id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar participantes:', error.message)
      setPageLoading(false)
      return
    }

    setParticipants((data as Participant[]) || [])
    setPageLoading(false)
  }, [user?.organization_id])

  useEffect(() => {
    loadParticipants()
  }, [loadParticipants])

  const handleMoveStage = async (p: Participant, newStatus: ParticipantStatus) => {
    const { error } = await supabase.from('participants').update({ status: newStatus }).eq('id', p.id)
    if (error) {
      console.error('Erro ao mover etapa:', error.message)
      return
    }

    await supabase.from('activity_log').insert({
      organization_id: user!.organization_id!,
      participant_id: p.id,
      user_id: user!.id,
      action: 'crm_stage_change',
      details: { from: p.status, to: newStatus },
    })

    await loadParticipants()
  }

  const handleSaveNotes = async (p: Participant) => {
    const { error } = await supabase.from('participants').update({ notes: editNotes }).eq('id', p.id)
    if (error) {
      console.error('Erro ao salvar notas:', error.message)
      return
    }

    await supabase.from('activity_log').insert({
      organization_id: user!.organization_id!,
      participant_id: p.id,
      user_id: user!.id,
      action: 'crm_notes_updated',
      details: { notes: editNotes },
    })

    setEditingId(null)
    await loadParticipants()
  }

  if (loading || !user) return <PageLoader />
  if (pageLoading) return <PageLoader />

  const filtered = search
    ? participants.filter(
        (p) =>
          p.full_name.toLowerCase().includes(search.toLowerCase()) ||
          p.email.toLowerCase().includes(search.toLowerCase())
      )
    : participants

  const columns: Record<ParticipantStatus, Participant[]> = {
    novo: [],
    confirmado: [],
    pagamento_pendente: [],
    ativo: [],
    finalizado: [],
  }

  filtered.forEach((p) => {
    if (columns[p.status]) columns[p.status].push(p)
  })

  return (
    <>
      <Helmet><title>CRM | Admin</title></Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F5E6C4]">CRM Operacional</h1>
          <p className="text-stone-500 mt-1">Pipeline de acompanhamento dos participantes</p>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar participante..."
          className="max-w-sm"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">
                  {STATUS_LABELS[stage]}
                </h3>
                <Badge>{columns[stage].length}</Badge>
              </div>

              <div className="space-y-2 min-h-[100px]">
                {columns[stage].length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#16120F] border border-dashed border-stone-800/50 text-center">
                    <p className="text-xs text-stone-600">Vazio</p>
                  </div>
                ) : (
                  columns[stage].map((p) => (
                    <Card key={p.id} padding={true} className="!p-4">
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-stone-200">{p.full_name}</p>
                          <p className="text-xs text-stone-500 truncate">{p.email}</p>
                        </div>

                        {p.notes && expandedId !== p.id && (
                          <p className="text-xs text-stone-600 truncate italic">
                            <MessageSquare className="w-3 h-3 inline mr-1" />
                            {p.notes.slice(0, 60)}
                          </p>
                        )}

                        {expandedId === p.id && (
                          <div className="space-y-2 pt-1">
                            {editingId === p.id ? (
                              <>
                                <textarea
                                  className="w-full bg-[#0A0706] border border-stone-700 rounded-lg p-2 text-sm text-stone-200 resize-none focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50"
                                  rows={3}
                                  value={editNotes}
                                  onChange={(e) => setEditNotes(e.target.value)}
                                  placeholder="Observações internas..."
                                />
                                <div className="flex gap-1">
                                  <Button size="sm" onClick={() => handleSaveNotes(p)}>
                                    <Save className="w-3.5 h-3.5" /> Salvar
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingId(null)}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-stone-400 bg-[#0A0706] p-2 rounded-lg">
                                  {p.notes || 'Sem observações.'}
                                </p>
                                <button
                                  className="text-xs text-[#D4AF37] hover:underline"
                                  onClick={() => {
                                    setEditNotes(p.notes || '')
                                    setEditingId(p.id)
                                  }}
                                >
                                  Editar observações
                                </button>
                              </>
                            )}

                            <div className="text-xs text-stone-600">
                              <Clock className="w-3 h-3 inline mr-1" />
                              Criado em {formatDate(p.created_at)}
                            </div>

                            {p.tags && p.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {p.tags.map((tag) => (
                                  <Badge key={tag}>{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-stone-800/30">
                          <button
                            className="text-xs text-stone-500 hover:text-[#D4AF37] transition-colors"
                            onClick={() =>
                              setExpandedId(expandedId === p.id ? null : p.id)
                            }
                          >
                            {expandedId === p.id ? 'Recolher' : 'Detalhes'}
                          </button>
                          <select
                            className="text-xs bg-transparent text-stone-500 border border-stone-700 rounded-lg px-2 py-0.5 focus:outline-none focus:border-[#D4AF37]/50"
                            value={p.status}
                            onChange={(e) =>
                              handleMoveStage(p, e.target.value as ParticipantStatus)
                            }
                          >
                            {PIPELINE_STAGES.map((s) => (
                              <option key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
