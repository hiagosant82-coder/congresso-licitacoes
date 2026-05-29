import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useRequireAuth } from '../../hooks/useRequireAuth'
import { useNotificationStore } from '../../stores/notificationStore'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import SearchInput from '../../components/ui/SearchInput'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { Helmet } from 'react-helmet-async'
import { Upload, Trash2, FileText, Video, Image, File, ExternalLink, UserPlus, Check, X } from 'lucide-react'
import { formatDate } from '../../lib/utils'
import type { FileItem, Participant } from '../../types'

export default function AdminUpload() {
  const { loading } = useRequireAuth(['admin', 'operator'])
  const { user } = useAuthStore()
  const [files, setFiles] = useState<FileItem[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [visibleToAll, setVisibleToAll] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [assignTarget, setAssignTarget] = useState<FileItem | null>(null)
  const [assignParticipants, setAssignParticipants] = useState<Participant[]>([])
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set())
  const [assignSearch, setAssignSearch] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  const notify = useNotificationStore((s) => s.add)

  const loadFiles = useCallback(async () => {
    if (!user?.organization_id) {
      setPageLoading(false)
      return
    }

    const { error, data } = await supabase
      .from('files')
      .select('*')
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar arquivos:', error.message)
      setPageLoading(false)
      return
    }

    setFiles((data as FileItem[]) || [])
    setPageLoading(false)
  }, [user?.organization_id])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.organization_id) return

    setUploading(true)

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${user.organization_id}/${Date.now()}_${safeName}`
    const { error: uploadError } = await supabase.storage
      .from('materials')
      .upload(filePath, file)

    if (uploadError) {
      notify('Erro ao fazer upload: ' + uploadError.message, 'error')
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('materials').getPublicUrl(filePath)

    const { error: insertError } = await supabase.from('files').insert({
      organization_id: user.organization_id,
      name: name || file.name,
      description: description || null,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
      category: category || null,
      visible_to_all: visibleToAll,
    })

    if (insertError) {
      console.error('Erro ao registrar arquivo:', insertError.message)
      await supabase.storage.from('materials').remove([filePath])
      setUploading(false)
      return
    }

    setName('')
    setDescription('')
    setCategory('')
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    notify('Arquivo enviado com sucesso!', 'success')
    await loadFiles()
  }

  const handleDelete = async (file: FileItem) => {
    if (!window.confirm('Tem certeza que deseja excluir este arquivo?')) return

    const urlParts = file.file_url.split('/')
    const storagePath = urlParts.slice(urlParts.indexOf('materials') + 1).join('/')

    const { error: removeError } = await supabase.storage.from('materials').remove([storagePath])
    if (removeError) {
      notify('Erro ao remover arquivo do storage.', 'error')
    }

    const { error: deleteError } = await supabase.from('files').delete().eq('id', file.id)
    if (deleteError) {
      notify('Erro ao remover registro.', 'error')
    }

    notify('Arquivo excluído.', 'success')
    await loadFiles()
  }

  const openAssign = async (file: FileItem) => {
    setAssignTarget(file)
    setAssignSearch('')
    setAssignLoading(true)

    const { data: allParts } = await supabase
      .from('participants')
      .select('*')
      .eq('organization_id', user!.organization_id!)
      .order('full_name')

    setAssignParticipants((allParts as Participant[]) || [])

    const { data: existing } = await supabase
      .from('file_access')
      .select('participant_id')
      .eq('file_id', file.id)

    setAssignedIds(new Set((existing || []).map((a) => a.participant_id)))
    setAssignLoading(false)
  }

  const toggleAssignment = async (participantId: string) => {
    if (!assignTarget) return

    if (assignedIds.has(participantId)) {
      const { error } = await supabase
        .from('file_access')
        .delete()
        .eq('file_id', assignTarget.id)
        .eq('participant_id', participantId)

      if (error) {
        notify('Erro ao remover acesso.', 'error')
        return
      }

      setAssignedIds((prev) => {
        const next = new Set(prev)
        next.delete(participantId)
        return next
      })
    } else {
      const { error } = await supabase
        .from('file_access')
        .insert({
          file_id: assignTarget.id,
          participant_id: participantId,
        })

      if (error) {
        notify('Erro ao atribuir acesso.', 'error')
        return
      }

      setAssignedIds((prev) => new Set(prev).add(participantId))
    }
  }

  if (loading || !user) return <PageLoader />
  if (pageLoading) return <PageLoader />

  const typeIcon = (type: string) => {
    if (type.includes('video')) return <Video className="w-5 h-5" />
    if (type.includes('pdf')) return <FileText className="w-5 h-5" />
    if (type.includes('image')) return <Image className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  const filteredParticipants = assignSearch
    ? assignParticipants.filter((p) =>
        p.full_name.toLowerCase().includes(assignSearch.toLowerCase()) ||
        p.email.toLowerCase().includes(assignSearch.toLowerCase())
      )
    : assignParticipants

  return (
    <>
      <Helmet><title>Uploads | Admin</title></Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F5E6C4]">Upload de Materiais</h1>
          <p className="text-stone-500 mt-1">Gerencie arquivos, PDFs, vídeos e apresentações</p>
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-[#F5E6C4] mb-4">Novo upload</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input
              label="Nome do arquivo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Apresentação - Dia 1"
            />
            <Select
              label="Visibilidade"
              options={[
                { value: 'true', label: 'Visível para todos' },
                { value: 'false', label: 'Restrito (atribuir depois)' },
              ]}
              value={visibleToAll ? 'true' : 'false'}
              onChange={(e) => setVisibleToAll(e.target.value === 'true')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input
              label="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do material"
            />
            <Input
              label="Categoria (opcional)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Apresentações, PDFs"
            />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="primary" onClick={() => fileInputRef.current?.click()} loading={uploading}>
              <Upload className="w-4 h-4" /> Selecionar arquivo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleUpload}
            />
            <p className="text-xs text-stone-600">PDF, vídeos, imagens, apresentações</p>
          </div>
        </Card>

        {files.length === 0 ? (
          <EmptyState
            title="Nenhum arquivo enviado"
            description="Faça o upload do primeiro material para começar."
          />
        ) : (
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-800/50">
                    <th className="text-left p-4 text-stone-500 font-medium">Arquivo</th>
                    <th className="text-left p-4 text-stone-500 font-medium hidden md:table-cell">Categoria</th>
                    <th className="text-left p-4 text-stone-500 font-medium hidden lg:table-cell">Visibilidade</th>
                    <th className="text-left p-4 text-stone-500 font-medium hidden lg:table-cell">Tamanho</th>
                    <th className="text-left p-4 text-stone-500 font-medium hidden xl:table-cell">Data</th>
                    <th className="text-right p-4 text-stone-500 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.id} className="border-b border-stone-800/30 hover:bg-[#0A0706]">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="text-[#D4AF37]">{typeIcon(file.file_type)}</div>
                          <div>
                            <p className="font-medium text-stone-200">{file.name}</p>
                            {file.description && (
                              <p className="text-xs text-stone-500 truncate max-w-[200px]">{file.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-stone-400 hidden md:table-cell">{file.category || '-'}</td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          file.visible_to_all
                            ? 'bg-emerald-950/50 text-emerald-400'
                            : 'bg-amber-950/50 text-amber-400'
                        }`}>
                          {file.visible_to_all ? 'Todos' : 'Restrito'}
                        </span>
                      </td>
                      <td className="p-4 text-stone-500 hidden lg:table-cell">
                        {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : '-'}
                      </td>
                      <td className="p-4 text-stone-500 hidden xl:table-cell">{formatDate(file.created_at)}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!file.visible_to_all && (
                            <Button variant="ghost" size="sm" onClick={() => openAssign(file)} title="Atribuir a participantes">
                              <UserPlus className="w-4 h-4" />
                            </Button>
                          )}
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-stone-500 hover:text-[#D4AF37] transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(file)}>
                            <Trash2 className="w-4 h-4 text-red-400" />
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
          open={!!assignTarget}
          onClose={() => setAssignTarget(null)}
          title={`Atribuir: ${assignTarget?.name || ''}`}
          size="lg"
        >
          {assignTarget && (
            <div className="space-y-4">
              <p className="text-sm text-stone-400">
                Selecione os participantes que terão acesso a este arquivo.
              </p>

              <SearchInput
                value={assignSearch}
                onChange={setAssignSearch}
                placeholder="Buscar participante..."
              />

              {assignLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-1">
                  {filteredParticipants.length === 0 ? (
                    <p className="text-center text-stone-500 py-8 text-sm">
                      Nenhum participante encontrado.
                    </p>
                  ) : (
                    filteredParticipants.map((p) => {
                      const isAssigned = assignedIds.has(p.id)
                      return (
                        <button
                          key={p.id}
                          onClick={() => toggleAssignment(p.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                            isAssigned
                              ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30'
                              : 'bg-[#0A0706] border border-stone-800/50 hover:border-stone-700'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-stone-200">{p.full_name}</p>
                            <p className="text-xs text-stone-500">{p.email}</p>
                          </div>
                          <div>
                            {isAssigned ? (
                              <Check className="w-5 h-5 text-[#D4AF37]" />
                            ) : (
                              <div className="w-5 h-5" />
                            )}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-stone-800/50">
                <p className="text-sm text-stone-500">
                  {assignedIds.size} participante{assignedIds.size !== 1 ? 's' : ''} com acesso
                </p>
                <Button variant="outline" onClick={() => setAssignTarget(null)}>
                  <X className="w-4 h-4" /> Fechar
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  )
}
