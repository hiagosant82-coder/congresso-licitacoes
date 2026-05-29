import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Card from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import SearchInput from '../../components/ui/SearchInput'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { Helmet } from 'react-helmet-async'
import {
  UserPlus,
  Ban,
  CheckCircle,
  Eye,
  Lock,
  Unlock,
  Send,
  Mail,
} from 'lucide-react'
import { formatDate } from '../../lib/utils'
import type { Json } from '../../lib/database.types'
import type { Participant } from '../../types'

export default function AdminParticipants() {
  const { loading } = useRequireAuth(['admin', 'operator'])
  const { user } = useAuthStore()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [selected, setSelected] = useState<Participant | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [newFullName, setNewFullName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const generatedPassword = useMemo(() => newFullName.trim() ? generateRandomPassword() : '', [newFullName])

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$'
    let pwd = ''
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return pwd + 'Aa1@'
  }

  const handleCreateParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFullName.trim() || !newEmail.trim()) {
      setCreateError('Nome completo e Email são obrigatórios.')
      return
    }

    setCreateLoading(true)
    setCreateError('')

    try {
      const password = generatedPassword || generateRandomPassword()

      // Separate temp client to avoid logging out the current admin session
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })

      // Register the new user
      const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
        email: newEmail.trim(),
        password,
        options: {
          data: {
            full_name: newFullName.trim(),
            organization_id: user?.organization_id,
          },
        },
      })

      if (signUpError) {
        throw new Error(`Erro ao criar conta de acesso: ${signUpError.message}`)
      }

      const newUserId = signUpData.user?.id

      if (!newUserId) {
        throw new Error('Não foi possível obter o ID do usuário criado.')
      }

      // Backup layer: Explicitly link profile to organization as the newly signed-up user
      await tempClient
        .from('profiles')
        .update({ organization_id: user?.organization_id })
        .eq('id', newUserId)

      // Insert record into participants table
      const { error: participantError } = await supabase.from('participants').insert({
        organization_id: user?.organization_id!,
        user_id: newUserId,
        full_name: newFullName.trim(),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim() || null,
        status: 'ativo',
        payment_status: 'paid',
        access_status: 'active',
      })

      if (participantError) {
        throw new Error(`Erro ao cadastrar participante: ${participantError.message}`)
      }

      // Log action
      await supabase.from('activity_log').insert({
        organization_id: user?.organization_id!,
        participant_id: null,
        user_id: user?.id,
        action: 'admin_add_participant',
        details: { email: newEmail.trim(), full_name: newFullName.trim() } as any,
      })

      setNewFullName('')
      setNewEmail('')
      setNewPhone('')
      setCreateModalOpen(false)
      await loadParticipants()
    } catch (err: any) {
      console.error(err)
      setCreateError(err.message || 'Ocorreu um erro ao criar o participante.')
    } finally {
      setCreateLoading(false)
    }
  }

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

    const { error, data } = await query

    if (error) {
      console.error('Erro ao carregar participantes:', error.message)
      setPageLoading(false)
      return
    }

    setParticipants((data as Participant[]) || [])
    setPageLoading(false)
  }, [user?.organization_id, statusFilter])

  useEffect(() => {
    loadParticipants()
  }, [loadParticipants])

  const filtered = search
    ? participants.filter(
        (p) =>
          p.full_name.toLowerCase().includes(search.toLowerCase()) ||
          p.email.toLowerCase().includes(search.toLowerCase()) ||
          p.phone?.toLowerCase().includes(search.toLowerCase())
      )
    : participants

  const handleAction = async (action: string, p: Participant) => {
    const updates: Partial<Participant> = {}

    switch (action) {
      case 'toggle_block':
        updates.access_status = p.access_status === 'blocked' ? 'active' : 'blocked'
        break
      case 'mark_active':
        updates.access_status = 'active'
        updates.status = 'ativo'
        break
      case 'mark_paid':
        updates.payment_status = 'paid'
        break
      case 'resend_invite':
        try {
          await supabase.functions.invoke('send-invite', {
            body: { participantId: p.id, email: p.email },
          })
        } catch {
          console.warn('Função send-invite não implantada. Copie manualmente as credenciais.')
        }
        break
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateErr } = await supabase.from('participants').update(updates).eq('id', p.id)
      if (updateErr) {
        console.error('Erro ao atualizar participante:', updateErr.message)
        return
      }

      await supabase.from('activity_log').insert({
        organization_id: user!.organization_id!,
        participant_id: p.id,
        user_id: user!.id,
        action: `admin_${action}`,
        details: { previous_status: p.status, updates } as unknown as Json,
      })

      await loadParticipants()
    }
  }

  if (loading || !user) return <PageLoader />
  if (pageLoading) return <PageLoader />

  return (
    <>
      <Helmet><title>Participantes | Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F5E6C4]">Participantes</h1>
            <p className="text-stone-500 mt-1">{filtered.length} participantes encontrados</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
            <UserPlus className="w-4 h-4" /> Novo participante
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Pesquisar por nome, email..."
            className="flex-1"
          />
          <Select
            options={[
              { value: '', label: 'Todos os status' },
              { value: 'novo', label: 'Novo' },
              { value: 'confirmado', label: 'Confirmado' },
              { value: 'pagamento_pendente', label: 'Pag. Pendente' },
              { value: 'ativo', label: 'Ativo' },
              { value: 'finalizado', label: 'Finalizado' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum participante encontrado"
            description="Comece adicionando participantes manualmente ou aguarde as inscrições."
          />
        ) : (
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-800/50">
                    <th className="text-left p-4 text-stone-500 font-medium">Nome</th>
                    <th className="text-left p-4 text-stone-500 font-medium hidden md:table-cell">Email</th>
                    <th className="text-left p-4 text-stone-500 font-medium hidden lg:table-cell">Status</th>
                    <th className="text-left p-4 text-stone-500 font-medium hidden lg:table-cell">Pagamento</th>
                    <th className="text-left p-4 text-stone-500 font-medium hidden lg:table-cell">Acesso</th>
                    <th className="text-left p-4 text-stone-500 font-medium hidden xl:table-cell">Data</th>
                    <th className="text-right p-4 text-stone-500 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-stone-800/30 hover:bg-[#0A0706] transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-stone-200">{p.full_name}</p>
                        <p className="text-xs text-stone-500 md:hidden">{p.email}</p>
                      </td>
                      <td className="p-4 text-stone-400 hidden md:table-cell">{p.email}</td>
                      <td className="p-4 hidden lg:table-cell"><StatusBadge status={p.status} /></td>
                      <td className="p-4 hidden lg:table-cell"><StatusBadge status={p.payment_status} /></td>
                      <td className="p-4 hidden lg:table-cell"><StatusBadge status={p.access_status} /></td>
                      <td className="p-4 text-stone-500 hidden xl:table-cell">{formatDate(p.created_at)}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelected(p)
                              setModalOpen(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={p.access_status === 'blocked' ? 'ghost' : 'ghost'}
                            size="sm"
                            onClick={() => handleAction('toggle_block', p)}
                            className={p.access_status === 'blocked' ? 'text-red-400' : ''}
                          >
                            {p.access_status === 'blocked' ? <Ban className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={selected?.full_name || 'Detalhes'}
        >
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-stone-500">Status</p>
                  <StatusBadge status={selected.status} />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Pagamento</p>
                  <StatusBadge status={selected.payment_status} />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Acesso</p>
                  <StatusBadge status={selected.access_status} />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Email</p>
                  <p className="text-sm text-stone-300">{selected.email}</p>
                </div>
                {selected.phone && (
                  <div>
                    <p className="text-xs text-stone-500">Telefone</p>
                    <p className="text-sm text-stone-300">{selected.phone}</p>
                  </div>
                )}
                {selected.cpf && (
                  <div>
                    <p className="text-xs text-stone-500">CPF</p>
                    <p className="text-sm text-stone-300">{selected.cpf}</p>
                  </div>
                )}
              </div>

              {selected.notes && (
                <div>
                  <p className="text-xs text-stone-500 mb-1">Observações</p>
                  <p className="text-sm text-stone-400 bg-[#0A0706] p-3 rounded-xl">{selected.notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {selected.access_status !== 'active' && (
                  <Button variant="primary" size="sm" onClick={() => handleAction('mark_active', selected)}>
                    <CheckCircle className="w-4 h-4" /> Liberar acesso
                  </Button>
                )}
                {selected.payment_status !== 'paid' && (
                  <Button variant="outline" size="sm" onClick={() => handleAction('mark_paid', selected)}>
                    Marcar como pago
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleAction('toggle_block', selected)}>
                  {selected.access_status === 'blocked' ? (
                    <><Unlock className="w-4 h-4" /> Desbloquear</>
                  ) : (
                    <><Ban className="w-4 h-4" /> Bloquear</>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAction('resend_invite', selected)}>
                  <Send className="w-4 h-4" /> Reenviar convite
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setWelcomeModalOpen(true)
                  }}
                  className="text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
                >
                  <Mail className="w-4 h-4" /> Copiar Boas-Vindas
                </Button>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Novo Participante (Inscrição Manual)"
        >
          <form onSubmit={handleCreateParticipant} className="space-y-4">
            {createError && (
              <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {createError}
              </div>
            )}

            <Input
              label="Nome Completo"
              id="newFullName"
              type="text"
              placeholder="Ex: João Silva"
              value={newFullName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFullName(e.target.value)}
              required
            />

            <Input
              label="Email"
              id="newEmail"
              type="email"
              placeholder="Ex: joao@email.com"
              value={newEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)}
              required
            />

            <Input
              label="Telefone (opcional)"
              id="newPhone"
              type="text"
              placeholder="Ex: (65) 99999-9999"
              value={newPhone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPhone(e.target.value)}
            />

            {newFullName.trim() && (
              <div className="p-3 bg-[#16120F] border border-stone-850 rounded-xl space-y-1">
                <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Credenciais de Acesso a serem Criadas:</p>
                <p className="text-sm text-stone-300">
                  <span className="font-semibold text-stone-400">Login:</span> {newEmail.trim() || '(digite o e-mail)'}
                </p>
                <p className="text-sm text-stone-300">
                  <span className="font-semibold text-stone-400">Senha:</span> {generatedPassword || '(preencha o nome para gerar)'}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setCreateModalOpen(false)}
                disabled={createLoading}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={createLoading}
              >
                Salvar e Liberar Acesso
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          open={welcomeModalOpen}
          onClose={() => {
            setWelcomeModalOpen(false)
            setCopySuccess(false)
          }}
          title="Mensagem de Boas-Vindas Copiável"
        >
          {selected && (
            <div className="space-y-4">
              <p className="text-xs text-stone-500 leading-relaxed">
                Esta mensagem foi gerada automaticamente e de forma personalizada com as credenciais de acesso deste participante. Use o botão abaixo para copiar o texto com a formatação ideal e enviar pelo WhatsApp ou E-mail.
              </p>

              {/* Graphic Banner Mockup */}
              <div className="rounded-xl overflow-hidden border border-stone-850 bg-[#0E0B0A] relative aspect-video flex flex-col justify-between p-4 group">
                <div className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: "url('/assets/hero-v3-lSDBWtLS.jpg')" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent z-10" />
                <div className="z-20">
                  <span className="px-2 py-0.5 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] text-[10px] font-black uppercase">Imagem do Cabeçalho</span>
                </div>
                <div className="z-20 text-center pb-2">
                  <h4 className="text-sm font-black text-[#F5E6C4] drop-shadow-md">PARABÉNS POR DAR ESTE INCRÍVEL PASSO!</h4>
                  <p className="text-[10px] text-stone-400 mt-0.5">Acesso Premium Liberado ao Congresso de Licitações</p>
                </div>
              </div>

              {/* Editable Text Area for Copying */}
              <div className="relative">
                <textarea
                  readOnly
                  value={`Olá, *${selected.full_name?.split(' ')[0]}*! 

Parabéns por garantir sua vaga no **3º Congresso de Licitações do Vale do Araguaia**! 🚀

Sua conta de acesso à nossa **Área de Membros Premium** acaba de ser liberada. O portal foi desenvolvido sob medida para organizar o seu aprendizado, centralizar materiais e facilitar o seu progresso.

---

### 🔑 Suas Credenciais de Acesso:
* **Link do Portal:** https://envolvematogrosso.com.br/login
* **Seu Login (E-mail):** ${selected.email}
* **Sua Senha Provisória:** _[forneça a senha ao participante]_

*(Assim que entrar, você poderá alterar sua senha na aba "Perfil" no menu lateral).*

---

### 📅 Passo a Passo - Como Funciona a Área de Membros:

1. **Faça o Login:** Acesse o link acima e insira suas credenciais.
2. **Ative sua Jornada (Muito Importante!):** No primeiro dia do evento, vá até o seu **Dashboard** e utilize o leitor de QR Code para validar sua presença presencial. Isso irá destravar instantaneamente todos os downloads de materiais de apoio, modelos (ETP, TR), checklists e a seção de debates em vídeo!
3. **Assista e Interaja:** Na aba **Programação**, você poderá assistir aos replays gravados das palestras, marcar cada aula como concluída e tirar dúvidas/debater no campo de comentários abaixo de cada vídeo com outros licitantes.
4. **Monitore sua Evolução:** Acompanhe a sua barra de progresso na Dashboard. Concluir as aulas e tarefas recomendadas garantirá a liberação do seu **Certificado Digital de 40 Horas** oficial!

Prepare-se para ir para o próximo nível! Estamos prontos para guiar você nessa jornada de excelência.

Nos vemos no congresso!
*Equipe Envolve Consultoria e Assessoria*`}
                  rows={10}
                  className="w-full bg-[#0A0706] border border-stone-800 rounded-xl p-3.5 text-xs text-stone-300 leading-relaxed resize-none focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setWelcomeModalOpen(false)
                    setCopySuccess(false)
                  }}
                >
                  Fechar
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    const text = `Olá, *${selected.full_name?.split(' ')[0]}*! \n\nParabéns por garantir sua vaga no **3º Congresso de Licitações do Vale do Araguaia**! 🚀\n\nSua conta de acesso à nossa **Área de Membros Premium** acaba de ser liberada. O portal foi desenvolvido sob medida para organizar o seu aprendizado, centralizar materiais e facilitar o seu progresso.\n\n---\n\n### 🔑 Suas Credenciais de Acesso:\n* **Link do Portal:** https://envolvematogrosso.com.br/login\n* **Seu Login (E-mail):** ${selected.email}\n* **Sua Senha Provisória:** _[forneça a senha ao participante]_\n\n*(Assim que entrar, você poderá alterar sua senha na aba "Perfil" no menu lateral).*\n\n---\n\n### 📅 Passo a Passo - Como Funciona a Área de Membros:\n\n1. **Faça o Login:** Acesse o link acima e insira suas credenciais.\n2. **Ative sua Jornada (Muito Importante!):** No primeiro dia do evento, vá até o seu **Dashboard** e utilize o leitor de QR Code para validar sua presença presencial. Isso irá destravar instantaneamente todos os downloads de materiais de apoio, modelos (ETP, TR), checklists e a seção de debates em vídeo!\n3. **Assista e Interaja:** Na aba **Programação**, você poderá assistir aos replays gravados das palestras, marcar cada aula como concluída e tirar dúvidas/debater no campo de comentários abaixo de cada vídeo com outros licitantes.\n4. **Monitore sua Evolução:** Acompanhe a sua barra de progresso na Dashboard. Concluir as aulas e tarefas recomendadas garantirá a liberação do seu **Certificado Digital de 40 Horas** oficial!\n\nPrepare-se para ir para o próximo nível! Estamos prontos para guiar você nessa jornada de excelência.\n\nNos vemos no congresso!\n*Equipe Envolve Consultoria e Assessoria*`
                    navigator.clipboard.writeText(text)
                    setCopySuccess(true)
                  }}
                >
                  {copySuccess ? 'Copiado!' : 'Copiar Mensagem'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  )
}
